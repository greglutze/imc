import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ConversationMessage } from '../types';
import { analyze } from '../services/ai';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const result = await pool.query(
      'SELECT * FROM projects WHERE org_id = $1 ORDER BY updated_at DESC',
      [user.org_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { artist_name, image_url } = req.body;

    const projectResult = await pool.query(
      `INSERT INTO projects (user_id, org_id, status, artist_name, image_url, concept, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [user.id, user.org_id, 'draft', artist_name || null, image_url || null, JSON.stringify({})]
    );

    const project = projectResult.rows[0];

    const conversationResult = await pool.query(
      `INSERT INTO concept_conversations (project_id, messages, extracted, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [project.id, JSON.stringify([]), false]
    );

    const conversation = conversationResult.rows[0];

    res.status(201).json({
      project,
      conversation_id: conversation.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Generate project name suggestions (must be before /:id routes) ──
router.post(
  '/generate-names',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { genres, vision, moods, artists, shape } = req.body;

      const contextParts: string[] = [];
      if (genres?.length) contextParts.push(`Genres: ${genres.join(', ')}`);
      if (vision) contextParts.push(`Vision: ${vision}`);
      if (moods?.length) contextParts.push(`Mood: ${moods.join(', ')}`);
      if (artists?.length) contextParts.push(`Influences: ${artists.join(', ')}`);
      if (shape) contextParts.push(`Format: ${shape}`);

      const userPrompt = contextParts.length > 0
        ? `Here's what I know about this music project:\n${contextParts.join('\n')}\n\nGenerate 10 creative project names.`
        : 'Generate 10 creative music project names that sound evocative and intriguing.';

      const systemPrompt = `You are a creative naming expert for music projects — albums, EPs, and singles.

Generate exactly 10 unique, evocative project names based on the user's creative context.

Rules:
- Names should feel like real album/EP/single titles — poetic, punchy, memorable
- Mix styles: some short (1-2 words), some longer (3-4 words), some with interesting juxtaposition
- Draw from the mood, genre, vision, and artistic influences provided
- Never use generic names like "Untitled" or "My Album"
- Never use the artist's name or reference artists directly
- Each name should feel distinct from the others
- Names should spark curiosity and feel premium

Return ONLY a JSON array of 10 strings, nothing else. Example:
["Midnight Architecture", "Soft Machines", "The Color of Distance", "Velvet Engine", "Glass Hours", "Neon Pastoral", "Thin Air", "Ghost Frequency", "After the Gold", "Silver Thread"]`;

      const result = await analyze(systemPrompt, userPrompt, { maxTokens: 512 });

      // Extract JSON array from response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        res.status(500).json({ error: 'Failed to generate names' });
        return;
      }

      const names = JSON.parse(jsonMatch[0]);
      res.json({ names });
    } catch (err) {
      console.error('[generate-names] Error:', err);
      res.status(500).json({ error: 'Failed to generate names' });
    }
  }
);

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND org_id = $2',
      [id, user.org_id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = projectResult.rows[0];

    const i1Result = await pool.query(
      'SELECT COUNT(*) FROM instrument1_reports WHERE project_id = $1',
      [id]
    );

    const i2Result = await pool.query(
      'SELECT COUNT(*) FROM instrument2_prompts WHERE project_id = $1',
      [id]
    );

    const i3Result = await pool.query(
      'SELECT COUNT(*) FROM instrument3_analyses WHERE project_id = $1',
      [id]
    );

    res.json({
      ...project,
      instrument1_report_count: parseInt(i1Result.rows[0].count),
      instrument2_prompts_count: parseInt(i2Result.rows[0].count),
      instrument3_analyses_count: parseInt(i3Result.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { artist_name, status, concept, image_url } = req.body;

    const checkResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [id, user.org_id]
    );

    if (checkResult.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (artist_name !== undefined) {
      updates.push(`artist_name = $${paramCount++}`);
      values.push(artist_name);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (concept !== undefined) {
      updates.push(`concept = $${paramCount++}`);
      values.push(JSON.stringify(concept));
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload project artist image (base64 JSON)
router.post('/:id/image/upload', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { data, contentType } = req.body;

    if (!data) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    const checkResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [id, user.org_id]
    );
    if (checkResult.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const buffer = Buffer.from(data, 'base64');
    const imageUrl = `/api/projects/${id}/image`;

    // Ensure columns exist
    try {
      await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_data bytea`);
      await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_content_type text`);
    } catch (_e) { /* columns exist */ }

    await pool.query(
      `UPDATE projects
       SET image_data = $1, image_content_type = $2,
           image_url = $3, updated_at = NOW()
       WHERE id = $4`,
      [buffer, contentType || 'image/jpeg', imageUrl, id]
    );

    res.json({ image_url: imageUrl });
  } catch (err) {
    console.error('Project image upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [id, user.org_id]
    );

    if (checkResult.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    // Delete child rows that lack ON DELETE CASCADE
    await pool.query('DELETE FROM instrument3_analyses WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM instrument2_prompts WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM instrument1_reports WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM concept_conversations WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM audio_files WHERE project_id = $1', [id]);

    // Delete project (remaining child tables have ON DELETE CASCADE)
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/:id/conversation',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { role, content } = req.body;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [id, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const convResult = await pool.query(
        'SELECT messages FROM concept_conversations WHERE project_id = $1',
        [id]
      );

      if (convResult.rows.length === 0) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      const messages: ConversationMessage[] = convResult.rows[0].messages || [];
      const newMessage: ConversationMessage = {
        role,
        content,
        timestamp: new Date().toISOString(),
      };

      messages.push(newMessage);

      const updateResult = await pool.query(
        'UPDATE concept_conversations SET messages = $1 WHERE project_id = $2 RETURNING *',
        [JSON.stringify(messages), id]
      );

      res.json(updateResult.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/:id/conversation',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [id, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM concept_conversations WHERE project_id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/:id/concept/extract',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { concept } = req.body;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [id, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      await pool.query(
        'UPDATE concept_conversations SET extracted = true WHERE project_id = $1',
        [id]
      );

      const projectResult = await pool.query(
        'UPDATE projects SET concept = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(concept), id]
      );

      res.json(projectResult.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
