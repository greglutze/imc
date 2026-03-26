import { analyze } from './ai';
import {
  AudioFeatures,
  ProjectConcept,
  I1Report,
  I3Analysis,
  I3SuccessScore,
  I3Recommendation,
} from '../types';

const GENRE_BPM_EXPECTATIONS: Record<string, [number, number]> = {
  pop: [100, 130],
  'hip-hop': [70, 100],
  hip_hop: [70, 100],
  electronic: [120, 150],
  dance: [120, 150],
  edm: [120, 150],
  house: [120, 130],
  techno: [120, 150],
  rock: [110, 140],
  'alternative rock': [110, 140],
  'indie rock': [100, 140],
  metal: [100, 160],
  'r&b': [80, 110],
  rb: [80, 110],
  soul: [80, 110],
  funk: [90, 120],
  reggae: [70, 90],
  'classical': [60, 100],
  ambient: [60, 100],
  punk: [140, 180],
  jazz: [80, 200],
  latin: [80, 130],
  country: [100, 120],
  folk: [80, 120],
};

interface HeuristicScores {
  audio_quality: number;
  genre_fit: number;
  hook_potential: number;
  production_quality: number;
  commercial_viability: number;
}

function getGenreBpmRange(genrePrimary: string): [number, number] {
  const normalized = genrePrimary.toLowerCase().replace(/\s+/g, '_');
  return GENRE_BPM_EXPECTATIONS[normalized] || [80, 140];
}

function calculateHeuristicScores(
  features: AudioFeatures,
  concept: ProjectConcept
): HeuristicScores {
  // Audio Quality (25%): LUFS, dynamic range
  let audioQualityScore = 50;
  const lufs = features.loudness_lufs;

  // Ideal LUFS range: -16 to -9 dB
  if (lufs >= -16 && lufs <= -9) {
    audioQualityScore = 95;
  } else if (lufs > -9 && lufs <= -6) {
    // Slightly hot, minor penalty
    audioQualityScore = 80;
  } else if (lufs < -16 && lufs >= -20) {
    // Slightly quiet, minor penalty
    audioQualityScore = 80;
  } else if (lufs > -6) {
    // Clipping risk
    audioQualityScore = 40;
  } else if (lufs < -20) {
    // Too quiet
    audioQualityScore = 50;
  }

  // Boost for good dynamic range (> 6 dB)
  if (features.dynamic_range > 6) {
    audioQualityScore = Math.min(100, audioQualityScore + 10);
  }

  // Genre Fit (25%): BPM alignment
  let genreFitScore = 50;
  const [minBpm, maxBpm] = getGenreBpmRange(concept.genre_primary);
  const bpm = features.bpm;

  if (bpm >= minBpm && bpm <= maxBpm) {
    genreFitScore = 95;
  } else if (
    (bpm >= minBpm - 20 && bpm < minBpm) ||
    (bpm > maxBpm && bpm <= maxBpm + 20)
  ) {
    // Close to range
    genreFitScore = 75;
  } else {
    genreFitScore = 40;
  }

  // Energy alignment with genre
  // Most genres expect moderate to high energy; ambient/classical expect low
  if (
    concept.genre_primary.toLowerCase().includes('ambient') ||
    concept.genre_primary.toLowerCase().includes('classical')
  ) {
    if (features.energy < 0.3) genreFitScore = Math.min(100, genreFitScore + 10);
  } else {
    if (features.energy >= 0.1) genreFitScore = Math.min(100, genreFitScore + 5);
  }

  // Hook Potential (20%): Onset rate + danceability balance
  let hookScore = 50;

  // Higher onset rate = more rhythmic density = hookier
  const onsetScore = Math.min(100, features.onset_rate * 20);
  hookScore = onsetScore * 0.6;

  // Danceability should be moderate (0.4-0.8 is commercial sweet spot)
  const danceability = features.danceability;
  if (danceability >= 0.4 && danceability <= 0.8) {
    hookScore = Math.min(100, hookScore + 20);
  } else if (danceability > 0.8 || danceability < 0.4) {
    // Extremes reduce hook potential
    hookScore = Math.max(0, hookScore - 10);
  }

  // Production Quality (15%): Spectral centroid + dynamic range
  let prodScore = 50;

  // Healthy spectral centroid range: 0.2-0.4 (not too muddy, not too bright)
  const sc = features.spectral_centroid;
  if (sc >= 0.2 && sc <= 0.4) {
    prodScore = 90;
  } else if ((sc >= 0.15 && sc < 0.2) || (sc > 0.4 && sc <= 0.5)) {
    prodScore = 70;
  } else {
    prodScore = 50;
  }

  // Boost for good dynamic range
  if (features.dynamic_range > 6) {
    prodScore = Math.min(100, prodScore + 15);
  }

  // Commercial Viability (15%): Danceability + energy
  let commercialScore = 50;

  if (danceability >= 0.4 && danceability <= 0.8) {
    commercialScore = 85;
  } else if (danceability >= 0.3 && danceability < 0.4) {
    commercialScore = 70;
  } else if (danceability > 0.8 && danceability <= 0.95) {
    commercialScore = 80;
  } else {
    commercialScore = 40;
  }

  // Energy boost (should be at least moderate for most genres)
  if (features.energy >= 0.15) {
    commercialScore = Math.min(100, commercialScore + 5);
  }

  return {
    audio_quality: Math.round(audioQualityScore),
    genre_fit: Math.round(genreFitScore),
    hook_potential: Math.round(hookScore),
    production_quality: Math.round(prodScore),
    commercial_viability: Math.round(commercialScore),
  };
}

