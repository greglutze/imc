import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, ChecklistCategory } from '../types';

const router = Router();
router.use(authMiddleware);

// ── Default checklist items (from PRD Section 12) ──

const DEFAULT_ITEMS: Array<{ category: ChecklistCategory; label: string; guide: string }> = [
  // Creative
  {
    category: 'creative',
    label: 'Define the artist concept and sonic identity',
    guide: 'This is the foundation everything else builds on. Write down who you are as an artist, what you sound like, and what makes you different. Think of it as your creative north star — it keeps every decision aligned.',
  },
  {
    category: 'creative',
    label: 'Create a reference playlist (10–20 tracks)',
    guide: 'Curate tracks that represent the sound, energy, and production quality you\'re aiming for. This becomes a shared language between you, producers, and engineers — and helps AI tools like Suno and Udio understand your target.',
  },
  {
    category: 'creative',
    label: 'Build a visual moodboard',
    guide: 'Collect images, colors, textures, and typography that capture the visual world of your project. This guides album art, press photos, social content, and merch — and keeps your visual identity cohesive from day one.',
  },
  {
    category: 'creative',
    label: 'Write the artist biography — short form (100 words) and long form (400 words)',
    guide: 'You\'ll need both versions constantly — short for social profiles and playlist pitches, long for press kits and features. Write in third person, lead with what makes you compelling, and keep it current.',
  },
  {
    category: 'creative',
    label: 'Draft the album or EP concept and narrative arc',
    guide: 'Even if it\'s loose, having a concept gives your project shape. What\'s the story across the tracklist? What does the listener feel at the start versus the end? This makes sequencing and marketing much easier later.',
  },
  {
    category: 'creative',
    label: 'Complete all demos and reference recordings',
    guide: 'Demos are your proof of concept — rough recordings that capture the song\'s core idea. Get every track to a point where the arrangement, melody, and lyrics are clear enough to move into final production.',
  },
  {
    category: 'creative',
    label: 'Finalize tracklist and sequencing',
    guide: 'Lock in which songs make the cut and in what order. Think about pacing, energy flow, and how the project feels as a continuous listen. The first and last tracks matter most — they\'re your first and lasting impressions.',
  },
  {
    category: 'creative',
    label: 'Record all final vocals and instruments',
    guide: 'This is the performance that ships. Make sure tuning, timing, and tone are where you want them. If you\'re working with session players or vocalists, get clean stems exported separately for mixing flexibility.',
  },
  {
    category: 'creative',
    label: 'Complete mixing',
    guide: 'Mixing balances every element — levels, panning, EQ, compression, effects — into a cohesive stereo image. Whether you mix yourself or hire an engineer, reference your playlist to stay sonically on target.',
  },
  {
    category: 'creative',
    label: 'Complete mastering',
    guide: 'Mastering is the final polish — it optimizes loudness, clarity, and consistency across all tracks and playback systems. Always master to streaming-optimized levels (around -14 LUFS for Spotify). Don\'t skip this step.',
  },

  // Legal
  {
    category: 'legal',
    label: 'Register with a Performing Rights Organization (ASCAP, BMI, or SESAC)',
    guide: 'A PRO collects royalties on your behalf whenever your music is played publicly — radio, streaming, live venues, TV. You can only join one at a time. ASCAP and BMI are free to join; SESAC is invite-only.',
  },
  {
    category: 'legal',
    label: 'Register all compositions with your PRO',
    guide: 'Joining a PRO isn\'t enough — you need to register each song individually so they know what to collect on. Include all songwriters and their splits. Do this before release day so royalties start flowing immediately.',
  },
  {
    category: 'legal',
    label: 'Confirm all songwriting splits are documented and signed',
    guide: 'If anyone contributed to the writing — lyrics, melody, chords — they own a piece. Get percentage splits agreed on and signed in writing before release. Undocumented splits are the most common source of legal disputes in music.',
  },
  {
    category: 'legal',
    label: 'Obtain clearances for any sampled material',
    guide: 'If you\'ve sampled another recording or interpolated someone else\'s melody, you need written clearance from both the publisher and the master owner. Releasing uncleared samples can result in takedowns, lawsuits, or lost revenue.',
  },
  {
    category: 'legal',
    label: 'Register masters with SoundExchange',
    guide: 'SoundExchange collects digital performance royalties for the recording owner and featured artist — this is separate from what your PRO collects. Registration is free and covers plays on Pandora, SiriusXM, and other non-interactive platforms.',
  },
  {
    category: 'legal',
    label: 'Set up a publishing entity (if applicable)',
    guide: 'If you self-publish, creating a publishing entity (like an LLC) lets you collect the publisher\'s share of royalties — which is 50% of the total. Without one, that share may go uncollected or sit with your PRO.',
  },
  {
    category: 'legal',
    label: 'File copyright registration for lyrics and compositions',
    guide: 'Your work is technically copyrighted the moment you create it, but registering with the U.S. Copyright Office gives you legal standing to sue for infringement and claim statutory damages. It costs around $65 per work.',
  },
  {
    category: 'legal',
    label: 'Confirm ownership of artist name — run a trademark search',
    guide: 'Before investing in branding, check that no one else is using your artist name in music. Search the USPTO database, Spotify, and social platforms. A name conflict after release can force expensive rebranding.',
  },

  // Business
  {
    category: 'business',
    label: 'Set up artist socials: Instagram, TikTok, YouTube, X',
    guide: 'Claim your handles on every major platform even if you don\'t plan to post everywhere yet. Consistent naming across platforms makes you easier to find and looks more professional to press and playlist curators.',
  },
  {
    category: 'business',
    label: 'Claim artist profiles on all major streaming platforms',
    guide: 'Claim your Spotify for Artists, Apple Music for Artists, and Amazon Music for Artists profiles. This gives you access to analytics, editorial pitch tools, and the ability to customize your artist page with images and bio.',
  },
  {
    category: 'business',
    label: 'Create an electronic press kit (EPK)',
    guide: 'An EPK is your professional one-pager for press, venues, and industry contacts. Include your bio, high-res photos, music links, notable press, and contact info. Keep it clean, current, and easy to share as a link or PDF.',
  },
  {
    category: 'business',
    label: 'Shoot artist photography — press and promo',
    guide: 'You\'ll need high-resolution images for press features, social content, streaming profiles, and marketing. Aim for at least one portrait and one landscape shot. Professional photography makes a real difference in how seriously you\'re taken.',
  },
  {
    category: 'business',
    label: 'Finalize all artwork: album cover, singles, social assets',
    guide: 'Your cover art is often the first thing a listener sees. It needs to work at 3000x3000px for stores and still read clearly as a tiny thumbnail on Spotify. Create matching assets for singles and social posts to build a cohesive visual rollout.',
  },
  {
    category: 'business',
    label: 'Write press release for the release',
    guide: 'A press release tells the story of your release in a way journalists can easily pull quotes from. Keep it to one page, lead with the hook, include a streaming link and high-res photo, and send it 2–3 weeks before release day.',
  },
  {
    category: 'business',
    label: 'Build a pitch list: blogs, press, and playlist curators',
    guide: 'Research blogs, journalists, and independent playlist curators who cover your genre. Build a spreadsheet with contact info and personalize each pitch. Start reaching out 4–6 weeks before release to give them time to listen and write.',
  },
  {
    category: 'business',
    label: 'Set up Linktree or equivalent artist landing page',
    guide: 'A single link that routes to all your platforms, merch, and content. Put it in every social bio. Services like Linktree, Koji, or a custom landing page work — just make sure it loads fast and looks on-brand.',
  },

  // Distribution
  {
    category: 'distribution',
    label: 'Select a distributor and create account (Distrokid, TuneCore, etc.)',
    guide: 'Your distributor gets your music into Spotify, Apple Music, Amazon, and every other streaming platform. DistroKid charges an annual fee for unlimited uploads; TuneCore charges per release. Both are solid for independent artists.',
  },
  {
    category: 'distribution',
    label: 'Upload all audio files in the correct format (WAV, 44.1kHz, 16-bit minimum)',
    guide: 'Stores require lossless audio files — never upload MP3s. WAV at 44.1kHz/16-bit is the standard minimum. Some distributors accept 24-bit, which preserves more detail. Double-check your export settings before uploading.',
  },
  {
    category: 'distribution',
    label: 'Upload final artwork (3000x3000px minimum)',
    guide: 'All major platforms require square cover art at 3000x3000 pixels in RGB color mode, saved as JPEG or PNG. No blurry images, no pixelation, no logos of streaming platforms. The artwork must match what you submit for every release.',
  },
  {
    category: 'distribution',
    label: 'Enter all metadata: titles, credits, ISRC codes, UPC',
    guide: 'Metadata is how streaming platforms identify and credit your music. ISRC codes are unique per track, UPC is unique per release. Your distributor usually generates these. Triple-check artist names, featured artists, and songwriting credits.',
  },
  {
    category: 'distribution',
    label: 'Set release date — minimum 3–4 weeks out for editorial consideration',
    guide: 'Spotify editorial playlists require at least 7 days lead time, but 3–4 weeks gives you the best shot. This also gives press, curators, and your audience time to build anticipation. Never rush a release date — plan it.',
  },
  {
    category: 'distribution',
    label: 'Submit for Spotify editorial playlist consideration',
    guide: 'Through Spotify for Artists, you can pitch one unreleased track per release to Spotify\'s editorial team. Write a compelling pitch — describe the song\'s story, mood, and what makes it special. Submit at least 7 days before release.',
  },
  {
    category: 'distribution',
    label: 'Register with the MLC for mechanical licensing',
    guide: 'The MLC (Mechanical Licensing Collective) collects mechanical royalties from streaming services in the U.S. Registration is free and ensures you get paid every time your composition is streamed. Don\'t leave this money on the table.',
  },
  {
    category: 'distribution',
    label: 'Submit to sync licensing platforms (Musicbed, Artlist, etc.)',
    guide: 'Sync licensing places your music in films, ads, TV shows, and video content. Platforms like Musicbed, Artlist, and Songtradr connect you to sync opportunities. It\'s a meaningful revenue stream, especially for instrumental or mood-driven tracks.',
  },
];

