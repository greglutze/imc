import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ChecklistCategory } from '../types';

const router = Router();
router.use(authMiddleware);

// ── Default checklist items (from PRD Section 12) ──

const DEFAULT_ITEMS: Array<{ category: ChecklistCategory; label: string }> = [
  // Creative
  { category: 'creative', label: 'Define the artist concept and sonic identity' },
  { category: 'creative', label: 'Create a reference playlist (10–20 tracks)' },
  { category: 'creative', label: 'Build a visual moodboard' },
  { category: 'creative', label: 'Write the artist biography — short form (100 words) and long form (400 words)' },
  { category: 'creative', label: 'Draft the album or EP concept and narrative arc' },
  { category: 'creative', label: 'Complete all demos and reference recordings' },
  { category: 'creative', label: 'Finalize tracklist and sequencing' },
  { category: 'creative', label: 'Record all final vocals and instruments' },
  { category: 'creative', label: 'Complete mixing' },
  { category: 'creative', label: 'Complete mastering' },

  // Legal
  { category: 'legal', label: 'Register with a Performing Rights Organization (ASCAP, BMI, or SESAC)' },
  { category: 'legal', label: 'Register all compositions with your PRO' },
  { category: 'legal', label: 'Confirm all songwriting splits are documented and signed' },
  { category: 'legal', label: 'Obtain clearances for any sampled material' },
  { category: 'legal', label: 'Register masters with SoundExchange' },
  { category: 'legal', label: 'Set up a publishing entity (if applicable)' },
  { category: 'legal', label: 'File copyright registration for lyrics and compositions' },
  { category: 'legal', label: 'Confirm ownership of artist name — run a trademark search' },

  // Business
  { category: 'business', label: 'Set up artist socials: Instagram, TikTok, YouTube, X' },
  { category: 'business', label: 'Claim artist profiles on all major streaming platforms' },
  { category: 'business', label: 'Create an electronic press kit (EPK)' },
  { category: 'business', label: 'Shoot artist photography — press and promo' },
  { category: 'business', label: 'Finalize all artwork: album cover, singles, social assets' },
  { category: 'business', label: 'Write press release for the release' },
  { category: 'business', label: 'Build a pitch list: blogs, press, and playlist curators' },
  { category: 'business', label: 'Set up Linktree or equivalent artist landing page' },

  // Distribution
  { category: 'distribution', label: 'Select a distributor and create account (Distrokid, TuneCore, etc.)' },
  { category: 'distribution', label: 'Upload all audio files in the correct format (WAV, 44.1kHz, 16-bit minimum)' },
  { category: 'distribution', label: 'Upload final artwork (3000x3000px minimum)' },
  { category: 'distribution', label: 'Enter all metadata: titles, credits, ISRC codes, UPC' },
  { category: 'distribution', label: 'Set release date — minimum 3–4 weeks out for editorial consideration' },
  { category: 'distribution', label: 'Submit for Spotify editorial playlist consideration' },
  { category: 'distribution', label: 'Register with the MLC for mechanical licensing' },
  { category: 'distribution', label: 'Submit to sync licensing platforms (Musicbed, Artlist, etc.)' },
];

// ── Seed default items for a project ──

async function seedDefaults(projectId: string): Promise<void> {
  const values = DEFAULT_ITEMS.map(
    (item, i) =>
      `(gen_random_uuid(), '${projectId}', '${item.category}', $${i + 1}, true, false, '', ${i})`
  ).join(',\n');

  const params = DEFAULT_ITEMS.map((item) => item.label);

  await pool.query(
    `INSERT INTO checklist_items (id, project_id, category, label, is_default, is_checked, notes, sort_order)
     VALUES ${values}`,
    params
  );
}

// ── GET /api/checklist/:projectId — Get all items for a project ──