function calculateSuccessScore(
  features: AudioFeatures,
  concept: ProjectConcept
): I3SuccessScore {
  const heuristics = calculateHeuristicScores(features, concept);

  // Weighted average
  const overall = Math.round(
    heuristics.audio_quality * 0.25 +
      heuristics.genre_fit * 0.25 +
      heuristics.hook_potential * 0.2 +
      heuristics.production_quality * 0.15 +
      heuristics.commercial_viability * 0.15
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    breakdown: {
      audio_quality: heuristics.audio_quality,
      genre_fit: heuristics.genre_fit,
      hook_potential: heuristics.hook_potential,
      production_quality: heuristics.production_quality,
      commercial_viability: heuristics.commercial_viability,
    },
    criteria_version: 'v1.0',
  };
}

interface AIAnalysisResponse {
  audio_quality: {
    loudness_lufs: number;
    dynamic_range: number;
    frequency_balance: string;
    mix_notes: string;
  };
  hook_effectiveness: {
    repetition_score: number;
    melodic_contour: string;
    hook_timestamps: string[];
    overall_score: number;
  };
  structure: {
    sections: Array<{ name: string; start: string; end: string }>;
    pacing_assessment: string;
    transitions_quality: string;
  };
  competitive_position: {
    genre_fit_score: number;
    differentiation: string;
    comparable_tracks: string[];
  };
  commercial_viability: {
    score: number;
    reasoning: string;
    strengths: string[];
    weaknesses: string[];
  };
  recommendations?: Array<{
    priority: 'critical' | 'high' | 'optimization';
    category: string;
    finding: string;
    action: string;
  }>;
  target_alignment?: {
    alignment_score: number;
    notes: string;
  };
}

const TRACK_ANALYSIS_SYSTEM_PROMPT = `You are IMC's track analysis engine. You combine audio analysis data with market intelligence to assess a track's commercial potential and provide actionable feedback.

Given the audio features, artist concept, and market context, produce a detailed analysis as JSON:

{
  "audio_quality": {
    "loudness_lufs": <from features>,
    "dynamic_range": <from features>,
    "frequency_balance": "assessment string",
    "mix_notes": "specific notes on the mix quality"
  },
  "hook_effectiveness": {
    "repetition_score": 0-100,
    "melodic_contour": "assessment",
    "hook_timestamps": [],
    "overall_score": 0-100
  },
  "structure": {
    "sections": [{"name": "...", "start": "...", "end": "..."}],
    "pacing_assessment": "...",
    "transitions_quality": "..."
  },
  "competitive_position": {
    "genre_fit_score": 0-100,
    "differentiation": "...",
    "comparable_tracks": ["..."]
  },
  "commercial_viability": {
    "score": 0-100,
    "reasoning": "...",
    "strengths": ["..."],
    "weaknesses": ["..."]
  }
}

Also provide recommendations:
[
  {"priority": "critical|high|optimization", "category": "...", "finding": "...", "action": "..."}
]

And if market data is available, provide target_alignment:
{"alignment_score": 0-100, "notes": "how well the track aligns with the original market positioning"}

Be direct and specific. No filler. Every recommendation should be actionable. Be honest about weaknesses — sugarcoating doesn't help artists improve.`;

