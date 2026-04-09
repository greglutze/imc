const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('v2_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Auth ──

export interface AuthResponse {
  user: { id: string; email: string; name: string };
  token: string;
}

export async function register(email: string, name: string, password: string): Promise<AuthResponse> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Artists ──

export interface Artist {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export async function getArtists(): Promise<Artist[]> {
  return apiFetch('/artists');
}

export async function createArtist(name: string, bio?: string): Promise<Artist> {
  return apiFetch('/artists', {
    method: 'POST',
    body: JSON.stringify({ name, bio }),
  });
}

// ── Archive ──

export interface ArchiveItem {
  id: string;
  artist_id: string;
  content_type: 'text' | 'image' | 'audio' | 'link' | 'video';
  title: string | null;
  raw_text: string | null;
  file_key: string | null;
  file_url: string | null;
  metadata: Record<string, unknown>;
  source: string;
  is_external: boolean;
  has_image?: boolean;
  created_at: string;
}

export async function getArchiveItems(
  artistId: string,
  params?: { content_type?: string; limit?: number; offset?: number }
): Promise<ArchiveItem[]> {
  const search = new URLSearchParams();
  if (params?.content_type) search.set('content_type', params.content_type);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  const qs = search.toString() ? `?${search}` : '';
  return apiFetch(`/archive/${artistId}/items${qs}`);
}

export async function getArchiveItem(artistId: string, itemId: string): Promise<ArchiveItem> {
  return apiFetch(`/archive/${artistId}/items/${itemId}`);
}

export async function addArchiveItem(
  artistId: string,
  item: {
    content_type: string;
    title?: string;
    raw_text?: string;
    file_url?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ArchiveItem> {
  return apiFetch(`/archive/${artistId}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function uploadArchiveImage(
  artistId: string,
  imageData: string,
  imageContentType: string,
  title?: string
): Promise<ArchiveItem> {
  return apiFetch(`/archive/${artistId}/items/image`, {
    method: 'POST',
    body: JSON.stringify({
      image_data: imageData,
      image_content_type: imageContentType,
      title,
    }),
  });
}

export function getArchiveImageUrl(artistId: string, itemId: string): string {
  return `${API_BASE}/archive/${artistId}/items/${itemId}/image`;
}

export async function searchArchive(
  artistId: string,
  query: string,
  limit = 10
): Promise<(ArchiveItem & { similarity: number })[]> {
  return apiFetch(`/archive/${artistId}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}
