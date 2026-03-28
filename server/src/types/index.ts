import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    org_id: string;
    role: 'owner' | 'member';
    tier: 'creator' | 'pro' | 'team' | 'enterprise';
  };
}

// ── JSONB nested types ──

export interface ProjectConcept {
  genre_primary: string;
  genre_secondary: string[];
  reference_artists: string[];
  creative_direction: string;
  target_audience: string;
  mood_keywords: string[];
  track_count: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Instrument 1 types

export interface I1MarketOverview {
  genre_landscape: string;
  saturation_level: string;
  growth_trend: string;
  key_trends: string[];
}

export interface I1ComparableArtist {
  name: string;
  monthly_listeners: number | null;
  relevance_score: number;
  positioning_gap: string;
}

export interface I1AudienceProfile {
  primary_age_range: string;
  gender_split: string;
  top_markets: string[];
  platforms: string[];
  psychographics: string;
}

export interface I1PlaylistEntry {
  name: string;
  followers: number;
  placement_difficulty: string;
}

export interface I1PlaylistLandscape {
  target_playlists: I1PlaylistEntry[];
  curator_patterns: string;
}

export interface I1SonicBlueprint {
  bpm_range: string;
  key_signatures: string[];
  energy_profile: string;
  production_style: string;
  sonic_signatures: string[];
}

export interface I1Opportunity {
  gap: string;
  market_score: number;
  success_probability: number;
}

export interface I1RevenueProjections {
  streaming: string;
  touring: string;
  merch: string;
  sync_licensing: string;
}

export interface I1Risk {
  risk: string;
  severity: string;
}

export interface I1Recommendation {
  priority: number;
  action: string;
  timeline: string;
}

export interface I1Report {
  market_overview: I1MarketOverview;
  comparable_artists: I1ComparableArtist[];
  audience_profile: I1AudienceProfile;
  playlist_landscape: I1PlaylistLandscape;
  sonic_blueprint: I1SonicBlueprint;
  opportunities: I1Opportunity[];
  revenue_projections: I1RevenueProjections;
  risk_assessment: I1Risk[];
  recommendations: I1Recommendation[];
}

export interface I1Confidence {
  overall_score: number;
  data_completeness: number;
  sources_used: string[];
  sources_failed: string[];
}

// Instrument 2 types

export interface I2StyleProfile {
  production_aesthetic: string;
  sonic_signatures: string[];
  tempo_range: string;
  key_preferences: string[];
}

export interface I2VocalistPersona {
  vocal_character: string;
  delivery_style: string;
  reference_vocalists: string[];
  tone_keywords: string[];
}

export interface I2Track {
  track_number: number;
  title: string;
  suno_prompt: string;
  udio_prompt: string;
  structure: string;
  notes: string;
}

// Instrument 3 types

export interface I3AudioQuality {
  loudness_lufs: number;
  dynamic_range: number;
  frequency_balance: string;
  mix_notes: string;
}

export interface I3HookEffectiveness {
  repetition_score: number;
  melodic_contour: string;
  hook_timestamps: string[];
  overall_score: number;
}

export interface I3Structure {
  sections: Array<{ name: string; start: string; end: string }>;
  pacing_assessment: string;
  transitions_quality: string;
}

export interface I3CompetitivePosition {
  genre_fit_score: number;
  differentiation: string;
  comparable_tracks: string[];
}

export interface I3CommercialViability {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

export interface I3Analysis {
  audio_quality: I3AudioQuality;
  hook_effectiveness: I3HookEffectiveness;
  structure: I3Structure;
  competitive_position: I3CompetitivePosition;
  commercial_viability: I3CommercialViability;
}

export interface I3SuccessScore {
  overall: number;
  breakdown: Record<string, number>;
  criteria_version: string;
}

export interface I3Recommendation {
  priority: 'critical' | 'high' | 'optimization';
  category: string;
  finding: string;
  action: string;
}

export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  danceability: number;
  loudness_lufs: number;
  dynamic_range: number;
  spectral_centroid: number;
  onset_rate: number;
}

// ── Core entity types ──

export interface User {
  id: string;
  email: string;
  name: string;
  org_id: string;
  role: 'owner' | 'member';
  tier: 'creator' | 'pro' | 'team' | 'enterprise';
  password_hash: string;
  created_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  created_at: Date;
}

export interface Project {
  id: string;
  user_id: string;
  org_id: string;
  status: 'draft' | 'research' | 'prompting' | 'analysis' | 'complete';
  artist_name: string | null;
  image_url: string | null;
  concept: ProjectConcept;
  moodboard_brief: MoodboardBrief | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConceptConversation {
  id: string;
  project_id: string;
  messages: ConversationMessage[];
  extracted: boolean;
  created_at: Date;
}

export interface Instrument1Report {
  id: string;
  project_id: string;
  version: number;
  report: I1Report;
  confidence: I1Confidence;
  created_at: Date;
}

export interface Instrument2Prompts {
  id: string;
  project_id: string;
  report_id: string | null;
  version: number;
  style_profile: I2StyleProfile;
  vocalist_persona: I2VocalistPersona;
  tracks: I2Track[];
  created_at: Date;
}

export interface Instrument3Analysis {
  id: string;
  project_id: string;
  report_id: string | null;
  track_title: string | null;
  audio_file_key: string | null;
  analysis: I3Analysis;
  success_score: I3SuccessScore;
  recommendations: I3Recommendation[];
  target_alignment: Record<string, unknown> | null;
  created_at: Date;
}

// IMC 00 — Artist Checklist types

export type ChecklistCategory = 'creative' | 'legal' | 'business' | 'distribution';

export interface ChecklistItem {
  id: string;
  project_id: string;
  category: ChecklistCategory;
  label: string;
  guide: string;
  is_default: boolean;
  is_checked: boolean;
  notes: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistSummary {
  total: number;
  checked: number;
  by_category: Record<ChecklistCategory, { total: number; checked: number }>;
}

// Moodboard types

export interface MoodboardImage {
  id: string;
  project_id: string;
  image_data: string;
  sort_order: number;
  created_at: Date;
}

export interface MoodboardBrief {
  tempo_feel: string;
  texture: string;
  atmosphere: string;
  emotional_register: string;
  production_era: string | null;
  arrangement_density: 'sparse' | 'moderate' | 'dense';
  dynamic_range: 'compressed' | 'moderate' | 'wide';
  sonic_references: string[];
  confidence: 'high' | 'medium' | 'low';
  prose: string;
  flagged_elements: string[];
  version: number;
  previous_prose: string | null;
}

// IMC Share types

export interface ShareProject {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  artwork_url: string | null;
  is_public: boolean;
  password_hash: string | null;
  downloads_enabled: boolean;
  theme: 'dark' | 'light';
  total_plays: number;
  unique_listeners: number;
  download_count: number;
  last_listened_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShareTrack {
  id: string;
  share_project_id: string;
  title: string;
  original_filename: string;
  storage_key: string;
  format: string;
  duration_ms: number | null;
  file_size_bytes: number | null;
  sort_order: number;
  play_count: number;
  created_at: Date;
}

// LyriCol types

export type LyricSessionEntryMode = 'paste' | 'conversation' | 'vibe';

export interface LyricSessionMessage {
  role: 'user' | 'advisor';
  content: string;
  type: 'chat' | 'rhyme' | 'synonym' | 'structure' | 'coherence' | 'nudge';
  dismissed?: boolean;
  timestamp: string;
}

export interface LyricSession {
  id: string;
  project_id: string;
  title: string | null;
  lyrics: string;
  messages: LyricSessionMessage[];
  entry_mode: LyricSessionEntryMode;
  vibe_context: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AudioFile {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  storage_key: string;
  format: string;
  duration_ms: number | null;
  file_size_bytes: number | null;
  features: AudioFeatures | null;
  created_at: Date;
}
