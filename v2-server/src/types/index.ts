import { Request } from 'express';

// ── Auth (shared with V1) ──

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// ── Core Entities ──

/**
 * Artist — the central identity in V2.
 * One user can manage multiple artist identities.
 * The archive, reflections, and fan access all belong to an artist, not a user.
 */
export interface Artist {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * ArchiveItem — anything the artist brings in or IMC surfaces.
 * Text, image, audio, link, video. No structure required.
 * The embedding is what makes it searchable and connectable.
 */
export type ArchiveContentType = 'text' | 'image' | 'audio' | 'link' | 'video';

export interface ArchiveItem {
  id: string;
  artist_id: string;
  content_type: ArchiveContentType;
  title: string | null;
  raw_text: string | null;           // for text/link content
  file_key: string | null;           // S3/R2 key for binary content
  file_url: string | null;           // original URL for links
  metadata: ArchiveItemMetadata;
  embedding: number[] | null;        // vector(1536) — null until processed
  source: ArchiveItemSource;
  is_external: boolean;              // true if surfaced by IMC from external APIs
  external_api: string | null;       // 'arena' | 'internet_archive' | 'europeana' | etc.
  external_id: string | null;        // ID in the external system
  created_at: Date;
}

export interface ArchiveItemMetadata {
  // Auto-tagged by intelligence layer
  emotional_register?: string[];
  themes?: string[];
  sonic_qualities?: string[];
  visual_qualities?: string[];
  era?: string;
  medium?: string;
  // Original metadata from external sources
  original_title?: string;
  original_creator?: string;
  original_date?: string;
  license?: string;
  [key: string]: unknown;
}

export type ArchiveItemSource =
  | 'user_upload'
  | 'arena_import'
  | 'imc_surfaced'
  | 'external_fetch';

// ── Feedback Loop ──

/**
 * Tracks every artist interaction with archive content.
 * What they kept, what they dismissed, what they built on.
 * This is what makes suggestions sharpen over time.
 */
export type InteractionType = 'viewed' | 'saved' | 'dismissed' | 'used_in_project' | 'shared';

export interface ArchiveInteraction {
  id: string;
  artist_id: string;
  item_id: string;
  interaction_type: InteractionType;
  project_id: string | null;         // which project context, if any
  created_at: Date;
}

// ── Connections (vector similarity + explicit) ──

export type ConnectionType = 'similarity' | 'artist_linked' | 'reflection_cluster';

export interface ArchiveConnection {
  id: string;
  item_a_id: string;
  item_b_id: string;
  similarity_score: number;
  connection_type: ConnectionType;
  created_at: Date;
}

// ── Pattern Recognition & Reflections ──

/**
 * Reflections are IMC's pattern observations.
 * Surfaced as provocations, not data dumps.
 * Always framed as questions, never conclusions.
 */
export interface Reflection {
  id: string;
  artist_id: string;
  item_ids: string[];                // the archive items that formed this cluster
  provocation: string;               // "You keep circling isolation and surveillance. Is that what this project is about?"
  themes: string[];
  emotional_register: string | null;
  is_read: boolean;
  surfaced_at: Date;
}

// ── Projects (lighter than V1) ──

/**
 * V2 projects are workspaces that reference archive items.
 * They don't own content — they curate it.
 */
export interface V2Project {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'active' | 'complete' | 'archived';
  created_at: Date;
  updated_at: Date;
}

/**
 * Many-to-many: which archive items are pulled into which project.
 */
export interface ProjectItem {
  id: string;
  project_id: string;
  item_id: string;
  role: string | null;               // 'inspiration' | 'ingredient' | 'reference' | etc.
  added_at: Date;
}

// ── Lyric Intelligence (evolved from V1) ──

export interface V2LyricSession {
  id: string;
  project_id: string;
  artist_id: string;
  title: string | null;
  lyrics: string;
  messages: LyricMessage[];
  notes: LyricNote[];
  archive_context_ids: string[];     // archive items informing this session
  created_at: Date;
  updated_at: Date;
}

export interface LyricMessage {
  role: 'artist' | 'imc';
  content: string;
  type: 'chat' | 'rhyme' | 'synonym' | 'suggest' | 'syllable' | 'reflection';
  timestamp: string;
}

export interface LyricNote {
  line: number;
  note: string;
  highlight?: string;
}

// ── Sonic Ingredient Engine ──

export type IngredientType = 'drum_texture' | 'riff' | 'melodic_fragment' | 'bassline' | 'atmosphere' | 'vocal_texture' | 'field_recording';

export interface SonicIngredient {
  id: string;
  project_id: string;
  artist_id: string;
  ingredient_type: IngredientType;
  description: string;
  suno_prompt: string;               // targeted prompt for this single ingredient
  source_item_ids: string[];         // archive items that inspired this
  status: 'suggested' | 'kept' | 'discarded' | 'rendered';
  render_url: string | null;         // Suno output URL if rendered
  created_at: Date;
}

// ── Fan Access Layer ──

export type AccessTier = 'open' | 'subscriber' | 'inner_circle';

export interface ProcessChannel {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  subscription_price_cents: number | null;   // null = free
  revenue_share_pct: number;                 // IMC's cut, default 12
  created_at: Date;
  updated_at: Date;
}

export interface ProcessChannelItem {
  id: string;
  channel_id: string;
  item_id: string | null;            // archive item
  reflection_id: string | null;      // or a reflection
  annotation: string | null;         // artist's note on what this meant
  access_tier: AccessTier;
  sort_order: number;
  added_at: Date;
}

export interface FanSubscription {
  id: string;
  channel_id: string;
  fan_email: string;
  fan_name: string | null;
  access_tier: AccessTier;
  stripe_subscription_id: string | null;
  is_active: boolean;
  created_at: Date;
  expires_at: Date | null;
}

// ── External API Sources ──

export type ExternalSource =
  | 'arena'
  | 'internet_archive'
  | 'europeana'
  | 'rijksmuseum'
  | 'freesound'
  | 'ccmixter'
  | 'musicbrainz'
  | 'discogs';

export interface ExternalFetchLog {
  id: string;
  artist_id: string;
  source: ExternalSource;
  query_embedding_hash: string;      // hash of the embedding used to search
  results_count: number;
  items_surfaced: number;            // how many passed the relevance threshold
  fetched_at: Date;
}
