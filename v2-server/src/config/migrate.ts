import pool from './database';

/**
 * V2 Database Migration
 *
 * Separate database from V1. Requires pgvector extension.
 * Run on a Railway Postgres instance with pgvector enabled.
 *
 * Core design decisions:
 * - Artist is the central entity (not user, not project)
 * - Archive items are the primary objects (not songs, not reports)
 * - Vector embeddings power all intelligence features
 * - Projects reference archive items, they don't own them
 * - Fan access is per-artist, not per-project
 */
export async function migrate(): Promise<void> {
  try {
    // ── Extensions ──
    console.log('[V2] Checking extensions...');
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

    // ── Core tables ──
    const artistsCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'artists')`
    );

    if (!artistsCheck.rows[0].exists) {
      console.log('[V2] Running initial migration...');
      await pool.query(`

        -- Users: lightweight, shared concept with V1 but independent table
        CREATE TABLE users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text UNIQUE NOT NULL,
          name text NOT NULL,
          password_hash text NOT NULL,
          created_at timestamptz DEFAULT now()
        );

        -- Artists: the central identity. One user can have multiple artist identities.
        CREATE TABLE artists (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          bio text,
          avatar_url text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        -- Archive: the persistent intake layer. Everything lives here.
        CREATE TABLE archive_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'audio', 'link', 'video')),
          title text,
          raw_text text,
          file_key text,
          file_url text,
          metadata jsonb DEFAULT '{}',
          embedding vector(1536),
          source text NOT NULL DEFAULT 'user_upload' CHECK (source IN ('user_upload', 'arena_import', 'imc_surfaced', 'external_fetch')),
          is_external boolean NOT NULL DEFAULT false,
          external_api text,
          external_id text,
          created_at timestamptz DEFAULT now()
        );

        -- Feedback loop: what the artist kept, dismissed, built on
        CREATE TABLE archive_interactions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          item_id uuid NOT NULL REFERENCES archive_items(id) ON DELETE CASCADE,
          interaction_type text NOT NULL CHECK (interaction_type IN ('viewed', 'saved', 'dismissed', 'used_in_project', 'shared')),
          project_id uuid,
          created_at timestamptz DEFAULT now()
        );

        -- Connections: similarity links between archive items
        CREATE TABLE archive_connections (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          item_a_id uuid NOT NULL REFERENCES archive_items(id) ON DELETE CASCADE,
          item_b_id uuid NOT NULL REFERENCES archive_items(id) ON DELETE CASCADE,
          similarity_score real NOT NULL,
          connection_type text NOT NULL DEFAULT 'similarity' CHECK (connection_type IN ('similarity', 'artist_linked', 'reflection_cluster')),
          created_at timestamptz DEFAULT now(),
          UNIQUE (item_a_id, item_b_id)
        );

        -- Reflections: IMC's pattern observations, surfaced as provocations
        CREATE TABLE reflections (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          item_ids jsonb NOT NULL DEFAULT '[]',
          provocation text NOT NULL,
          themes jsonb DEFAULT '[]',
          emotional_register text,
          is_read boolean NOT NULL DEFAULT false,
          surfaced_at timestamptz DEFAULT now()
        );

        -- Projects: lightweight workspaces that curate archive items
        CREATE TABLE projects (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          title text NOT NULL,
          description text,
          status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'complete', 'archived')),
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        -- Project ↔ Archive item (many-to-many)
        CREATE TABLE project_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          item_id uuid NOT NULL REFERENCES archive_items(id) ON DELETE CASCADE,
          role text,
          added_at timestamptz DEFAULT now(),
          UNIQUE (project_id, item_id)
        );

        -- Lyric sessions (evolved from V1, now archive-aware)
        CREATE TABLE lyric_sessions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          title text,
          lyrics text NOT NULL DEFAULT '',
          messages jsonb DEFAULT '[]',
          notes jsonb DEFAULT '[]',
          archive_context_ids jsonb DEFAULT '[]',
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        -- Sonic ingredients
        CREATE TABLE sonic_ingredients (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          ingredient_type text NOT NULL CHECK (ingredient_type IN ('drum_texture', 'riff', 'melodic_fragment', 'bassline', 'atmosphere', 'vocal_texture', 'field_recording')),
          description text NOT NULL,
          suno_prompt text NOT NULL,
          source_item_ids jsonb DEFAULT '[]',
          status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'kept', 'discarded', 'rendered')),
          render_url text,
          created_at timestamptz DEFAULT now()
        );

        -- Fan Access: process channels
        CREATE TABLE process_channels (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          title text NOT NULL,
          description text,
          is_active boolean NOT NULL DEFAULT false,
          subscription_price_cents integer,
          revenue_share_pct real NOT NULL DEFAULT 12.0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        -- Process channel items (curated selection from archive)
        CREATE TABLE process_channel_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_id uuid NOT NULL REFERENCES process_channels(id) ON DELETE CASCADE,
          item_id uuid REFERENCES archive_items(id) ON DELETE SET NULL,
          reflection_id uuid REFERENCES reflections(id) ON DELETE SET NULL,
          annotation text,
          access_tier text NOT NULL DEFAULT 'subscriber' CHECK (access_tier IN ('open', 'subscriber', 'inner_circle')),
          sort_order integer NOT NULL DEFAULT 0,
          added_at timestamptz DEFAULT now()
        );

        -- Fan subscriptions
        CREATE TABLE fan_subscriptions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_id uuid NOT NULL REFERENCES process_channels(id) ON DELETE CASCADE,
          fan_email text NOT NULL,
          fan_name text,
          access_tier text NOT NULL DEFAULT 'subscriber' CHECK (access_tier IN ('open', 'subscriber', 'inner_circle')),
          stripe_subscription_id text,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz DEFAULT now(),
          expires_at timestamptz
        );

        -- External API fetch log (for deduplication and rate limiting)
        CREATE TABLE external_fetch_log (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
          source text NOT NULL,
          query_embedding_hash text NOT NULL,
          results_count integer NOT NULL DEFAULT 0,
          items_surfaced integer NOT NULL DEFAULT 0,
          fetched_at timestamptz DEFAULT now()
        );

        -- ── Indexes ──

        -- Users
        CREATE INDEX idx_v2_users_email ON users(email);

        -- Artists
        CREATE INDEX idx_artists_user_id ON artists(user_id);

        -- Archive (the most queried table)
        CREATE INDEX idx_archive_artist_id ON archive_items(artist_id);
        CREATE INDEX idx_archive_content_type ON archive_items(artist_id, content_type);
        CREATE INDEX idx_archive_source ON archive_items(artist_id, source);
        CREATE INDEX idx_archive_external ON archive_items(external_api, external_id) WHERE is_external = true;
        CREATE INDEX idx_archive_created ON archive_items(artist_id, created_at DESC);

        -- Vector similarity search (IVFFlat for scale, switch to HNSW if <100k items)
        -- Note: IVFFlat requires data to exist before creating the index.
        -- For initial setup, use exact search. Add this index after seeding:
        -- CREATE INDEX idx_archive_embedding ON archive_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

        -- Interactions (feedback loop)
        CREATE INDEX idx_interactions_artist ON archive_interactions(artist_id);
        CREATE INDEX idx_interactions_item ON archive_interactions(item_id);
        CREATE INDEX idx_interactions_type ON archive_interactions(artist_id, interaction_type);

        -- Connections
        CREATE INDEX idx_connections_item_a ON archive_connections(item_a_id);
        CREATE INDEX idx_connections_item_b ON archive_connections(item_b_id);

        -- Reflections
        CREATE INDEX idx_reflections_artist ON reflections(artist_id);
        CREATE INDEX idx_reflections_unread ON reflections(artist_id) WHERE is_read = false;

        -- Projects
        CREATE INDEX idx_v2_projects_artist ON projects(artist_id);
        CREATE INDEX idx_project_items_project ON project_items(project_id);
        CREATE INDEX idx_project_items_item ON project_items(item_id);

        -- Lyric sessions
        CREATE INDEX idx_v2_lyric_sessions_project ON lyric_sessions(project_id);
        CREATE INDEX idx_v2_lyric_sessions_artist ON lyric_sessions(artist_id);

        -- Sonic ingredients
        CREATE INDEX idx_sonic_ingredients_project ON sonic_ingredients(project_id);
        CREATE INDEX idx_sonic_ingredients_status ON sonic_ingredients(artist_id, status);

        -- Fan access
        CREATE INDEX idx_process_channels_artist ON process_channels(artist_id);
        CREATE INDEX idx_channel_items_channel ON process_channel_items(channel_id);
        CREATE INDEX idx_fan_subs_channel ON fan_subscriptions(channel_id);
        CREATE INDEX idx_fan_subs_email ON fan_subscriptions(fan_email);

        -- External fetch log
        CREATE INDEX idx_fetch_log_artist ON external_fetch_log(artist_id, source);
      `);
      console.log('[V2] Initial migration complete.');
    }

    // Add image_data column for storing images as base64
    const imageDataCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'archive_items' AND column_name = 'image_data'
      )`
    );
    if (!imageDataCheck.rows[0].exists) {
      console.log('[V2] Adding image_data column to archive_items...');
      await pool.query(`
        ALTER TABLE archive_items ADD COLUMN image_data text;
        ALTER TABLE archive_items ADD COLUMN image_content_type text;
      `);
      console.log('[V2] image_data column added.');
    }

  } catch (err) {
    console.error('[V2] Migration error:', err);
    throw err;
  }
}
