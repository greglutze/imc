import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { embedArchiveItem, backfillEmbeddings } from '../services/embeddings';

const router = Router();

router.use(authMiddleware);

// List archive items for an artist
router.get('/:artistId/items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify artist ownership
    const artistCheck = await pool.query(
      'SELECT id FROM artists WHERE id = $1 AND user_id = $2',
      [req.params.artistId, req.user!.id]
    );
    if (artistCheck.rows.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    const { content_type, source, limit = '50', offset = '0' } = req.query;

    let query = 'SELECT id, artist_id, content_type, title, raw_text, file_key, file_url, metadata, source, is_external, external_api, created_at, (image_data IS NOT NULL) AS has_image FROM archive_items WHERE artist_id = $1';
    const params: (string | number)[] = [req.params.artistId];
    let paramIdx = 2;

    if (content_type) {
      query += ` AND content_type = $${paramIdx}`;
      params.push(content_type as string);
      paramIdx++;
    }
    if (source) {
      query += ` AND source = $${paramIdx}`;
      params.push(source as string);
      paramIdx++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[V2] List archive items error:', err);
    res.status(500).json({ error: 'Failed to list archive items' });
  }
});

// Get single archive item
router.get('/:artistId/items/:itemId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const artistCheck = await pool.query(
      'SELECT id FROM artists WHERE id = $1 AND user_id = $2',
      [req.params.artistId, req.user!.id]
    );
    if (artistCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not your artist' });
      return;
    }

    const result = await pool.query(
      `SELECT id, artist_id, content_type, title, raw_text, file_key, file_url, metadata, source, is_external, created_at,
        CASE WHEN image_data IS NOT NULL THEN true ELSE false END as has_image
       FROM archive_items WHERE id = $1 AND artist_id = $2`,
      [req.params.itemId, req.params.artistId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Error fetching archive item:', err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Add item to archive (text, link — binary uploads handled separately)
router.post('/:artistId/items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const artistCheck = await pool.query(
      'SELECT id FROM artists WHERE id = $1 AND user_id = $2',
      [req.params.artistId, req.user!.id]
    );
    if (artistCheck.rows.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    const { content_type, title, raw_text, file_url, metadata } = req.body;
    if (!content_type) {
      res.status(400).json({ error: 'content_type is required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO archive_items (artist_id, content_type, title, raw_text, file_url, metadata, source)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'user_upload')
       RETURNING *`,
      [
        req.params.artistId,
        content_type,
        title || null,
        raw_text || null,
        file_url || null,
        JSON.stringify(metadata || {}),
      ]
    );

    // Generate embedding asynchronously (don't block the response)
    const itemId = result.rows[0].id;
    embedArchiveItem(itemId).catch(err => {
      console.error(`[V2] Background embedding failed for ${itemId}:`, err);
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Create archive item error:', err);
    res.status(500).json({ error: 'Failed to create archive item' });
  }
});

// Upload image to archive
router.post('/:artistId/items/image', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const artistCheck = await pool.query(
      'SELECT id FROM artists WHERE id = $1 AND user_id = $2',
      [req.params.artistId, req.user!.id]
    );
    if (artistCheck.rows.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    const { title, image_data, image_content_type, metadata } = req.body;
    if (!image_data) {
      res.status(400).json({ error: 'image_data is required (base64)' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO archive_items (artist_id, content_type, title, image_data, image_content_type, metadata, source)
       VALUES ($1, 'image', $2, $3, $4, $5::jsonb, 'user_upload')
       RETURNING id, artist_id, content_type, title, metadata, source, is_external, created_at`,
      [
        req.params.artistId,
        title || null,
        image_data,
        image_content_type || 'image/jpeg',
        JSON.stringify(metadata || {}),
      ]
    );

    // Embed based on title + metadata (no raw image embedding yet)
    const itemId = result.rows[0].id;
    if (title) {
      embedArchiveItem(itemId).catch(err => {
        console.error(`[V2] Background embedding failed for ${itemId}:`, err);
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Serve archive image (public, no auth needed for display)
router.get('/:artistId/items/:itemId/image', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT image_data, image_content_type FROM archive_items WHERE id = $1 AND artist_id = $2',
      [req.params.itemId, req.params.artistId]
    );
    if (result.rows.length === 0 || !result.rows[0].image_data) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    const { image_data, image_content_type } = result.rows[0];
    const buffer = Buffer.from(image_data, 'base64');
    res.set('Content-Type', image_content_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('[V2] Serve image error:', err);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Find similar items (vector similarity search)
router.get('/:artistId/items/:itemId/similar', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '5' } = req.query;

    // Get the source item's embedding
    const itemResult = await pool.query(
      'SELECT embedding FROM archive_items WHERE id = $1 AND artist_id = $2',
      [req.params.itemId, req.params.artistId]
    );
    if (itemResult.rows.length === 0 || !itemResult.rows[0].embedding) {
      res.status(404).json({ error: 'Item not found or not yet embedded' });
      return;
    }

    // Cosine similarity search
    const similar = await pool.query(
      `SELECT id, content_type, title, raw_text, metadata, source, created_at,
              1 - (embedding <=> $1::vector) AS similarity
       FROM archive_items
       WHERE artist_id = $2 AND id != $3 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      [itemResult.rows[0].embedding, req.params.artistId, req.params.itemId, Number(limit)]
    );

    res.json(similar.rows);
  } catch (err) {
    console.error('[V2] Similar items error:', err);
    res.status(500).json({ error: 'Failed to find similar items' });
  }
});

// Search archive by natural language query (embed the query, find nearest items)
router.get('/:artistId/search', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, limit = '10' } = req.query;
    if (!q) {
      res.status(400).json({ error: 'Query parameter q is required' });
      return;
    }

    const { generateEmbedding } = await import('../services/embeddings');
    const queryEmbedding = await generateEmbedding(q as string);

    if (queryEmbedding.length === 0) {
      res.status(503).json({ error: 'Embedding service not configured' });
      return;
    }

    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const results = await pool.query(
      `SELECT id, content_type, title, raw_text, metadata, source, created_at,
              1 - (embedding <=> $1::vector) AS similarity
       FROM archive_items
       WHERE artist_id = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vectorStr, req.params.artistId, Number(limit)]
    );

    res.json(results.rows);
  } catch (err) {
    console.error('[V2] Archive search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Backfill embeddings for items that don't have them yet
router.post('/:artistId/backfill-embeddings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_size = 10 } = req.body;
    const count = await backfillEmbeddings(req.params.artistId, batch_size);
    res.json({ embedded: count });
  } catch (err) {
    console.error('[V2] Backfill error:', err);
    res.status(500).json({ error: 'Backfill failed' });
  }
});

// Record interaction (feedback loop)
router.post('/:artistId/items/:itemId/interact', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interaction_type, project_id } = req.body;
    if (!interaction_type) {
      res.status(400).json({ error: 'interaction_type is required' });
      return;
    }

    await pool.query(
      `INSERT INTO archive_interactions (artist_id, item_id, interaction_type, project_id)
       VALUES ($1, $2, $3, $4)`,
      [req.params.artistId, req.params.itemId, interaction_type, project_id || null]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[V2] Record interaction error:', err);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

export default router;
