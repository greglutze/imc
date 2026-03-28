import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { uploadArtwork } from '../services/storage';

const router = Router();

function generateSlug(): string {
  return crypto.randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
}

/**
 * Convert a Dropbox shared link to a direct download/streaming URL.
 * e.g. https://www.dropbox.com/scl/fi/.../file.mp3?rlkey=abc&dl=0
 *   → https://dl.dropboxusercontent.com/scl/fi/.../file.mp3?rlkey=abc&dl=1
 */
function toDropboxDirectUrl(url: string): string {
  let direct = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  direct = direct.replace(/[?&]dl=0/, (m) => m[0] + 'dl=1');
  if (!direct.includes('dl=1')) {
    direct += (direct.includes('?') ? '&' : '?') + 'dl=1';
  }
  return direct;
}

/**
 * Extract a clean track title from a Dropbox URL or filename.
 */
function titleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = decodeURIComponent(pathname.split('/').pop() || 'Untitled');
    return filename
      .replace(/\.[^.]+$/, '')  // remove extension
      .replace(/[_-]/g, ' ')   // replace underscores/dashes with spaces
      .replace(/\s+/g, ' ')    // normalize whitespace
      .trim() || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

/**
 * Extract file extension from a Dropbox URL.
 */
function formatFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext)) {
      return ext;
    }
  } catch {
    // ignore
  }
  return 'mp3';
}

// ── Authenticated routes (artist dashboard) ──

const authRouter = Router();
authRouter.use(authMiddleware);

