import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, LyricSessionMessage } from '../types';
import { advisorChat, generateLyricThemes } from '../services/lyricAdvisor';

const router = Router();
router.use(authMiddleware);

// List sessions for a project
router.get('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
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
      `SELECT id, project_id, title, entry_mode, created_at, updated_at,
              LEFT(lyrics, 100) as lyrics_preview,
              jsonb_array_length(messages) as message_count
       FROM lyric_sessions
       WHERE project_id = $1
       ORDER BY updated_at DESC`,
      [projectId]
    );

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single session
router.get('/:projectId/session/:sessionId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM lyric_sessions WHERE id = $1 AND project_id = $2',
      [sessionId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new session
router.post('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { entry_mode, title, lyrics, vibe_context } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO lyric_sessions (project_id, entry_mode, title, lyrics, vibe_context)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, entry_mode || 'conversation', title || null, lyrics || '', vibe_context || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lyrics (auto-save)
router.patch('/:projectId/session/:sessionId/lyrics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;
    const { lyrics } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    // Auto-generate title from first line if none exists
    const sessionResult = await pool.query(
      'SELECT title FROM lyric_sessions WHERE id = $1 AND project_id = $2',
      [sessionId, projectId]
    );
    if (sessionResult.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    let titleUpdate = '';
    const titleParams: string[] = [lyrics, sessionId, projectId];
    if (!sessionResult.rows[0].title && lyrics.trim()) {
      const firstLine = lyrics.trim().split('\n')[0].substring(0, 60);
      titleUpdate = ', title = $4';
      titleParams.push(firstLine);
    }

    const result = await pool.query(
      `UPDATE lyric_sessions SET lyrics = $1, updated_at = NOW()${titleUpdate}
       WHERE id = $2 AND project_id = $3
       RETURNING id, lyrics, title, updated_at`,
      titleParams
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session title
router.patch('/:projectId/session/:sessionId/title', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;
    const { title } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const result = await pool.query(
      `UPDATE lyric_sessions SET title = $1, updated_at = NOW()
       WHERE id = $2 AND project_id = $3
       RETURNING *`,
      [title, sessionId, projectId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message to the advisor
router.post('/:projectId/session/:sessionId/message', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;
    const { content, type } = req.body;

    const projectCheck = await pool.query(
      'SELECT id, concept, moodboard_brief FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const project = projectCheck.rows[0];

    const sessionResult = await pool.query(
      'SELECT * FROM lyric_sessions WHERE id = $1 AND project_id = $2',
      [sessionId, projectId]
    );
    if (sessionResult.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const session = sessionResult.rows[0];
    const messages: LyricSessionMessage[] = session.messages || [];

    // Add user message
    const userMessage: LyricSessionMessage = {
      role: 'user',
      content,
      type: type || 'chat',
      timestamp: new Date().toISOString(),
    };
    messages.push(userMessage);

    // Get advisor response
    const advisorResponse = await advisorChat(
      messages,
      session.lyrics || '',
      {
        concept: project.concept,
        moodboardBrief: project.moodboard_brief,
        vibeContext: session.vibe_context,
        entryMode: session.entry_mode,
      },
      type !== 'chat' ? type : undefined
    );

    // Add advisor message
    const advisorMessage: LyricSessionMessage = {
      role: 'advisor',
      content: advisorResponse,
      type: type || 'chat',
      timestamp: new Date().toISOString(),
    };
    messages.push(advisorMessage);

    // Auto-title from first user message if no title
    let titleUpdate = '';
    const params: string[] = [JSON.stringify(messages), sessionId, projectId];
    if (!session.title && content.trim()) {
      const autoTitle = content.trim().substring(0, 60);
      titleUpdate = ', title = $4';
      params.push(autoTitle);
    }

    await pool.query(
      `UPDATE lyric_sessions SET messages = $1, updated_at = NOW()${titleUpdate}
       WHERE id = $2 AND project_id = $3`,
      params
    );

    res.json({
      userMessage,
      advisorMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dismiss a message
router.patch('/:projectId/session/:sessionId/dismiss', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;
    const { messageIndex } = req.body;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const sessionResult = await pool.query(
      'SELECT messages FROM lyric_sessions WHERE id = $1 AND project_id = $2',
      [sessionId, projectId]
    );
    if (sessionResult.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const messages: LyricSessionMessage[] = sessionResult.rows[0].messages || [];
    if (messageIndex >= 0 && messageIndex < messages.length) {
      messages[messageIndex].dismissed = true;
    }

    await pool.query(
      'UPDATE lyric_sessions SET messages = $1 WHERE id = $2 AND project_id = $3',
      [JSON.stringify(messages), sessionId, projectId]
    );

    res.json({ dismissed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a session
router.delete('/:projectId/session/:sessionId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, sessionId } = req.params;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectCheck.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    await pool.query(
      'DELETE FROM lyric_sessions WHERE id = $1 AND project_id = $2',
      [sessionId, projectId]
    );

    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ensure lyric_themes column exists (runs once)
let themesColumnEnsured = false;
async function ensureThemesColumn(): Promise<void> {
  if (themesColumnEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS lyric_themes jsonb DEFAULT NULL
    `);
    themesColumnEnsured = true;
  } catch (_e) {
    // Column might already exist, that's fine
    themesColumnEnsured = true;
  }
}

// Get lyric themes (cached) or generate new ones
router.get('/:projectId/themes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const regenerate = req.query.regenerate === 'true';

    await ensureThemesColumn();

    const projectResult = await pool.query(
      'SELECT id, concept, moodboard_brief, lyric_themes FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, user.org_id]
    );
    if (projectResult.rows.length === 0) {
      res.status(403).json({ error: 'Project not found or not authorized' });
      return;
    }

    const project = projectResult.rows[0];

    // Return cached themes if available and not regenerating
    if (!regenerate && project.lyric_themes && Array.isArray(project.lyric_themes) && project.lyric_themes.length > 0) {
      res.json({ themes: project.lyric_themes });
      return;
    }

    // Fetch tracks from instrument2_prompts if they exist
    let tracks: Array<{ track_number: number; title: string; suno_prompt: string; udio_prompt: string; structure: string; notes: string }> = [];
    try {
      const tracksResult = await pool.query(
        `SELECT tracks FROM instrument2_prompts WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
        [projectId]
      );
      if (tracksResult.rows.length > 0 && tracksResult.rows[0].tracks) {
        tracks = tracksResult.rows[0].tracks;
      }
    } catch (_e) {
      console.log('[LyriCol] No tracks found for theme generation');
    }

    const themes = await generateLyricThemes(
      project.concept,
      project.moodboard_brief,
      tracks
    );

    // Cache the generated themes
    await pool.query(
      'UPDATE projects SET lyric_themes = $1 WHERE id = $2',
      [JSON.stringify(themes), projectId]
    );

    res.json({ themes });
  } catch (err) {
    console.error('[LyriCol] Theme generation failed:', err);
    res.status(500).json({ error: 'Failed to generate themes' });
  }
});

export default router;
