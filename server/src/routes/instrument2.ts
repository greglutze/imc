import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ProjectConcept, I1Report } from '../types';
import { generatePrompts, regenerateTrack } from '../services/instrument2';

const router = Router();

router.use(authMiddleware);

router.post(
  '/generate/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;

      const projectResult = await pool.query(
        'SELECT id, concept, moodboard_brief FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectResult.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const project = projectResult.rows[0];
      const concept = project.concept as ProjectConcept;

      if (!concept || !concept.genre_primary) {
        res.status(400).json({
          error: 'Project concept is incomplete. Please define concept first.',
        });
        return;
      }

      const latestI1Result = await pool.query(
        `SELECT id, report FROM instrument1_reports
         WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
        [projectId]
      );

      const reportId = latestI1Result.rows.length > 0 ? latestI1Result.rows[0].id : null;
      const report = latestI1Result.rows.length > 0 ? (latestI1Result.rows[0].report as I1Report) : null;

      const moodboardBrief = project.moodboard_brief || null;
      const prompts = await generatePrompts(concept, report, moodboardBrief);

      const versionResult = await pool.query(
        'SELECT COUNT(*) FROM instrument2_prompts WHERE project_id = $1',
        [projectId]
      );

      const version = parseInt(versionResult.rows[0].count) + 1;

      const result = await pool.query(
        `INSERT INTO instrument2_prompts (project_id, report_id, version, style_profile, vocalist_persona, tracks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          projectId,
          reportId,
          version,
          JSON.stringify(prompts.style_profile),
          JSON.stringify(prompts.vocalist_persona),
          JSON.stringify(prompts.tracks),
        ]
      );

      await pool.query(
        'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
        ['prompting', projectId]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/prompts/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM instrument2_prompts WHERE project_id = $1
         ORDER BY version DESC LIMIT 1`,
        [projectId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Prompts not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/prompts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { style_profile, vocalist_persona, tracks } = req.body;

    const promptCheck = await pool.query(
      `SELECT i2p.id FROM instrument2_prompts i2p
       JOIN projects p ON i2p.project_id = p.id
       WHERE i2p.id = $1 AND p.org_id = $2`,
      [id, user.org_id]
    );

    if (promptCheck.rows.length === 0) {
      res.status(403).json({ error: 'Prompts not found or not authorized' });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (style_profile !== undefined) {
      updates.push(`style_profile = $${paramCount++}`);
      values.push(JSON.stringify(style_profile));
    }

    if (vocalist_persona !== undefined) {
      updates.push(`vocalist_persona = $${paramCount++}`);
      values.push(JSON.stringify(vocalist_persona));
    }

    if (tracks !== undefined) {
      updates.push(`tracks = $${paramCount++}`);
      values.push(JSON.stringify(tracks));
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE instrument2_prompts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/regenerate-track/:id/:trackNumber',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id, trackNumber } = req.params;
      const trackNum = parseInt(trackNumber);

      const promptsResult = await pool.query(
        `SELECT i2p.id, i2p.project_id, i2p.style_profile, i2p.vocalist_persona, i2p.tracks
         FROM instrument2_prompts i2p
         JOIN projects p ON i2p.project_id = p.id
         WHERE i2p.id = $1 AND p.org_id = $2`,
        [id, user.org_id]
      );

      if (promptsResult.rows.length === 0) {
        res.status(403).json({ error: 'Prompts not found or not authorized' });
        return;
      }

      const promptsRecord = promptsResult.rows[0];
      const projectId = promptsRecord.project_id;

      const projectResult = await pool.query(
        'SELECT concept, moodboard_brief FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const concept = projectResult.rows[0].concept as ProjectConcept;
      const moodboardBrief = projectResult.rows[0].moodboard_brief || null;

      const latestI1Result = await pool.query(
        `SELECT report FROM instrument1_reports
         WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
        [projectId]
      );

      const report = latestI1Result.rows.length > 0 ? (latestI1Result.rows[0].report as I1Report) : null;

      const currentPrompts = {
        style_profile: promptsRecord.style_profile,
        vocalist_persona: promptsRecord.vocalist_persona,
        tracks: promptsRecord.tracks,
      };

      const newTrack = await regenerateTrack(concept, report, trackNum, currentPrompts, moodboardBrief);

      const updatedTracks = currentPrompts.tracks.map((t: { track_number: number }) =>
        t.track_number === trackNum ? newTrack : t
      );

      const result = await pool.query(
        `UPDATE instrument2_prompts SET tracks = $1 WHERE id = $2 RETURNING *`,
        [JSON.stringify(updatedTracks), id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
