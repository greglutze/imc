export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  images: Array<{ url: string }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  album: { name: string; release_date: string };
  preview_url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks_total: number;
  owner: { display_name: string };
  images: Array<{ url: string }>;
}

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  tempo: number;
  key: number;
  mode: number;
  valence: number;
  loudness: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Spotify] Credentials missing — SPOTIFY_CLIENT_ID:', clientId ? 'set' : 'MISSING', 'SPOTIFY_CLIENT_SECRET:', clientSecret ? 'set' : 'MISSING');
    throw new Error('Spotify credentials not configured');
  }

  console.log('[Spotify] Requesting access token...');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    console.error(`[Spotify] Token request failed: ${response.status} ${response.statusText}`, body);
    throw new Error(`Failed to get Spotify access token: ${response.status} ${response.statusText} — ${body}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000) - 60000;
  console.log('[Spotify] Access token obtained, expires in', data.expires_in, 'seconds');

  return cachedToken;
}

async function spotifyRequest(
  endpoint: string,
  options?: RequestInit
): Promise<unknown> {
  console.log(`[Spotify] Request: GET /v1${endpoint}`);
  let token = await getAccessToken();

  let response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    console.warn('[Spotify] 401 — refreshing token and retrying...');
    cachedToken = null;
    tokenExpiry = 0;
    token = await getAccessToken();

    response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    console.error(`[Spotify] API error on ${endpoint}: ${response.status} ${response.statusText}`, body);
    throw new Error(`Spotify API error: ${response.status} ${response.statusText} — ${body}`);
  }

  console.log(`[Spotify] ✓ ${endpoint} — ${response.status}`);
  return response.json();
}

// ──────────────────────────────────────────
// Search endpoints (these work without extended quota)
// ──────────────────────────────────────────

export async function searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
  const data = (await spotifyRequest(
    `/search?type=artist&q=${encodeURIComponent(query)}&limit=${limit}`
  )) as { artists: { items: unknown[] } };

  return data.artists.items
    .filter((item: unknown) => item !== null && item !== undefined)
    .map((item: unknown) => {
      const artist = item as {
        id: string;
        name: string;
        genres: string[];
        popularity: number;
        followers: { total: number } | null;
        images: Array<{ url: string }>;
      };
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
        followers: artist.followers?.total ?? 0,
        images: artist.images || [],
      };
    });
}

export async function searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
  const data = (await spotifyRequest(
    `/search?type=track&q=${encodeURIComponent(query)}&limit=${limit}`
  )) as { tracks: { items: unknown[] } };

  return data.tracks.items
    .filter((item: unknown) => item !== null && item !== undefined)
    .map((item: unknown) => {
      const track = item as {
        id: string;
        name: string;
        popularity: number;
        duration_ms: number;
        album: { name: string; release_date: string } | null;
        preview_url: string | null;
      };
      return {
        id: track.id,
        name: track.name,
        popularity: track.popularity || 0,
        duration_ms: track.duration_ms || 0,
        album: track.album || { name: 'Unknown', release_date: '' },
        preview_url: track.preview_url,
      };
    });
}

export async function searchPlaylists(query: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
  const data = (await spotifyRequest(
    `/search?type=playlist&q=${encodeURIComponent(query)}&limit=${limit}`
  )) as { playlists: { items: unknown[] } };

  return data.playlists.items
    .filter((item: unknown) => item !== null && item !== undefined)
    .map((item: unknown) => {
      const playlist = item as {
        id: string;
        name: string;
        description: string;
        tracks: { total: number } | null;
        owner: { display_name: string } | null;
        images: Array<{ url: string }>;
      };
      return {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        tracks_total: playlist.tracks?.total ?? 0,
        owner: playlist.owner || { display_name: 'Unknown' },
        images: playlist.images || [],
      };
    });
}

// ──────────────────────────────────────────
// Search-based alternatives for restricted endpoints
// ──────────────────────────────────────────

/**
 * Find related artists by searching for genre + similar terms.
 * Replaces the restricted /artists/{id}/related-artists endpoint.
 */
export async function findRelatedArtists(
  referenceArtists: SpotifyArtist[],
  genre: string
): Promise<SpotifyArtist[]> {
  const seen = new Set(referenceArtists.map((a) => a.id));
  const related: SpotifyArtist[] = [];

  // Strategy 1: Search by genre keywords (plain text, no special syntax)
  if (genre) {
    try {
      const genreResults = await searchArtists(genre, 20);
      for (const artist of genreResults) {
        if (!seen.has(artist.id)) {
          seen.add(artist.id);
          related.push(artist);
        }
      }
    } catch (e) {
      console.warn('[Spotify] Genre search fallback failed:', e instanceof Error ? e.message : e);
    }
  }

  // Strategy 2: Search each reference artist name individually for more variety
  for (const ref of referenceArtists.slice(0, 3)) {
    try {
      const results = await searchArtists(ref.name, 5);
      for (const artist of results) {
        if (!seen.has(artist.id)) {
          seen.add(artist.id);
          related.push(artist);
        }
      }
    } catch (e) {
      console.warn(`[Spotify] Individual artist search failed for ${ref.name}:`, e instanceof Error ? e.message : e);
    }
  }

  return related;
}

/**
 * Find tracks by searching for artist name + genre.
 * Replaces the restricted /artists/{id}/top-tracks endpoint.
 */
export async function findArtistTracks(
  artistName: string,
  _genre?: string
): Promise<SpotifyTrack[]> {
  return searchTracks(artistName, 10);
}