function buildAnalysisPrompt(
  features: AudioFeatures,
  concept: ProjectConcept,
  i1Report: I1Report | null
): string {
  const featureSummary = `
Audio Features Extracted:
- BPM: ${features.bpm}
- Key: ${features.key}
- Energy: ${features.energy.toFixed(4)}
- Danceability: ${features.danceability.toFixed(4)}
- Loudness (LUFS): ${features.loudness_lufs}
- Dynamic Range: ${features.dynamic_range}
- Spectral Centroid: ${features.spectral_centroid.toFixed(2)}
- Onset Rate: ${features.onset_rate.toFixed(2)}
`;

  const conceptSummary = `
Artist Concept:
- Primary Genre: ${concept.genre_primary}
- Secondary Genres: ${concept.genre_secondary.join(', ')}
- Reference Artists: ${concept.reference_artists.join(', ')}
- Creative Direction: ${concept.creative_direction}
- Target Audience: ${concept.target_audience}
- Mood Keywords: ${concept.mood_keywords.join(', ')}
`;

  let marketContext = '';
  if (i1Report) {
    marketContext = `
Market Context (from Instrument 1):
- Playlist Landscape: ${i1Report.playlist_landscape.target_playlists.slice(0, 5).map((p) => p.name).join(', ')}
- Sonic Blueprint BPM Range: ${i1Report.sonic_blueprint.bpm_range}
- Energy Profile Expected: ${i1Report.sonic_blueprint.energy_profile}
- Comparable Artists: ${i1Report.comparable_artists.slice(0, 3).map((a) => a.name).join(', ')}
`;
  }

  return `
${featureSummary}
${conceptSummary}
${marketContext}

Analyze this track based on the audio features, concept, and market context. Provide the analysis and recommendations as JSON. Be specific and actionable.
`;
}

