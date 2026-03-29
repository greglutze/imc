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

export async function searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
  const data = (await spotifyRequest(
    `/search?type=artist&q=${encodeURIComponent(query)}&limit=${limit}`
  )) as { artists: { items: unknown[] } };

  return data.artists.items.map((item: unknown) => {
    const artist = item as {
      id: string;
      name: string;
      genres: string[];
      popularity: number;
      followers: { total: number };
      images: Array<{ url: string }>;
    };
    return {
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      images: artist.images,
    };
  });
}

export async function getArtist(id: string): Promise<SpotifyArtist> {
  const artist = (await spotifyRequest(`/artists/${id}`)) as {
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    followers: { total: number };
    images: Array<{ url: string }>;
  };

  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    followers: artist.followers.total,
    images: artist.images,
  };
}

export async function getRelatedArtists(id: string): Promise<SpotifyArtist[]> {
  const data = (await spotifyRequest(`/artists/${id}/related-artists`)) as { artists: unknown[] };

  return data.artists.map((item: unknown) => {
    const artist = item as {
      id: string;
      name: string;
      genres: string[];
      popularity: number;
      followers: { total: number };
      images: Array<{ url: string }>;
    };
    return {
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      images: artist.images,
    };
  });
}

export async function getArtistTopTracks(id: string, market: string = 'US'): Promise<SpotifyTrack[]> {
  const data = (await spotifyRequest(
    `/artists/${id}/top-tracks?market=${market}`
  )) as { tracks: unknown[] };

  return data.tracks.map((item: unknown) => {
    const track = item as {
      id: string;
      name: string;
      popularity: number;
      duration_ms: number;
      album: { name: string; release_date: string };
      preview_url: string | null;
    };
    return {
      id: track.id,
      name: track.name,
      popularity: track.popularity,
      duration_ms: track.duration_ms,
      album: track.album,
      preview_url: track.preview_url,
    };
  });
}

export async function searchPlaylists(query: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
  const data = (await spotifyRequest(
    `/search?type=playlist&q=${encodeURIComponent(query)}&limit=${limit}`
  )) as { playlists: { items: unknown[] } };

  return data.playlists.items.map((item: unknown) => {
    const playlist = item as {
      id: string;
      name: string;
      description: string;
      tracks: { total: number };
      owner: { display_name: string };
      images: Array<{ url: string }>;
    };
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      tracks_total: playlist.tracks.total,
      owner: playlist.owner,
      images: playlist.images,
    };
  });
}

export async function getAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
  const data = (await spotifyRequest(
    `/audio-features?ids=${trackIds.join(',')}`
  )) as { audio_features: unknown[] };

  return data.audio_features.map((item: unknown) => {
    const features = item as SpotifyAudioFeatures;
    return features;
  });
}
