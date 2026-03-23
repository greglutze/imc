import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ProjectConcept, ConversationMessage } from '../types';

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
    const { artist_name } = req.body;

    const projectResult = await pool.query(
      `INSERT INTO projects (user_id, org_id, status, artist_name, concept, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [user.id, user.org_id, 'draft', artist_name || null, JSON.stringify({})]
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
    const { artist_name, status, concept } = req.body;

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
