import { analyze } from './ai';
import {
  searchArtists,
  searchPlaylists,
  findRelatedArtists,
  findArtistTracks,
} from './spotify';
import { ProjectConcept, I1Report, I1Confidence } from '../types';

const MARKET_RESEARCH_SYSTEM_PROMPT = `You are IMC's market intelligence engine. You speak like an experienced A&R executive — direct, data-backed, realistic, and actionable.

Analyze the provided market data and artist concept. Produce a comprehensive market research report as JSON matching EXACTLY this structure — do not deviate from these field names or types:

{
  "market_overview": {
    "genre_landscape": "2-3 sentence overview of the genre space",
    "saturation_level": "Low|Low-Medium|Medium|Medium-High|High",
    "growth_trend": "Declining|Stable|Growing steadily|Emerging rapidly",
    "key_trends": ["trend 1", "trend 2", "trend 3", "trend 4"]
  },
  "comparable_artists": [
    {
      "name": "Artist Name",
      "monthly_listeners": 1500000,
      "relevance_score": 85,
      "positioning_gap": "How the new artist differentiates from this comparable"
    }
  ],
  "audience_profile": {
    "primary_age_range": "25–35",
    "gender_split": "58% Male, 42% Female",
    "top_markets": ["Country 1", "Country 2", "Country 3"],
    "platforms": ["Spotify", "Apple Music", "Bandcamp"],
    "psychographics": "Single paragraph describing the listener psychographic profile"
  },
  "playlist_landscape": {
    "target_playlists": [
      { "name": "Playlist Name", "followers": 2100000, "placement_difficulty": "High|Medium|Low" }
    ],
    "curator_patterns": "Description of curator behavior and algorithmic patterns"
  },
  "sonic_blueprint": {
    "bpm_range": "110–140",
    "key_signatures": ["C minor", "A minor"],
    "energy_profile": "Description of energy arc and levels",
    "production_style": "Description of production approach and techniques",
    "sonic_signatures": ["signature 1", "signature 2", "signature 3"]
  },
  "opportunities": [
    { "gap": "Market gap description", "market_score": 87, "success_probability": 72 }
  ],
  "revenue_projections": {
    "streaming": "$8K–15K/mo at 500K monthly listeners",
    "touring": "$2K–5K per show estimate",
    "merch": "$1K–3K/mo estimate",
    "sync_licensing": "$5K–25K per placement"
  },
  "risk_assessment": [
    { "risk": "Risk description", "severity": "Low|Medium|High" }
  ],
  "recommendations": [
    { "priority": 1, "action": "What to do", "timeline": "0–2 months" }
  ]
}

CRITICAL: relevance_score, market_score, and success_probability are integers 0-100 (not decimals). risk_assessment and recommendations are arrays (not nested objects). revenue_projections uses "merch" not "merchandise". audience_profile uses "psychographics" (string) and "primary_age_range".

Be honest. Show probability ranges, not certainty. Every insight must be data-backed. Never overpromise success.`;

interface MarketResearchContext {
  concept: ProjectConcept;
  referenceArtists: SpotifyArtist[];
  relatedArtists: SpotifyArtist[];
  referenceTracks: SpotifyTrack[];
  targetPlaylists: SpotifyPlaylist[];
  sourcesUsed: string[];
  sourcesFailed: string[];
}

