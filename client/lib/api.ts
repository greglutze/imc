const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getApiBase(): string {
  return API_BASE;
}

/** Resolve an artwork URL — prepend API_BASE if it's a relative path */
export function resolveArtworkUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

/* ———————— Types ———————— */

export interface Project {
  id: string;
  artist_name: string | null;
  image_url: string | null;
  status: 'draft' | 'research' | 'prompting' | 'analysis' | 'complete';
  concept: ProjectConcept | null;
  moodboard_brief: MoodboardBrief | null;
  created_at: string;
  updated_at: string;
}

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
  timestamp?: string;
}

export interface ConversationResponse {
  response: string;
  conceptReady: boolean;
  concept?: ProjectConcept;
}

export interface I1Report {
  market_overview: {
    genre_landscape: string;
    saturation_level: string;
    growth_trend: string;
    key_trends: string[];
  };
  comparable_artists: Array<{
    name: string;
    monthly_listeners: number;
    relevance_score: number;
    positioning_gap: string;
  }>;
  audience_profile: {
    primary_age_range: string;
    gender_split: string;
    top_markets: string[];
    platforms: string[];
    psychographics: string;
  };
  playlist_landscape: {
    target_playlists: Array<{
      name: string;
      followers: number;
      placement_difficulty: string;
    }>;
    curator_patterns: string;
  };
  sonic_blueprint: {
    bpm_range: string;
    key_signatures: string[];
    energy_profile: string;
    production_style: string;
    sonic_signatures: string[];
  };
  opportunities: Array<{
    gap: string;
    market_score: number;
    success_probability: number;
  }>;
  revenue_projections: {
    streaming: string;
    touring: string;
    merch: string;
    sync_licensing: string;
  };
  risk_assessment: Array<{
    risk: string;
    severity: string;
  }>;
  recommendations: Array<{
    priority: number;
    action: string;
    timeline: string;
  }>;
}

export interface I1Confidence {
  overall_score: number;
  data_completeness: number;
  sources_used: string[];
  sources_failed: string[];
}

export interface Instrument1Report {
  id: string;
  project_id: string;
  version: number;
  report: I1Report;
  confidence: I1Confidence;
  created_at: string;
}

/* ———————— Instrument 2 Types ———————— */

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
  lyrics: string;
  structure: string;
  notes: string;
}

export interface Instrument2Prompts {
  id: string;
  project_id: string;
  report_id: string | null;
  version: number;
  style_profile: I2StyleProfile;
  vocalist_persona: I2VocalistPersona;
  tracks: I2Track[];
  created_at: string;
}

/* ———————— Moodboard Types ———————— */

export interface MoodboardImage {
  id: string;
  image_data?: string;
  sort_order: number;
  created_at: string;
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

export interface MoodboardResponse {
  images: MoodboardImage[];
  brief: MoodboardBrief | null;
  count: number;
}

/* ———————— Lyrics Types ———————— */

export type LyricEntryMode = 'paste' | 'conversation' | 'vibe';

export interface LyricSessionMessage {
  role: 'user' | 'advisor';
  content: string;
  type: 'chat' | 'rhyme' | 'synonym' | 'structure' | 'coherence' | 'nudge';
  dismissed?: boolean;
  timestamp: string;
}

export interface LyricNote {
  line: number;
  note: string;
  highlight?: string;
}

export interface LyricSession {
  id: string;
  project_id: string;
  title: string | null;
  lyrics: string;
  messages: LyricSessionMessage[];
  notes: LyricNote[];
  entry_mode: LyricEntryMode;
  vibe_context: string | null;
  created_at: string;
  updated_at: string;
}

export interface LyricSessionListItem {
  id: string;
  project_id: string;
  title: string | null;
  entry_mode: LyricEntryMode;
  lyrics_preview: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface LyricTheme {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  vibe_context: string;
  track_inspiration?: { title: string; notes: string } | null;
}

export interface LyricAdvisorResponse {
  userMessage: LyricSessionMessage;
  advisorMessage: LyricSessionMessage;
}

/* ———————— IMC Share Types ———————— */

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
  last_listened_at: string | null;
  created_at: string;
  updated_at: string;
  track_count?: number;
}

export interface ShareTrack {
  id: string;
  share_project_id: string;
  title: string;
  original_filename: string;
  dropbox_url: string;
  format: string;
  duration_ms: number | null;
  file_size_bytes: number | null;
  sort_order: number;
  play_count: number;
  created_at: string;
}

export interface TrackAnnotation {
  id: string;
  share_track_id: string;
  timestamp_ms: number;
  content: string;
  author_name: string | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareProjectWithTracks extends ShareProject {
  tracks: ShareTrack[];
}

export interface PublicShareData {
  id: string;
  title: string;
  artwork_url: string | null;
  theme: 'dark' | 'light';
  downloads_enabled: boolean;
  password_required: boolean;
  tracks: Array<{
    id: string;
    title: string;
    dropbox_url: string;
    format: string;
    duration_ms: number | null;
    sort_order: number;
  }>;
}

/* ———————— IMC 00: Checklist Types ———————— */

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
  created_at: string;
  updated_at: string;
}

export interface ChecklistSummary {
  total: number;
  checked: number;
  by_category: Record<ChecklistCategory, { total: number; checked: number }>;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  summary: ChecklistSummary;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  org_id: string;
  role: 'owner' | 'member';
  tier: 'creator' | 'pro' | 'team' | 'enterprise';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/* ———————— API Client ———————— */

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('imc_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem('imc_token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json();
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('imc_token');
      sessionStorage.removeItem('imc_user');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /* — Auth — */

  async register(data: { email: string; password: string; name: string; org_name: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('imc_user', JSON.stringify(res.user));
    }
    return res;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('imc_user', JSON.stringify(res.user));
    }
    return res;
  }

