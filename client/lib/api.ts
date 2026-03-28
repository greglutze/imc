const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  udio_prompt: string;
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

/* ———————— Lyric Advisor Types ———————— */

export type LyricEntryMode = 'paste' | 'conversation' | 'vibe';

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

export interface LyricAdvisorResponse {
  userMessage: LyricSessionMessage;
  advisorMessage: LyricSessionMessage;
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

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /* — Concept Conversation — */

  async getConversation(projectId: string): Promise<{ messages: ConversationMessage[] }> {
    return this.request(`/api/projects/${projectId}/conversation`);
  }

  async sendConceptMessage(projectId: string, content: string): Promise<ConversationResponse> {
    return this.request(`/api/instrument1/conversation/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content }),
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

  async flagMoodboardElement(projectId: string, element: string, flagged: boolean): Promise<{ brief: MoodboardBrief }> {
    return this.request(`/api/moodboard/${projectId}/brief/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ element, flagged }),
    });
  }

  /* — Lyric Advisor — */

  async getLyricSessions(projectId: string): Promise<{ sessions: LyricSessionListItem[] }> {
    return this.request(`/api/lyric-advisor/${projectId}`);
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

  async deleteLyricSession(projectId: string, sessionId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/lyric-advisor/${projectId}/session/${sessionId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
