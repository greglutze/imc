import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { analyzeMoodboard } from '../services/moodboard';

const router = Router();

router.use(authMiddleware);

// GET /api/moodboard/:projectId — list all images + brief
router.get('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id, moodboard_brief FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const images = await pool.query(
      'SELECT id, sort_order, created_at FROM moodboard_images WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC',
      [projectId]
    );

    res.json({
      images: images.rows,
      brief: projectCheck.rows[0].moodboard_brief || null,
      count: images.rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/moodboard/:projectId/images/:imageId — get single image data
router.get('/:projectId/images/:imageId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, imageId } = req.params;

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const result = await pool.query(
      'SELECT id, image_data, sort_order, created_at FROM moodboard_images WHERE id = $1 AND project_id = $2',
      [imageId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/moodboard/:projectId/thumbnails — get all image data (for grid display)
router.get('/:projectId/thumbnails', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const images = await pool.query(
      'SELECT id, image_data, sort_order, created_at FROM moodboard_images WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC',
      [projectId]
    );

    res.json(images.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/moodboard/:projectId/images — upload images (batch)
router.post('/:projectId/images', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { images } = req.body as { images: string[] };

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: 'images array required' });
      return;
    }

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check current count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM moodboard_images WHERE project_id = $1',
      [projectId]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount + images.length > 30) {
      res.status(400).json({
        error: `You've reached 30 images. Remove some to add more.`,
        current: currentCount,
        attempted: images.length,
        max: 30,
      });
      return;
    }

    // Insert images
    const inserted = [];
    for (let i = 0; i < images.length; i++) {
      const result = await pool.query(
        `INSERT INTO moodboard_images (project_id, image_data, sort_order, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING id, sort_order, created_at`,
        [projectId, images[i], currentCount + i]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json({ images: inserted, count: currentCount + images.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/moodboard/:projectId/images/:imageId — delete single image
router.delete('/:projectId/images/:imageId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, imageId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM moodboard_images WHERE id = $1 AND project_id = $2 RETURNING id',
      [imageId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Get updated count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM moodboard_images WHERE project_id = $1',
      [projectId]
    );

    res.json({ deleted: true, count: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/moodboard/:projectId/analyze — run AI analysis on collection
router.post('/:projectId/analyze', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id, moodboard_brief FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get all image data
    const imagesResult = await pool.query(
      'SELECT image_data FROM moodboard_images WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC',
      [projectId]
    );

    if (imagesResult.rows.length < 1) {
      res.status(400).json({ error: 'Upload at least one image to generate a sonic brief' });
      return;
    }

    const imageDataUrls = imagesResult.rows.map((row: { image_data: string }) => row.image_data);

    // Run analysis
    const brief = await analyzeMoodboard(imageDataUrls);

    // Preserve previous brief for version history
    const existingBrief = projectCheck.rows[0].moodboard_brief;
    if (existingBrief && existingBrief.prose) {
      brief.previous_prose = existingBrief.prose;
      brief.version = (existingBrief.version || 1) + 1;
      // Preserve existing flags
      brief.flagged_elements = existingBrief.flagged_elements || [];
    }

    // Save brief to project
    await pool.query(
      'UPDATE projects SET moodboard_brief = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(brief), projectId]
    );

    res.json({ brief });
  } catch (err) {
    console.error('Moodboard analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze moodboard' });
  }
});

// PATCH /api/moodboard/:projectId/brief/flag — flag/unflag a brief element
router.patch('/:projectId/brief/flag', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { element, flagged } = req.body as { element: string; flagged: boolean };

    const projectCheck = await pool.query(
      'SELECT id, moodboard_brief FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const brief = projectCheck.rows[0].moodboard_brief;
    if (!brief) {
      res.status(400).json({ error: 'No brief exists yet' });
      return;
    }

    const flaggedElements: string[] = brief.flagged_elements || [];

    if (flagged && !flaggedElements.includes(element)) {
      flaggedElements.push(element);
    } else if (!flagged) {
      const idx = flaggedElements.indexOf(element);
      if (idx !== -1) flaggedElements.splice(idx, 1);
    }

    brief.flagged_elements = flaggedElements;

    await pool.query(
      'UPDATE projects SET moodboard_brief = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(brief), projectId]
    );

    res.json({ brief });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
