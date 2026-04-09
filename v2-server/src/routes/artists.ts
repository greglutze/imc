import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// All artist routes require auth
router.use(authMiddleware);

// List artists for current user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM artists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[V2] List artists error:', err);
    res.status(500).json({ error: 'Failed to list artists' });
  }
});

// Create artist identity
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bio } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Artist name is required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO artists (user_id, name, bio) VALUES ($1, $2, $3) RETURNING *',
      [req.user!.id, name, bio || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Create artist error:', err);
    res.status(500).json({ error: 'Failed to create artist' });
  }
});

// Get single artist (with ownership check)
router.get('/:artistId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM artists WHERE id = $1 AND user_id = $2',
      [req.params.artistId, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Get artist error:', err);
    res.status(500).json({ error: 'Failed to get artist' });
  }
});

// Update artist
router.patch('/:artistId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bio, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE artists SET
        name = COALESCE($1, name),
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url),
        updated_at = now()
      WHERE id = $4 AND user_id = $5
      RETURNING *`,
      [name, bio, avatar_url, req.params.artistId, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[V2] Update artist error:', err);
    res.status(500).json({ error: 'Failed to update artist' });
  }
});

export default router;