  async me(): Promise<{ user: AuthUser }> {
    return this.request('/api/auth/me');
  }

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('imc_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  /* — Projects — */

  async listProjects(): Promise<Project[]> {
    return this.request('/api/projects');
  }

  async createProject(artistName?: string, imageUrl?: string): Promise<Project> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ artist_name: artistName, image_url: imageUrl }),
    });
  }

  async generateProjectNames(context: {
    genres?: string[];
    vision?: string;
    moods?: string[];
    artists?: string[];
    shape?: string;
  }): Promise<{ names: string[] }> {
    return this.request('/api/projects/generate-names', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }
  }

  /* — Concept Conversation — */

  async getConversation(projectId: string): Promise<{ messages: ConversationMessage[] }> {
    return this.request(`/api/projects/${projectId}/conversation`);
  }

  async sendConceptMessage(projectId: string, content: string, immediate: boolean = false): Promise<ConversationResponse> {
    return this.request(`/api/instrument1/conversation/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content, ...(immediate && { immediate: true }) }),
    });
  }

  /* — Instrument 1: Market Research — */

  async runResearch(projectId: string): Promise<Instrument1Report> {
    return this.request(`/api/instrument1/run/${projectId}`, {
      method: 'POST',
    });
  }

  async getReport(projectId: string): Promise<Instrument1Report> {
    return this.request(`/api/instrument1/report/${projectId}`);
  }

  async getReportVersion(projectId: string, version: number): Promise<Instrument1Report> {
    return this.request(`/api/instrument1/report/${projectId}/${version}`);
  }

  /* — Instrument 2: Prompt Generation — */

  async generatePrompts(projectId: string): Promise<Instrument2Prompts> {
    return this.request(`/api/instrument2/generate/${projectId}`, {
      method: 'POST',
    });
  }

  async getPrompts(projectId: string): Promise<Instrument2Prompts> {
    return this.request(`/api/instrument2/prompts/${projectId}`);
  }

  async updatePrompts(id: string, data: Partial<Instrument2Prompts>): Promise<Instrument2Prompts> {
    return this.request(`/api/instrument2/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async regenerateTrack(id: string, trackNumber: number): Promise<Instrument2Prompts> {
    return this.request(`/api/instrument2/regenerate-track/${id}/${trackNumber}`, {
      method: 'POST',
    });
  }
  /* — IMC 00: Checklist — */

  async getChecklist(projectId: string): Promise<ChecklistResponse> {
    return this.request(`/api/checklist/${projectId}`);
  }

  async toggleChecklistItem(itemId: string): Promise<ChecklistItem> {
    return this.request(`/api/checklist/${itemId}/toggle`, { method: 'PATCH' });
  }

  async updateChecklistNotes(itemId: string, notes: string): Promise<ChecklistItem> {
    return this.request(`/api/checklist/${itemId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async addChecklistItem(projectId: string, category: ChecklistCategory, label: string): Promise<ChecklistItem> {
    return this.request(`/api/checklist/${projectId}/items`, {
      method: 'POST',
      body: JSON.stringify({ category, label }),
    });
  }

  async deleteChecklistItem(itemId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/checklist/${itemId}`, { method: 'DELETE' });
  }

  async getChecklistSummary(projectId: string): Promise<{ total: number; checked: number }> {
    return this.request(`/api/checklist/${projectId}/summary`);
  }

  /* — Moodboard — */

  async getMoodboard(projectId: string): Promise<MoodboardResponse> {
    return this.request(`/api/moodboard/${projectId}`);
  }

  async getMoodboardThumbnails(projectId: string): Promise<MoodboardImage[]> {
    return this.request(`/api/moodboard/${projectId}/thumbnails`);
  }

  async uploadMoodboardImages(projectId: string, images: string[]): Promise<{ images: MoodboardImage[]; count: number }> {
    return this.request(`/api/moodboard/${projectId}/images`, {
      method: 'POST',
      body: JSON.stringify({ images }),
    });
  }

  async deleteMoodboardImage(projectId: string, imageId: string): Promise<{ deleted: boolean; count: number }> {
    return this.request(`/api/moodboard/${projectId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  async analyzeMoodboard(projectId: string): Promise<{ brief: MoodboardBrief }> {
    return this.request(`/api/moodboard/${projectId}/analyze`, {
      method: 'POST',
    });
  }

  /**
   * Upload curated onboarding images to a project's moodboard.
   * Accepts an array of curated image IDs from the onboarding library.
   * The backend fetches the images from the CDN and creates moodboard entries.
   */
  async uploadOnboardingImages(projectId: string, imageIds: string[]): Promise<{ images: MoodboardImage[]; count: number }> {
    return this.request(`/api/moodboard/${projectId}/onboarding-images`, {
      method: 'POST',
      body: JSON.stringify({ image_ids: imageIds }),
    });
  }

  async flagMoodboardElement(projectId: string, element: string, flagged: boolean): Promise<{ brief: MoodboardBrief }> {
    return this.request(`/api/moodboard/${projectId}/brief/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ element, flagged }),
    });
  }

  /* — Lyrics — */

  async getLyricSessions(projectId: string): Promise<{ sessions: LyricSessionListItem[] }> {
    return this.request(`/api/lyric-advisor/${projectId}`);
  }

  async getLyricThemes(projectId: string, regenerate = false): Promise<{ themes: LyricTheme[] }> {
    const qs = regenerate ? '?regenerate=true' : '';
    return this.request(`/api/lyric-advisor/${projectId}/themes${qs}`);
  }

  async getLyricSession(projectId: string, sessionId: string): Promise<LyricSession> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}`);
  }

  async createLyricSession(projectId: string, data: {
    entry_mode: LyricEntryMode;
    title?: string;
    lyrics?: string;
    vibe_context?: string;
  }): Promise<LyricSession> {
    return this.request(`/api/lyric-advisor/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveLyrics(projectId: string, sessionId: string, lyrics: string): Promise<{ id: string; lyrics: string; title: string | null; updated_at: string }> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}/lyrics`, {
      method: 'PATCH',
      body: JSON.stringify({ lyrics }),
    });
  }

  async updateLyricSessionTitle(projectId: string, sessionId: string, title: string): Promise<LyricSession> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  async sendAdvisorMessage(projectId: string, sessionId: string, content: string, type: string = 'chat'): Promise<LyricAdvisorResponse> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async dismissAdvisorMessage(projectId: string, sessionId: string, messageIndex: number): Promise<{ dismissed: boolean }> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}/dismiss`, {
      method: 'PATCH',
      body: JSON.stringify({ messageIndex }),
    });
  }

  async saveLyricNotes(projectId: string, sessionId: string, notes: LyricNote[]): Promise<{ id: string; notes: LyricNote[]; updated_at: string }> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async deleteLyricSession(projectId: string, sessionId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /* — IMC Share — */

  async getShareProjects(projectId: string): Promise<{ projects: ShareProject[] }> {
    return this.request(`/api/share/${projectId}`);
  }

  async createShareProject(projectId: string, title?: string): Promise<ShareProject> {
    return this.request(`/api/share/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getShareProject(projectId: string, shareId: string): Promise<ShareProjectWithTracks> {
    return this.request(`/api/share/${projectId}/share/${shareId}`);
  }

  async updateShareProject(projectId: string, shareId: string, data: {
    title?: string;
    is_public?: boolean;
    downloads_enabled?: boolean;
    theme?: 'dark' | 'light';
  }): Promise<ShareProject> {
    return this.request(`/api/share/${projectId}/share/${shareId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async setSharePassword(projectId: string, shareId: string, password: string | null): Promise<{ password_set: boolean }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  }

  async regenerateShareLink(projectId: string, shareId: string): Promise<ShareProject> {
    return this.request(`/api/share/${projectId}/share/${shareId}/regenerate`, {
      method: 'POST',
    });
  }

  async uploadShareArtwork(projectId: string, shareId: string, file: File): Promise<{ artwork_url: string }> {
    // Resize image client-side to max 1200px and compress as JPEG
    const base64 = await this.resizeImage(file, 1200, 0.85);

    return this.request(`/api/share/${projectId}/share/${shareId}/artwork/upload`, {
      method: 'POST',
      body: JSON.stringify({
        data: base64,
        contentType: 'image/jpeg',
        filename: file.name,
      }),
    });
  }

  async uploadProjectImage(projectId: string, file: File): Promise<{ image_url: string }> {
    const base64 = await this.resizeImage(file, 1200, 0.85);

    return this.request(`/api/projects/${projectId}/image/upload`, {
      method: 'POST',
      body: JSON.stringify({
        data: base64,
        contentType: 'image/jpeg',
      }),
    });
  }

  private resizeImage(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG, strip the data:image/jpeg;base64, prefix
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async addShareTrack(projectId: string, shareId: string, dropboxUrl: string, title?: string): Promise<ShareTrack> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ dropbox_url: dropboxUrl, title }),
    });
  }

  async addShareTracksBatch(projectId: string, shareId: string, links: Array<{ dropbox_url: string; title?: string }>): Promise<{ tracks: ShareTrack[] }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/batch`, {
      method: 'POST',
      body: JSON.stringify({ links }),
    });
  }

  async renameShareTrack(projectId: string, shareId: string, trackId: string, title: string): Promise<ShareTrack> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  async reorderShareTracks(projectId: string, shareId: string, trackIds: string[]): Promise<{ tracks: ShareTrack[] }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ track_ids: trackIds }),
    });
  }

  async deleteShareTrack(projectId: string, shareId: string, trackId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  }

  async deleteShareProject(projectId: string, shareId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/share/${projectId}/share/${shareId}`, {
      method: 'DELETE',
    });
  }

  /* — Track Annotations — */

  async getTrackAnnotations(projectId: string, shareId: string, trackId: string): Promise<{ annotations: TrackAnnotation[] }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}/annotations`);
  }

  async addTrackAnnotation(projectId: string, shareId: string, trackId: string, data: { timestamp_ms: number; content: string; author_name?: string }): Promise<TrackAnnotation> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrackAnnotation(projectId: string, shareId: string, trackId: string, annotationId: string, data: { content?: string; resolved?: boolean }): Promise<TrackAnnotation> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}/annotations/${annotationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTrackAnnotation(projectId: string, shareId: string, trackId: string, annotationId: string): Promise<{ ok: boolean }> {
    return this.request(`/api/share/${projectId}/share/${shareId}/tracks/${trackId}/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  }

  /* — Public Share (no auth) — */

  async getPublicShare(slug: string, shareToken?: string): Promise<PublicShareData> {
    const headers: Record<string, string> = {};
    if (shareToken) {
      headers['x-share-token'] = shareToken;
    }
    const token = this.getToken();
    const allHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (token) {
      allHeaders['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/s/${slug}`, { headers: allHeaders });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || error.error || `API error: ${res.status}`);
    }
    return res.json();
  }

  async verifySharePassword(slug: string, password: string): Promise<{ verified: boolean; token: string }> {
    const res = await fetch(`${API_BASE}/api/s/${slug}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || error.error || `API error: ${res.status}`);
    }
    return res.json();
  }

  async recordTrackPlay(slug: string, trackId: string): Promise<void> {
    await fetch(`${API_BASE}/api/s/${slug}/play/${trackId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const api = new ApiClient();