async function buildMarketContext(concept: ProjectConcept): Promise<MarketResearchContext> {
  const context: MarketResearchContext = {
    concept,
    referenceArtists: [],
    relatedArtists: [],
    referenceTracks: [],
    targetPlaylists: [],
    sourcesUsed: [],
    sourcesFailed: [],
  };

  console.log('[Research] Building market context for:', concept.reference_artists[0] || 'unknown artist');
  console.log('[Research] Reference artists:', concept.reference_artists);
  console.log('[Research] Genres:', concept.genre_primary, concept.genre_secondary);

  // Source 1: Search for reference artists
  try {
    const query = concept.reference_artists.join(' ');
    console.log('[Research] Searching Spotify for reference artists:', query);
    const refArtists = await searchArtists(query, 10);
    context.referenceArtists = refArtists;
    console.log(`[Research] ✓ Found ${refArtists.length} reference artists:`, refArtists.map((a) => a.name));
    context.sourcesUsed.push('Spotify reference artists search');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Research] ✗ Reference artists search failed:', msg);
    context.sourcesFailed.push('Spotify reference artists search');
  }

  // Source 2: Find related artists via genre search (replaces restricted /related-artists endpoint)
  try {
    console.log('[Research] Finding related artists via search...');
    const related = await findRelatedArtists(context.referenceArtists, concept.genre_primary);
    context.relatedArtists = related;
    console.log(`[Research] ✓ Found ${related.length} related artists via search`);
    if (related.length > 0) {
      context.sourcesUsed.push('Spotify related artists (via search)');
    } else {
      context.sourcesFailed.push('Spotify related artists (via search)');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Research] ✗ Related artists search failed:', msg);
    context.sourcesFailed.push('Spotify related artists (via search)');
  }

  // Source 3: Find tracks by reference artists (replaces restricted /top-tracks endpoint)
  for (const artist of context.referenceArtists.slice(0, 3)) {
    try {
      const tracks = await findArtistTracks(artist.name, concept.genre_primary);
      console.log(`[Research] ✓ Tracks for ${artist.name}: ${tracks.length}`);
      context.referenceTracks.push(...tracks.slice(0, 5));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Research] ✗ Track search failed for ${artist.name}:`, msg);
    }
  }

  if (context.referenceTracks.length > 0) {
    console.log(`[Research] ✓ Total reference tracks: ${context.referenceTracks.length}`);
    context.sourcesUsed.push('Spotify track search');
  } else {
    console.warn('[Research] ✗ No reference tracks found');
    context.sourcesFailed.push('Spotify track search');
  }

  // Source 4: Search playlists for genre
  const genreQuery = `${concept.genre_primary} ${concept.genre_secondary[0] || ''}`.trim();

  try {
    console.log('[Research] Searching playlists for genre:', genreQuery);
    const playlists = await searchPlaylists(genreQuery, 15);
    context.targetPlaylists = playlists;
    console.log(`[Research] ✓ Found ${playlists.length} genre playlists`);
    context.sourcesUsed.push('Spotify genre playlists');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Research] ✗ Genre playlists failed:', msg);
    context.sourcesFailed.push('Spotify genre playlists');
  }

  console.log('[Research] Context built — sources used:', context.sourcesUsed, 'failed:', context.sourcesFailed);

  return context;
}

function contextToPrompt(context: MarketResearchContext): string {
  const artistSummary = context.referenceArtists
    .map((a) => `${a.name} (popularity: ${a.popularity}, followers: ${a.followers}, genres: ${a.genres.join(', ')})`)
    .join('\n');

  const relatedSummary = context.relatedArtists
    .slice(0, 15)
    .map((a) => `${a.name} (popularity: ${a.popularity}, genres: ${a.genres.join(', ')})`)
    .join('\n');

  const trackSummary = context.referenceTracks
    .slice(0, 15)
    .map((t) => `${t.name} (popularity: ${t.popularity}, duration: ${Math.round(t.duration_ms / 1000)}s, album: ${t.album.name})`)
    .join('\n');

  const playlistSummary = context.targetPlaylists
    .slice(0, 10)
    .map((p) => `${p.name} (${p.tracks_total} tracks, by ${p.owner.display_name})`)
    .join('\n');

  return `
Artist Concept:
- Primary Genre: ${context.concept.genre_primary}
- Secondary Genres: ${context.concept.genre_secondary.join(', ')}
- Reference Artists: ${context.concept.reference_artists.join(', ')}
- Creative Direction: ${context.concept.creative_direction}
- Target Audience: ${context.concept.target_audience}
- Mood Keywords: ${context.concept.mood_keywords.join(', ')}
- Track Count: ${context.concept.track_count}

Reference Artists Found:
${artistSummary || 'No data'}

Related Artists in Genre (Sample):
${relatedSummary || 'No data'}

Reference Tracks Found:
${trackSummary || 'No data'}

Target Genre Playlists:
${playlistSummary || 'No data'}

Data Sources Used: ${context.sourcesUsed.join(', ')}
Data Sources Failed: ${context.sourcesFailed.join(', ')}

Generate a comprehensive market research report for this artist concept based on the data above.
`;
}

export async function runMarketResearch(
  concept: ProjectConcept
): Promise<{ report: I1Report; confidence: I1Confidence }> {
  const context = await buildMarketContext(concept);

  const prompt = contextToPrompt(context);

  let reportJson: I1Report = {
    market_overview: {
      genre_landscape: '',
      saturation_level: 'Medium',
      growth_trend: 'Stable',
      key_trends: [],
    },
    comparable_artists: [],
    audience_profile: {
      primary_age_range: '',
      gender_split: '',
      top_markets: [],
      platforms: [],
      psychographics: '',
    },
    playlist_landscape: {
      target_playlists: [],
      curator_patterns: '',
    },
    sonic_blueprint: {
      bpm_range: '',
      key_signatures: [],
      energy_profile: '',
      production_style: '',
      sonic_signatures: [],
    },
    opportunities: [],
    revenue_projections: {
      streaming: '$0',
      touring: '$0',
      merch: '$0',
      sync_licensing: '$0',
    },
    risk_assessment: [],
    recommendations: [],
  };

  try {
    const response = await analyze(MARKET_RESEARCH_SYSTEM_PROMPT, prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        reportJson = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse report JSON:', e);
      }
    }
  } catch (e) {
    console.error('Failed to generate market research:', e);
  }

  const totalSources = context.sourcesUsed.length + context.sourcesFailed.length;
  const completenessRatio = totalSources > 0 ? context.sourcesUsed.length / totalSources : 0.5;
  const overallScore = Math.round(completenessRatio * 100);

  const confidence: I1Confidence = {
    overall_score: overallScore,
    data_completeness: Math.round(completenessRatio * 100),
    sources_used: context.sourcesUsed,
    sources_failed: context.sourcesFailed,
  };

  return { report: reportJson, confidence };
}
