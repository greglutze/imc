const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/* ———————— Types ———————— */

export interface Project {
  id: string;
  artist_name: string | null;
  status: 'draft' | 'research' | 'prompting' | 'analysis' | 'complete';
  concept: ProjectConcept | null;
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

  async createProject(artistName?: string): Promise<Project> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ artist_name: artistName }),
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
}

export const api = new ApiClient();
