import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ConversationMessage } from '../types';
import { runMarketResearch } from '../services/instrument1';
import { getConceptResponse } from '../services/concept';

const router = Router();

router.use(authMiddleware);

router.post(
  '/run/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;

      const projectCheck = await pool.query(
        'SELECT id, concept FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const project = projectCheck.rows[0];

      if (!project.concept || Object.keys(project.concept).length === 0) {
        console.warn(`[research] Project ${projectId}: concept is empty — cannot run research`);
        res.status(400).json({ error: 'Project concept is empty or not extracted' });
        return;
      }

      console.log(`[research] Project ${projectId}: running market research (genre=${project.concept.genre_primary})`);
      const { report, confidence } = await runMarketResearch(project.concept);

      await pool.query(
        'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
        ['research', projectId]
      );

      const versionResult = await pool.query(
        'SELECT COUNT(*) FROM instrument1_reports WHERE project_id = $1',
        [projectId]
      );

      const version = parseInt(versionResult.rows[0].count) + 1;

      const result = await pool.query(
        `INSERT INTO instrument1_reports (project_id, version, report, confidence, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [projectId, version, JSON.stringify(report), JSON.stringify(confidence)]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/conversation/:projectId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId } = req.params;
      const { role, content, immediate } = req.body;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const convResult = await pool.query(
        'SELECT messages FROM concept_conversations WHERE project_id = $1',
        [projectId]
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

      console.log(`[conversation] Project ${projectId}: sending ${messages.length} messages (immediate=${!!immediate})`);
      const conceptResponse = await getConceptResponse(messages, !!immediate);
      console.log(`[conversation] Project ${projectId}: conceptReady=${conceptResponse.conceptReady}, hasConcept=${!!conceptResponse.extractedConcept}`);

      messages.push({
        role: 'assistant',
        content: conceptResponse.response,
        timestamp: new Date().toISOString(),
      });

      let projectUpdate = {
        extracted: conceptResponse.conceptReady,
      };

      if (conceptResponse.conceptReady && conceptResponse.extractedConcept) {
        await pool.query(
          'UPDATE projects SET concept = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(conceptResponse.extractedConcept), projectId]
        );
        console.log(`[conversation] Project ${projectId}: concept saved to DB`);
      }

      await pool.query('UPDATE concept_conversations SET messages = $1, extracted = $2 WHERE project_id = $3', [
        JSON.stringify(messages),
        projectUpdate.extracted,
        projectId,
      ]);

      res.json({
        response: conceptResponse.response,
        conceptReady: conceptResponse.conceptReady,
        concept: conceptResponse.extractedConcept,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/report/:projectId',
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
        `SELECT * FROM instrument1_reports WHERE project_id = $1
         ORDER BY version DESC LIMIT 1`,
        [projectId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/report/:projectId/:version',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { projectId, version } = req.params;

      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, user.org_id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(403).json({ error: 'Project not found or not authorized' });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM instrument1_reports WHERE project_id = $1 AND version = $2`,
        [projectId, parseInt(version)]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Report not found' });
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
