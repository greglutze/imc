import { analyze } from './ai';
import {
  searchArtists,
  getRelatedArtists,
  getArtistTopTracks,
  searchPlaylists,
  getAudioFeatures,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyAudioFeatures,
} from './spotify';
import { ProjectConcept, I1Report, I1Confidence } from '../types';

const MARKET_RESEARCH_SYSTEM_PROMPT = `You are IMC's market intelligence engine. You speak like an experienced A&R executive — direct, data-backed, realistic, and actionable.

Analyze the provided market data and artist concept. Produce a comprehensive market research report as JSON matching exactly this structure:

{
  "market_overview": { "genre_landscape": "...", "saturation_level": "low|medium|high", "growth_trend": "declining|stable|growing|emerging", "key_trends": ["..."] },
  "comparable_artists": [{ "name": "...", "monthly_listeners": N, "relevance_score": 0.0-1.0, "positioning_gap": "..." }],
  "audience_profile": { "age_range": "...", "gender_split": "...", "top_markets": ["..."], "platforms": ["..."], "psychographic_traits": ["..."] },
  "playlist_landscape": { "target_playlists": ["..."], "curator_patterns": "...", "placement_difficulty": "easy|moderate|difficult|very_difficult" },
  "sonic_blueprint": { "bpm_range": "...", "key_signatures": ["..."], "energy_level": "low|medium|high", "production_aesthetic": "...", "sonic_signatures": ["..."] },
  "opportunities": [{ "title": "...", "description": "...", "market_gap_score": 0.0-10.0, "success_probability": "..." }],
  "revenue_projections": { "streaming": "$X-$Y", "touring": "$X-$Y", "merchandise": "$X-$Y", "sync_licensing": "$X-$Y", "total_year1": "$X-$Y" },
  "risk_assessment": { "risks": [{ "category": "...", "description": "...", "severity": "low|medium|high" }] },
  "recommendations": { "items": [{ "priority": "critical|high|standard", "action": "..." }] }
}

Be honest. Show probability ranges, not certainty. Every insight must be data-backed. Never overpromise success.`;

interface MarketResearchContext {
  concept: ProjectConcept;
  referenceArtists: SpotifyArtist[];
  relatedArtists: SpotifyArtist[];
  audioFeatures: SpotifyAudioFeatures[];
  targetPlaylists: SpotifyPlaylist[];
  sourcesUsed: string[];
  sourcesFailed: string[];
}

async function buildMarketContext(concept: ProjectConcept): Promise<MarketResearchContext> {
  const context: MarketResearchContext = {
    concept,
    referenceArtists: [],
    relatedArtists: [],
    audioFeatures: [],
    targetPlaylists: [],
    sourcesUsed: [],
    sourcesFailed: [],
  };

  try {
    const refArtists = await searchArtists(concept.reference_artists.join(' '), 10);
    context.referenceArtists = refArtists;
    context.sourcesUsed.push('Spotify reference artists search');
  } catch (e) {
    console.error('Failed to search reference artists:', e);
    context.sourcesFailed.push('Spotify reference artists search');
  }

  const artistIds = context.referenceArtists.map((a) => a.id).slice(0, 5);

  for (const artistId of artistIds) {
    try {
      const related = await getRelatedArtists(artistId);
      context.relatedArtists.push(...related);
    } catch (e) {
      console.error(`Failed to get related artists for ${artistId}:`, e);
    }
  }

  if (context.relatedArtists.length > 0) {
    context.sourcesUsed.push('Spotify related artists');
  } else {
    context.sourcesFailed.push('Spotify related artists');
  }

  const trackIds: string[] = [];

  for (const artist of context.referenceArtists.slice(0, 3)) {
    try {
      const tracks = await getArtistTopTracks(artist.id);
      trackIds.push(...tracks.slice(0, 3).map((t) => t.id));
    } catch (e) {
      console.error(`Failed to get top tracks for ${artist.name}:`, e);
    }
  }

  if (trackIds.length > 0) {
    try {
      const features = await getAudioFeatures(trackIds);
      context.audioFeatures = features.filter((f) => f !== null);
      context.sourcesUsed.push('Spotify audio features');
    } catch (e) {
      console.error('Failed to get audio features:', e);
      context.sourcesFailed.push('Spotify audio features');
    }
  }

  const genreQuery = `${concept.genre_primary} ${concept.genre_secondary[0] || ''}`.trim();

  try {
    const playlists = await searchPlaylists(genreQuery, 15);
    context.targetPlaylists = playlists;
    context.sourcesUsed.push('Spotify genre playlists');
  } catch (e) {
    console.error('Failed to search playlists:', e);
    context.sourcesFailed.push('Spotify genre playlists');
  }

  return context;
}

function contextToPrompt(context: MarketResearchContext): string {
  const artistSummary = context.referenceArtists
    .map((a) => `${a.name} (popularity: ${a.popularity}, followers: ${a.followers})`)
    .join('\n');

  const relatedSummary = context.relatedArtists
    .slice(0, 10)
    .map((a) => `${a.name} (${a.genres.join(', ')})`)
    .join('\n');

  const audioFeaturesSummary =
    context.audioFeatures.length > 0
      ? `Average audio features: Danceability ${(context.audioFeatures.reduce((a, f) => a + f.danceability, 0) / context.audioFeatures.length).toFixed(2)}, Energy ${(context.audioFeatures.reduce((a, f) => a + f.energy, 0) / context.audioFeatures.length).toFixed(2)}, Tempo ${(context.audioFeatures.reduce((a, f) => a + f.tempo, 0) / context.audioFeatures.length).toFixed(0)}`
      : 'No audio features data';

  const playlistSummary = context.targetPlaylists
    .slice(0, 10)
    .map((p) => `${p.name} (${p.tracks_total} tracks)`)
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

Related Artists (Sample):
${relatedSummary || 'No data'}

Audio Features Analysis:
${audioFeaturesSummary}

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
      saturation_level: 'medium',
      growth_trend: 'stable',
      key_trends: [],
    },
    comparable_artists: [],
    audience_profile: {
      age_range: '',
      gender_split: '',
      top_markets: [],
      platforms: [],
      psychographic_traits: [],
    },
    playlist_landscape: {
      target_playlists: [],
      curator_patterns: '',
      placement_difficulty: 'moderate',
    },
    sonic_blueprint: {
      bpm_range: '',
      key_signatures: [],
      energy_level: 'medium',
      production_aesthetic: '',
      sonic_signatures: [],
    },
    opportunities: [],
    revenue_projections: {
      streaming: '$0-$5000',
      touring: '$0-$10000',
      merchandise: '$0-$2000',
      sync_licensing: '$0-$1000',
      total_year1: '$0-$18000',
    },
    risk_assessment: {
      risks: [],
    },
    recommendations: {
      items: [],
    },
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
