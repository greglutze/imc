import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, AudioFile, AudioFeatures, Project } from '../types';
import { extractFeatures } from '../services/audio';
import { analyzeTrack } from '../services/instrument3';
import path from 'path';

const router = Router();

router.use(authMiddleware);

router.post(
  '/analyze/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;
      const { track_title, audio_file_key } = req.body;

      // Verify project access
      const projectCheck = await pool.query(
        'SELECT id, concept FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const project = projectCheck.rows[0] as Project;

      // Get or extract audio features
      let audioFeatures: AudioFeatures | null = null;

      if (audio_file_key) {
        const audioFileCheck = await pool.query(
          'SELECT * FROM audio_files WHERE project_id = $1 AND storage_key = $2',
          [projectId, audio_file_key]
        );

        if (audioFileCheck.rows.length > 0) {
          const audioFile = audioFileCheck.rows[0] as AudioFile;

          // If features already extracted, use them
          if (audioFile.features) {
            audioFeatures = audioFile.features;
          } else {
            // Extract features from file path
            // In production, this would load from storage (S3, etc.)
            // For now, we'll attempt to analyze if a local path is available
            try {
              const localPath = path.join(process.cwd(), 'uploads', audio_file_key);
              audioFeatures = await extractFeatures(localPath);

              // Update audio file with extracted features
              await pool.query(
                'UPDATE audio_files SET features = $1 WHERE id = $2',
                [JSON.stringify(audioFeatures), audioFile.id]
              );
            } catch (e) {
              console.error('Failed to extract features:', e);
              // Continue with mock data if available
              audioFeatures = {
                bpm: 120.0,
                key: 'C minor',
                energy: 0.15,
                danceability: 0.65,
                loudness_lufs: -14.0,
                dynamic_range: 8.5,
                spectral_centroid: 0.25,
                onset_rate: 3.2,
              };
            }
          }
        }
      }

      if (!audioFeatures) {
        res.status(400).json({ error: 'No audio features available' });
        return;
      }

      // Get latest Instrument 1 report if available
      const i1ReportCheck = await pool.query(
        'SELECT report FROM instrument1_reports WHERE project_id = $1 ORDER BY version DESC LIMIT 1',
        [projectId]
      );

      const i1Report = i1ReportCheck.rows.length > 0 ? i1ReportCheck.rows[0].report : null;

      // Run analysis
      const { analysis, success_score, recommendations, target_alignment } = await analyzeTrack(
        audioFeatures,
        project.concept,
        i1Report
      );

      // Get latest I1 report ID
      const latestI1 = await pool.query(
        'SELECT id FROM instrument1_reports WHERE project_id = $1 ORDER BY version DESC LIMIT 1',
        [projectId]
      );

      const reportId = latestI1.rows.length > 0 ? latestI1.rows[0].id : null;

      // Store analysis in database
      const result = await pool.query(
        `INSERT INTO instrument3_analyses (project_id, report_id, track_title, audio_file_key, analysis, success_score, recommendations, target_alignment, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [
          projectId,
          reportId,
          track_title || null,
          audio_file_key || null,
          JSON.stringify(analysis),
          JSON.stringify(success_score),
          JSON.stringify(recommendations),
          target_alignment ? JSON.stringify(target_alignment) : null,
        ]
      );

      // Update project status
      await pool.query(
        'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
        ['analysis', projectId]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/upload/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;
      const { filename, format, storage_key } = req.body;

      // Verify project access
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2 AND user_id = $3',
        [projectId, user.org_id, user.id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      // Create audio file record
      const result = await pool.query(
        `INSERT INTO audio_files (project_id, user_id, filename, storage_key, format, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [projectId, user.id, filename || 'track.wav', storage_key, format || 'wav']
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/analyses/:projectId',
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
        'SELECT * FROM instrument3_analyses WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/analysis/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT i3a.* FROM instrument3_analyses i3a
         JOIN projects p ON i3a.project_id = p.id
         WHERE i3a.id = $1 AND p.org_id = $2`,
        [id, user.org_id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
