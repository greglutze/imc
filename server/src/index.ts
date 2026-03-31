import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Skip JSON body parsing for raw binary upload routes (artwork, audio)
app.use((req, res, next) => {
  if (req.path.includes('/artwork/upload') || req.path.includes('/tracks/upload')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

// Health check
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Auto-migrate on startup
async function migrate(): Promise<void> {
  try {
    const tableCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`
    );
    if (!tableCheck.rows[0].exists) {
      console.log('Running database migration...');
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE organizations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text UNIQUE NOT NULL,
          name text NOT NULL,
          org_id uuid NOT NULL REFERENCES organizations(id),
          role text NOT NULL CHECK (role IN ('owner', 'member')),
          tier text NOT NULL CHECK (tier IN ('creator', 'pro', 'team', 'enterprise')),
          password_hash text NOT NULL,
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE projects (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id),
          org_id uuid NOT NULL REFERENCES organizations(id),
          status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'research', 'prompting', 'analysis', 'complete')),
          artist_name text,
          concept jsonb DEFAULT '{}',
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        CREATE TABLE concept_conversations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id),
          messages jsonb DEFAULT '[]',
          extracted boolean DEFAULT false,
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE instrument1_reports (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id),
          version integer DEFAULT 1,
          report jsonb DEFAULT '{}',
          confidence jsonb DEFAULT '{}',
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE instrument2_prompts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id),
          report_id uuid REFERENCES instrument1_reports(id),
          version integer DEFAULT 1,
          style_profile jsonb DEFAULT '{}',
          vocalist_persona jsonb DEFAULT '{}',
          tracks jsonb DEFAULT '[]',
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE instrument3_analyses (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id),
          report_id uuid REFERENCES instrument1_reports(id),
          track_title text,
          audio_file_key text,
          analysis jsonb DEFAULT '{}',
          success_score jsonb DEFAULT '{}',
          recommendations jsonb DEFAULT '[]',
          target_alignment jsonb,
          created_at timestamptz DEFAULT now()
        );

        CREATE TABLE audio_files (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id),
          user_id uuid NOT NULL REFERENCES users(id),
          filename text NOT NULL,
          storage_key text NOT NULL,
          format text NOT NULL,
          duration_ms integer,
          file_size_bytes bigint,
          features jsonb,
          created_at timestamptz DEFAULT now()
        );

        CREATE INDEX idx_users_org_id ON users(org_id);
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_projects_user_id ON projects(user_id);
        CREATE INDEX idx_projects_org_id ON projects(org_id);
        CREATE INDEX idx_projects_status ON projects(status);
        CREATE INDEX idx_concept_conversations_project_id ON concept_conversations(project_id);
        CREATE INDEX idx_instrument1_reports_project_id ON instrument1_reports(project_id);
        CREATE INDEX idx_instrument2_prompts_project_id ON instrument2_prompts(project_id);
        CREATE INDEX idx_instrument2_prompts_report_id ON instrument2_prompts(report_id);
        CREATE INDEX idx_instrument3_analyses_project_id ON instrument3_analyses(project_id);
        CREATE INDEX idx_instrument3_analyses_report_id ON instrument3_analyses(report_id);
        CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
        CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
      `);
      console.log('Migration complete.');
    }

    // IMC 00 checklist migration
    const checklistCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'checklist_items')`
    );
    if (!checklistCheck.rows[0].exists) {
      console.log('Running checklist migration...');
      await pool.query(`
        CREATE TABLE checklist_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          category text NOT NULL CHECK (category IN ('creative', 'legal', 'business', 'distribution')),
          label text NOT NULL,
          is_default boolean NOT NULL DEFAULT true,
          is_checked boolean NOT NULL DEFAULT false,
          notes text DEFAULT '',
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        CREATE INDEX idx_checklist_items_project_id ON checklist_items(project_id);
        CREATE INDEX idx_checklist_items_category ON checklist_items(project_id, category);
      `);
      console.log('Checklist migration complete.');
    }

    // Add guide column if missing (v2 migration)
    const guideColCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'checklist_items' AND column_name = 'guide'
      )`
    );
    if (!guideColCheck.rows[0].exists) {
      console.log('Adding guide column to checklist_items...');
      await pool.query(`ALTER TABLE checklist_items ADD COLUMN guide text DEFAULT ''`);
      console.log('Guide column added.');
    }
    // Add image_url column to projects if missing
    const imageColCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'image_url'
      )`
    );
    if (!imageColCheck.rows[0].exists) {
      console.log('Adding image_url column to projects...');
      await pool.query(`ALTER TABLE projects ADD COLUMN image_url text DEFAULT NULL`);
      console.log('image_url column added.');
    }

    // Moodboard migration: images table + brief column
    const moodboardTableCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'moodboard_images')`
    );
    if (!moodboardTableCheck.rows[0].exists) {
      console.log('Running moodboard migration...');
      await pool.query(`
        CREATE TABLE moodboard_images (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          image_data text NOT NULL,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now()
        );
        CREATE INDEX idx_moodboard_images_project_id ON moodboard_images(project_id);
      `);
      console.log('Moodboard images table created.');
    }

    const moodboardBriefCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'moodboard_brief'
      )`
    );
    if (!moodboardBriefCheck.rows[0].exists) {
      console.log('Adding moodboard_brief column to projects...');
      await pool.query(`ALTER TABLE projects ADD COLUMN moodboard_brief jsonb DEFAULT NULL`);
      console.log('moodboard_brief column added.');
    }
    // IMC Share migration
    const shareProjectsCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'share_projects')`
    );
    if (!shareProjectsCheck.rows[0].exists) {
      console.log('Running share projects migration...');
      await pool.query(`
        CREATE TABLE share_projects (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          title text NOT NULL,
          slug text UNIQUE NOT NULL,
          artwork_url text,
          is_public boolean NOT NULL DEFAULT false,
          password_hash text,
          downloads_enabled boolean NOT NULL DEFAULT false,
          theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
          total_plays integer NOT NULL DEFAULT 0,
          unique_listeners integer NOT NULL DEFAULT 0,
          download_count integer NOT NULL DEFAULT 0,
          last_listened_at timestamptz,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX idx_share_projects_project_id ON share_projects(project_id);
        CREATE UNIQUE INDEX idx_share_projects_slug ON share_projects(slug);

        CREATE TABLE share_tracks (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          share_project_id uuid NOT NULL REFERENCES share_projects(id) ON DELETE CASCADE,
          title text NOT NULL,
          original_filename text NOT NULL DEFAULT '',
          dropbox_url text NOT NULL,
          format text NOT NULL DEFAULT 'mp3',
          duration_ms integer,
          file_size_bytes bigint,
          sort_order integer NOT NULL DEFAULT 0,
          play_count integer NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now()
        );
        CREATE INDEX idx_share_tracks_project_id ON share_tracks(share_project_id);
      `);
      console.log('Share projects and tracks tables created.');
    }

    // LyriCol migration
    const lyricSessionsCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lyric_sessions')`
    );
    if (!lyricSessionsCheck.rows[0].exists) {
      console.log('Running lyric sessions migration...');
      await pool.query(`
        CREATE TABLE lyric_sessions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          title text,
          lyrics text NOT NULL DEFAULT '',
          messages jsonb DEFAULT '[]',
          entry_mode text NOT NULL DEFAULT 'conversation' CHECK (entry_mode IN ('paste', 'conversation', 'vibe')),
          vibe_context text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX idx_lyric_sessions_project_id ON lyric_sessions(project_id);
      `);
      console.log('Lyric sessions table created.');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// Start server
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`IMC Server running on port ${PORT}`);
  });
});