router.get('/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user's org
    const project = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, req.user!.org_id]
    );
    if (project.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check if items exist — if not, seed defaults
    const count = await pool.query(
      'SELECT COUNT(*) FROM checklist_items WHERE project_id = $1',
      [projectId]
    );
    if (parseInt(count.rows[0].count) === 0) {
      await seedDefaults(projectId);
    }

    // Fetch all items ordered by category and sort_order
    const result = await pool.query(
      `SELECT * FROM checklist_items
       WHERE project_id = $1
       ORDER BY
         CASE category
           WHEN 'creative' THEN 0
           WHEN 'legal' THEN 1
           WHEN 'business' THEN 2
           WHEN 'distribution' THEN 3
         END,
         sort_order ASC,
         created_at ASC`,
      [projectId]
    );

    // Build summary
    const items = result.rows;
    const total = items.length;
    const checked = items.filter((i: { is_checked: boolean }) => i.is_checked).length;
    const categories: ChecklistCategory[] = ['creative', 'legal', 'business', 'distribution'];
    const by_category = {} as Record<ChecklistCategory, { total: number; checked: number }>;

    for (const cat of categories) {
      const catItems = items.filter((i: { category: string }) => i.category === cat);
      by_category[cat] = {
        total: catItems.length,
        checked: catItems.filter((i: { is_checked: boolean }) => i.is_checked).length,
      };
    }

    res.json({ items, summary: { total, checked, by_category } });
  } catch (err) {
    console.error('Checklist GET error:', err);
    res.status(500).json({ error: 'Failed to load checklist' });
  }
});

// ── PATCH /api/checklist/:itemId/toggle — Toggle check state ──

router.patch('/:itemId/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    // Verify ownership via project -> org
    const item = await pool.query(
      `SELECT ci.* FROM checklist_items ci
       JOIN projects p ON ci.project_id = p.id
       WHERE ci.id = $1 AND p.org_id = $2`,
      [itemId, req.user!.org_id]
    );
    if (item.rows.length === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const newState = !item.rows[0].is_checked;
    const result = await pool.query(
      `UPDATE checklist_items SET is_checked = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [newState, itemId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Checklist toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle item' });
  }
});

// ── PATCH /api/checklist/:itemId/notes — Update notes ──

router.patch('/:itemId/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { notes } = req.body;

    if (typeof notes !== 'string') {
      res.status(400).json({ error: 'Notes must be a string' });
      return;
    }

    // Verify ownership
    const item = await pool.query(
      `SELECT ci.id FROM checklist_items ci
       JOIN projects p ON ci.project_id = p.id
       WHERE ci.id = $1 AND p.org_id = $2`,
      [itemId, req.user!.org_id]
    );
    if (item.rows.length === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE checklist_items SET notes = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [notes, itemId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Checklist notes error:', err);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// ── POST /api/checklist/:projectId/items — Add custom item ──

router.post('/:projectId/items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { category, label } = req.body;

    if (!category || !label) {
      res.status(400).json({ error: 'Category and label are required' });
      return;
    }

    const validCategories: ChecklistCategory[] = ['creative', 'legal', 'business', 'distribution'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    // Verify project ownership
    const project = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, req.user!.org_id]
    );
    if (project.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get max sort_order for category
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM checklist_items WHERE project_id = $1 AND category = $2',
      [projectId, category]
    );

    const result = await pool.query(
      `INSERT INTO checklist_items (project_id, category, label, is_default, is_checked, notes, sort_order)
       VALUES ($1, $2, $3, false, false, '', $4)
       RETURNING *`,
      [projectId, category, label, maxOrder.rows[0].max_order + 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Checklist add item error:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// ── DELETE /api/checklist/:itemId — Delete custom item (not defaults) ──

router.delete('/:itemId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    // Verify ownership and that it's a custom item
    const item = await pool.query(
      `SELECT ci.* FROM checklist_items ci
       JOIN projects p ON ci.project_id = p.id
       WHERE ci.id = $1 AND p.org_id = $2`,
      [itemId, req.user!.org_id]
    );
    if (item.rows.length === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.rows[0].is_default) {
      res.status(403).json({ error: 'Default items cannot be deleted' });
      return;
    }

    await pool.query('DELETE FROM checklist_items WHERE id = $1', [itemId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Checklist delete error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ── GET /api/checklist/:projectId/summary — Quick summary for nav ──

router.get('/:projectId/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
      [projectId, req.user!.org_id]
    );
    if (project.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_checked) as checked
       FROM checklist_items WHERE project_id = $1`,
      [projectId]
    );

    const { total, checked } = result.rows[0];
    res.json({ total: parseInt(total), checked: parseInt(checked) });
  } catch (err) {
    console.error('Checklist summary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

export default router;