// ── Seed default items for a project ──

async function seedDefaults(projectId: string): Promise<void> {
  // Each item uses two parameterized values: label ($odd) and guide ($even)
  const values = DEFAULT_ITEMS.map(
    (item, i) =>
      `(gen_random_uuid(), '${projectId}', '${item.category}', $${i * 2 + 1}, $${i * 2 + 2}, true, false, '', ${i})`
  ).join(',\n');

  const params: string[] = [];
  for (const item of DEFAULT_ITEMS) {
    params.push(item.label, item.guide);
  }

  await pool.query(
    `INSERT INTO checklist_items (id, project_id, category, label, guide, is_default, is_checked, notes, sort_order)
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
    } else {
      // Backfill guide text for existing default items that have empty guides
      const emptyGuides = await pool.query(
        `SELECT id, label FROM checklist_items WHERE project_id = $1 AND is_default = true AND (guide IS NULL OR guide = '')`,
        [projectId]
      );
      if (emptyGuides.rows.length > 0) {
        for (const row of emptyGuides.rows) {
          const match = DEFAULT_ITEMS.find((d) => d.label === row.label);
          if (match) {
            await pool.query('UPDATE checklist_items SET guide = $1 WHERE id = $2', [match.guide, row.id]);
          }
        }
      }
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