// List share projects for a project
authRouter.get('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const result = await pool.query(
      `SELECT sp.*,
              (SELECT COUNT(*) FROM share_tracks WHERE share_project_id = sp.id) as track_count
       FROM share_projects sp
       WHERE sp.project_id = $1
       ORDER BY sp.updated_at DESC`,
      [projectId]
    );

    res.json({ projects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a share project
authRouter.post('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { title } = req.body;

    const projectCheck = await pool.query(
      'SELECT id, artist_name FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const slug = generateSlug();
    const projectTitle = title || projectCheck.rows[0].artist_name || 'Untitled Project';

    const result = await pool.query(
      `INSERT INTO share_projects (project_id, title, slug)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, projectTitle, slug]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a share project with tracks
authRouter.get('/:projectId/share/:shareId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const shareResult = await pool.query(
      'SELECT * FROM share_projects WHERE id = $1 AND project_id = $2',
      [shareId, projectId]
    );
    if (shareResult.rows.length === 0) {
      res.status(404).json({ error: 'Share project not found' });
      return;
    }

    const tracksResult = await pool.query(
      'SELECT id, share_project_id, title, original_filename, dropbox_url, format, duration_ms, file_size_bytes, sort_order, play_count, created_at FROM share_tracks WHERE share_project_id = $1 ORDER BY sort_order ASC',
      [shareId]
    );

    res.json({
      ...shareResult.rows[0],
      tracks: tracksResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update share project settings
authRouter.patch('/:projectId/share/:shareId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;
    const { title, is_public, downloads_enabled, theme } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
    if (is_public !== undefined) { updates.push(`is_public = $${idx++}`); values.push(is_public); }
    if (downloads_enabled !== undefined) { updates.push(`downloads_enabled = $${idx++}`); values.push(downloads_enabled); }
    if (theme !== undefined) { updates.push(`theme = $${idx++}`); values.push(theme); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(shareId, projectId);

    const result = await pool.query(
      `UPDATE share_projects SET ${updates.join(', ')}
       WHERE id = $${idx++} AND project_id = $${idx}
       RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set password
authRouter.patch('/:projectId/share/:shareId/password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;
    const { password } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const hash = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

    await pool.query(
      'UPDATE share_projects SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND project_id = $3',
      [hash, shareId, projectId]
    );

    res.json({ password_set: !!password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate link (new slug)
authRouter.post('/:projectId/share/:shareId/regenerate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const newSlug = generateSlug();
    const result = await pool.query(
      'UPDATE share_projects SET slug = $1, updated_at = NOW() WHERE id = $2 AND project_id = $3 RETURNING *',
      [newSlug, shareId, projectId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload artwork (raw binary — artwork is small, still OK to store in DB)
authRouter.post(
  '/:projectId/share/:shareId/artwork/upload',
  express.raw({ limit: '10mb', type: ['image/*', 'application/octet-stream'] }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId, shareId } = req.params;
      const filename = decodeURIComponent((req.headers['x-filename'] as string) || 'artwork.jpg');
      const contentType = req.headers['content-type'] || 'image/jpeg';

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );
      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const buffer = req.body as Buffer;
      const result = await uploadArtwork(buffer, filename, contentType);

      await pool.query(
        'UPDATE share_projects SET artwork_url = $1, updated_at = NOW() WHERE id = $2 AND project_id = $3',
        [result.url, shareId, projectId]
      );

      res.json({ artwork_url: result.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Add track via Dropbox link
authRouter.post('/:projectId/share/:shareId/tracks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;
    const { dropbox_url, title } = req.body;

    if (!dropbox_url || typeof dropbox_url !== 'string') {
      res.status(400).json({ error: 'dropbox_url is required' });
      return;
    }

    // Validate it looks like a Dropbox link
    if (!dropbox_url.includes('dropbox.com') && !dropbox_url.includes('dropboxusercontent.com')) {
      res.status(400).json({ error: 'Please provide a Dropbox shared link' });
      return;
    }

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Check track limit
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM share_tracks WHERE share_project_id = $1',
      [shareId]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount >= 50) {
      res.status(400).json({ error: 'Maximum 50 tracks per project' });
      return;
    }

    const directUrl = toDropboxDirectUrl(dropbox_url);
    const trackTitle = title || titleFromUrl(dropbox_url);
    const format = formatFromUrl(dropbox_url);

    const trackResult = await pool.query(
      `INSERT INTO share_tracks (share_project_id, title, dropbox_url, format, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, share_project_id, title, original_filename, dropbox_url, format, duration_ms, file_size_bytes, sort_order, play_count, created_at`,
      [shareId, trackTitle, directUrl, format, currentCount]
    );

    await pool.query(
      'UPDATE share_projects SET updated_at = NOW() WHERE id = $1',
      [shareId]
    );

    res.json(trackResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add multiple tracks via Dropbox links
authRouter.post('/:projectId/share/:shareId/tracks/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;
    const { links } = req.body; // Array of { dropbox_url, title? }

    if (!Array.isArray(links) || links.length === 0) {
      res.status(400).json({ error: 'links array is required' });
      return;
    }

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM share_tracks WHERE share_project_id = $1',
      [shareId]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount + links.length > 50) {
      res.status(400).json({ error: 'Maximum 50 tracks per project' });
      return;
    }

    const tracks = [];
    for (let i = 0; i < links.length; i++) {
      const { dropbox_url, title } = links[i];
      if (!dropbox_url || !dropbox_url.includes('dropbox')) continue;

      const directUrl = toDropboxDirectUrl(dropbox_url);
      const trackTitle = title || titleFromUrl(dropbox_url);
      const format = formatFromUrl(dropbox_url);

      const trackResult = await pool.query(
        `INSERT INTO share_tracks (share_project_id, title, dropbox_url, format, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, share_project_id, title, original_filename, dropbox_url, format, duration_ms, file_size_bytes, sort_order, play_count, created_at`,
        [shareId, trackTitle, directUrl, format, currentCount + i]
      );
      tracks.push(trackResult.rows[0]);
    }

    await pool.query(
      'UPDATE share_projects SET updated_at = NOW() WHERE id = $1',
      [shareId]
    );

    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rename a track
authRouter.patch('/:projectId/share/:shareId/tracks/:trackId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId, trackId } = req.params;
    const { title } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const result = await pool.query(
      `UPDATE share_tracks SET title = $1
       WHERE id = $2 AND share_project_id = $3
       RETURNING *`,
      [title, trackId, shareId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder tracks
authRouter.patch('/:projectId/share/:shareId/reorder', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;
    const { track_ids } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    for (let i = 0; i < track_ids.length; i++) {
      await pool.query(
        'UPDATE share_tracks SET sort_order = $1 WHERE id = $2 AND share_project_id = $3',
        [i, track_ids[i], shareId]
      );
    }

    const tracksResult = await pool.query(
      'SELECT id, share_project_id, title, original_filename, dropbox_url, format, duration_ms, file_size_bytes, sort_order, play_count, created_at FROM share_tracks WHERE share_project_id = $1 ORDER BY sort_order ASC',
      [shareId]
    );

    res.json({ tracks: tracksResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a track
authRouter.delete('/:projectId/share/:shareId/tracks/:trackId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId, trackId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await pool.query(
      'DELETE FROM share_tracks WHERE id = $1 AND share_project_id = $2',
      [trackId, shareId]
    );

    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a share project
authRouter.delete('/:projectId/share/:shareId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, shareId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await pool.query(
      'DELETE FROM share_projects WHERE id = $1 AND project_id = $2',
      [shareId, projectId]
    );

    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Public routes (listener page) ──

const publicRouter = Router();

// Get share by slug (public listener endpoint)
publicRouter.get('/s/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const shareResult = await pool.query(
      'SELECT * FROM share_projects WHERE slug = $1',
      [slug]
    );

    if (shareResult.rows.length === 0) {
      res.status(404).json({ error: 'This project is not available.' });
      return;
    }

    const share = shareResult.rows[0];

    if (!share.is_public) {
      res.status(403).json({ error: 'This project is not available.' });
      return;
    }

    // If password protected, check for session token
    if (share.password_hash) {
      const token = req.headers['x-share-token'];
      if (!token || token !== share.password_hash) {
        res.json({
          id: share.id,
          title: share.title,
          artwork_url: share.artwork_url,
          theme: share.theme,
          password_required: true,
          downloads_enabled: false,
          tracks: [],
        });
        return;
      }
    }

    const tracksResult = await pool.query(
      'SELECT id, title, dropbox_url, format, duration_ms, sort_order FROM share_tracks WHERE share_project_id = $1 ORDER BY sort_order ASC',
      [share.id]
    );

    // Increment play count
    await pool.query(
      'UPDATE share_projects SET total_plays = total_plays + 1, last_listened_at = NOW() WHERE id = $1',
      [share.id]
    );

    res.json({
      id: share.id,
      title: share.title,
      artwork_url: share.artwork_url,
      theme: share.theme,
      downloads_enabled: share.downloads_enabled,
      password_required: false,
      tracks: tracksResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify password
publicRouter.post('/s/:slug/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const shareResult = await pool.query(
      'SELECT password_hash FROM share_projects WHERE slug = $1',
      [slug]
    );

    if (shareResult.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash === shareResult.rows[0].password_hash) {
      res.json({ verified: true, token: hash });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track play event
publicRouter.post('/s/:slug/play/:trackId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;

    await pool.query(
      'UPDATE share_tracks SET play_count = play_count + 1 WHERE id = $1',
      [trackId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Combine both routers
router.use('/share', authRouter);
router.use(publicRouter);

export default router;