export async function analyzeTrack(
  audioFeatures: AudioFeatures,
  concept: ProjectConcept,
  report: I1Report | null
): Promise<{
  analysis: I3Analysis;
  success_score: I3SuccessScore;
  recommendations: I3Recommendation[];
  target_alignment: Record<string, unknown> | null;
}> {
  // Calculate heuristic success score
  const successScore = calculateSuccessScore(audioFeatures, concept);

  // Build prompt for AI synthesis
  const prompt = buildAnalysisPrompt(audioFeatures, concept, report);

  // Initialize default analysis
  let analysis: I3Analysis = {
    audio_quality: {
      loudness_lufs: audioFeatures.loudness_lufs,
      dynamic_range: audioFeatures.dynamic_range,
      frequency_balance: 'Awaiting AI analysis',
      mix_notes: 'Awaiting AI analysis',
    },
    hook_effectiveness: {
      repetition_score: 50,
      melodic_contour: 'Awaiting AI analysis',
      hook_timestamps: [],
      overall_score: 50,
    },
    structure: {
      sections: [],
      pacing_assessment: 'Awaiting AI analysis',
      transitions_quality: 'Awaiting AI analysis',
    },
    competitive_position: {
      genre_fit_score: successScore.breakdown.genre_fit,
      differentiation: 'Awaiting AI analysis',
      comparable_tracks: [],
    },
    commercial_viability: {
      score: successScore.breakdown.commercial_viability,
      reasoning: 'Awaiting AI analysis',
      strengths: [],
      weaknesses: [],
    },
  };

  let recommendations: I3Recommendation[] = [];
  let targetAlignment: Record<string, unknown> | null = null;

  try {
    const aiResponse = await analyze(TRACK_ANALYSIS_SYSTEM_PROMPT, prompt);

    // Parse AI response
    let aiData: Partial<AIAnalysisResponse> = {};

    // Try to extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        aiData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse AI analysis JSON:', e);
      }
    }

    // Merge AI analysis with defaults
    if (aiData.audio_quality) {
      analysis.audio_quality = {
        loudness_lufs: audioFeatures.loudness_lufs,
        dynamic_range: audioFeatures.dynamic_range,
        frequency_balance: aiData.audio_quality.frequency_balance || 'Good',
        mix_notes: aiData.audio_quality.mix_notes || '',
      };
    }

    if (aiData.hook_effectiveness) {
      analysis.hook_effectiveness = {
        repetition_score: aiData.hook_effectiveness.repetition_score || 50,
        melodic_contour: aiData.hook_effectiveness.melodic_contour || '',
        hook_timestamps: aiData.hook_effectiveness.hook_timestamps || [],
        overall_score: aiData.hook_effectiveness.overall_score || 50,
      };
    }

    if (aiData.structure) {
      analysis.structure = {
        sections: aiData.structure.sections || [],
        pacing_assessment: aiData.structure.pacing_assessment || '',
        transitions_quality: aiData.structure.transitions_quality || '',
      };
    }

    if (aiData.competitive_position) {
      analysis.competitive_position = {
        genre_fit_score: aiData.competitive_position.genre_fit_score || successScore.breakdown.genre_fit,
        differentiation: aiData.competitive_position.differentiation || '',
        comparable_tracks: aiData.competitive_position.comparable_tracks || [],
      };
    }

    if (aiData.commercial_viability) {
      analysis.commercial_viability = {
        score: aiData.commercial_viability.score || successScore.breakdown.commercial_viability,
        reasoning: aiData.commercial_viability.reasoning || '',
        strengths: aiData.commercial_viability.strengths || [],
        weaknesses: aiData.commercial_viability.weaknesses || [],
      };
    }

    // Extract recommendations from AI response if present
    if (aiData.recommendations) {
      recommendations = aiData.recommendations.map((rec) => ({
        priority: rec.priority || 'optimization',
        category: rec.category || '',
        finding: rec.finding || '',
        action: rec.action || '',
      }));
    }

    // Extract target alignment if present
    if (aiData.target_alignment) {
      targetAlignment = {
        alignment_score: aiData.target_alignment.alignment_score,
        notes: aiData.target_alignment.notes,
      };
    }
  } catch (e) {
    console.error('Failed to generate AI track analysis:', e);
    // Continue with heuristic analysis only
  }

  // If no recommendations were extracted, generate minimal defaults based on heuristics
  if (recommendations.length === 0) {
    if (successScore.breakdown.audio_quality < 60) {
      recommendations.push({
        priority: 'high',
        category: 'Audio Quality',
        finding: 'Loudness levels are outside ideal range',
        action: `Remaster track to target -14 LUFS. Current: ${audioFeatures.loudness_lufs} LUFS`,
      });
    }

    if (successScore.breakdown.genre_fit < 60) {
      const [minBpm, maxBpm] = getGenreBpmRange(concept.genre_primary);
      recommendations.push({
        priority: 'high',
        category: 'Genre Alignment',
        finding: `Track BPM is outside expected range for ${concept.genre_primary}`,
        action: `Consider tempo adjustment. Current: ${audioFeatures.bpm} BPM, Expected: ${minBpm}-${maxBpm} BPM`,
      });
    }

    if (successScore.breakdown.commercial_viability < 60) {
      recommendations.push({
        priority: 'optimization',
        category: 'Commercial Appeal',
        finding: 'Danceability metrics suggest limited radio/playlist appeal',
        action: `Enhance rhythmic elements and groove. Current danceability: ${audioFeatures.danceability.toFixed(2)}`,
      });
    }
  }

  return {
    analysis,
    success_score: successScore,
    recommendations,
    target_alignment: targetAlignment,
  };
}
