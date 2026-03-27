import { analyze } from './ai';
import {
  ProjectConcept,
  I1Report,
  I2StyleProfile,
  I2VocalistPersona,
  I2Track,
} from '../types';

const PROMPT_ENGINEERING_SYSTEM_PROMPT = `You are IMC's prompt engineering system. You translate artist concepts and market intelligence into precision-engineered prompts for AI music generation platforms (Suno and Udio).

Given the artist concept and market data, generate:

1. A style_profile capturing the overall sonic identity
2. A vocalist_persona defining the vocal character
3. Individual track prompts optimized for both Suno and Udio

CRITICAL RULES:
- NEVER include real person names, band names, or artist names in ANY Suno prompt or Udio prompt. Describe the sound, style, and aesthetic using descriptive language only. For example, instead of "vocals like Sam Carter" write "soaring clean vocals with aggressive screamed passages". This applies to suno_prompt fields, udio_prompt fields, and the vocalist_persona vocal_character/delivery_style fields. The reference_vocalists and reference_artists fields in the data model are for internal context only and must NEVER appear in any prompt text.
- Suno prompts use bracketed category tags. Max 1000 words. Format each prompt as a continuous string of bracketed sections:
  [Genres: ...] [Moods: ...] [Instrumentation: ... — include exclusions like "no guitar, no 808"] [Tempo: BPM range, feel description — "played not programmed"] [Vocal Style: specific character — include what NOT to do] [Production: aesthetic description — reference textures, recording approach, analog vs digital] [Structure: section-by-section flow in plain language, not bracket notation] [Sound Design: evocative scene-setting — describe the physical space and emotional landscape the listener inhabits]
  Be poetic and specific in each category. Use em dashes for contrast and exclusions. Each section should read like a creative brief, not a tag list.
- Udio prompts are more narrative. Describe the sound in natural language. Include production style, era references, sonic textures. Max ~500 chars. Do NOT reference any real artists or bands by name.
- Maintain 80%+ genre consistency across tracks while allowing creative variation
- Each track should have a distinct identity within the project's sonic universe
- Structure notation uses: [Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro] [Drop] [Break]
- If market data is available, use the sonic blueprint to inform production choices

Return JSON:
{
  "style_profile": {
    "production_aesthetic": "description of overall sound",
    "sonic_signatures": ["signature1", "signature2"],
    "tempo_range": "BPM range",
    "key_preferences": ["key1", "key2"]
  },
  "vocalist_persona": {
    "vocal_character": "description",
    "delivery_style": "description",
    "reference_vocalists": ["name1", "name2"],
    "tone_keywords": ["keyword1", "keyword2"]
  },
  "tracks": [
    {
      "track_number": 1,
      "title": "Working Title",
      "suno_prompt": "[Genres: ...] [Moods: ...] [Instrumentation: ...] [Tempo: ...] [Vocal Style: ...] [Production: ...] [Structure: ...] [Sound Design: ...]",
      "udio_prompt": "Narrative description of the track's sound, production approach, and aesthetic...",
      "structure": "[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]",
      "notes": "Generation guidance and intent"
    }
  ]
}

Generate exactly the number of tracks specified in track_count. Be creative but commercially aware. Every prompt should produce something that could realistically compete in its genre.`;

interface PromptContext {
  concept: ProjectConcept;
  report: I1Report | null;
}

function contextToPrompt(context: PromptContext): string {
  const basePrompt = `
Artist Concept:
- Primary Genre: ${context.concept.genre_primary}
- Secondary Genres: ${context.concept.genre_secondary.join(', ')}
- Reference Artists: ${context.concept.reference_artists.join(', ')}
- Creative Direction: ${context.concept.creative_direction}
- Target Audience: ${context.concept.target_audience}
- Mood Keywords: ${context.concept.mood_keywords.join(', ')}
- Track Count: ${context.concept.track_count}`;

  if (context.report) {
    const sonicBlueprint = context.report.sonic_blueprint;
    const comparableArtists = context.report.comparable_artists
      .slice(0, 5)
      .map((a) => `${a.name} (relevance: ${a.relevance_score})`)
      .join(', ');

    const audienceProfile = context.report.audience_profile;

    return `${basePrompt}

Market Intelligence:

Sonic Blueprint (from Instrument 1 research):
- BPM Range: ${sonicBlueprint.bpm_range}
- Key Signatures: ${sonicBlueprint.key_signatures.join(', ')}
- Energy Profile: ${sonicBlueprint.energy_profile}
- Production Style: ${sonicBlueprint.production_style}
- Sonic Signatures: ${sonicBlueprint.sonic_signatures.join(', ')}

Comparable Artists: ${comparableArtists}

Audience Profile:
- Age Range: ${audienceProfile.primary_age_range}
- Gender Split: ${audienceProfile.gender_split}
- Top Markets: ${audienceProfile.top_markets.join(', ')}
- Platforms: ${audienceProfile.platforms.join(', ')}
- Psychographics: ${audienceProfile.psychographics}

Genre Landscape: ${context.report.market_overview.genre_landscape}
Growth Trend: ${context.report.market_overview.growth_trend}

Use this market intelligence to inform your prompt generation. The sonic blueprint and comparable artists data will help ensure the prompts produce commercially viable music aligned with market positioning.`;
  }

  return `${basePrompt}

No market research data available. Generate prompts based solely on the artist concept provided.`;
}

export async function generatePrompts(
  concept: ProjectConcept,
  report: I1Report | null
): Promise<{
  style_profile: I2StyleProfile;
  vocalist_persona: I2VocalistPersona;
  tracks: I2Track[];
}> {
  const context: PromptContext = { concept, report };
  const prompt = contextToPrompt(context);

  const defaultResponse = {
    style_profile: {
      production_aesthetic: 'Modern and polished',
      sonic_signatures: [],
      tempo_range: '100-130 BPM',
      key_preferences: [],
    },
    vocalist_persona: {
      vocal_character: 'Contemporary',
      delivery_style: 'Natural and emotive',
      reference_vocalists: [],
      tone_keywords: [],
    },
    tracks: Array.from({ length: concept.track_count }, (_, i) => ({
      track_number: i + 1,
      title: `Track ${i + 1}`,
      suno_prompt: '',
      udio_prompt: '',
      structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
      notes: '',
    })),
  };

  try {
    const response = await analyze(PROMPT_ENGINEERING_SYSTEM_PROMPT, prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          style_profile: parsed.style_profile || defaultResponse.style_profile,
          vocalist_persona:
            parsed.vocalist_persona || defaultResponse.vocalist_persona,
          tracks: (parsed.tracks || []).map((t: any, idx: number) => ({
            track_number: idx + 1,
            title: t.title || `Track ${idx + 1}`,
            suno_prompt: t.suno_prompt || '',
            udio_prompt: t.udio_prompt || '',
            structure:
              t.structure ||
              '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
            notes: t.notes || '',
          })),
        };
      } catch (e) {
        console.error('Failed to parse prompts JSON:', e);
      }
    }
  } catch (e) {
    console.error('Failed to generate prompts:', e);
  }

  return defaultResponse;
}

export async function regenerateTrack(
  concept: ProjectConcept,
  report: I1Report | null,
  trackNumber: number,
  currentPrompts: { style_profile: I2StyleProfile; vocalist_persona: I2VocalistPersona; tracks: I2Track[] }
): Promise<I2Track> {
  const context: PromptContext = { concept, report };
  const basePrompt = contextToPrompt(context);

  const styleContext = `
Current Style Profile:
- Production Aesthetic: ${currentPrompts.style_profile.production_aesthetic}
- Sonic Signatures: ${currentPrompts.style_profile.sonic_signatures.join(', ')}
- Tempo Range: ${currentPrompts.style_profile.tempo_range}
- Key Preferences: ${currentPrompts.style_profile.key_preferences.join(', ')}

Current Vocalist Persona:
- Vocal Character: ${currentPrompts.vocalist_persona.vocal_character}
- Delivery Style: ${currentPrompts.vocalist_persona.delivery_style}
- Reference Vocalists: ${currentPrompts.vocalist_persona.reference_vocalists.join(', ')}
- Tone Keywords: ${currentPrompts.vocalist_persona.tone_keywords.join(', ')}

Other Tracks:
${currentPrompts.tracks
  .filter((t) => t.track_number !== trackNumber)
  .map(
    (t) =>
      `Track ${t.track_number}: ${t.title}\nSuno: ${t.suno_prompt}\nUdio: ${t.udio_prompt}`
  )
  .join('\n\n')}

Now regenerate Track ${trackNumber} keeping the style consistent with the rest of the project. CRITICAL: Do NOT include any real person, band, or artist names in the suno_prompt or udio_prompt. Use descriptive language only. Return a JSON object with these exact fields:
{
  "track_number": ${trackNumber},
  "title": "Track title",
  "suno_prompt": "[Genres: ...] [Moods: ...] [Instrumentation: ...] [Tempo: ...] [Vocal Style: ...] [Production: ...] [Structure: ...] [Sound Design: ...]",
  "udio_prompt": "narrative prompt for Udio",
  "structure": "[Section] [Section] ...",
  "notes": "Generation guidance"
}`;

  const defaultTrack: I2Track = {
    track_number: trackNumber,
    title: `Track ${trackNumber}`,
    suno_prompt: '',
    udio_prompt: '',
    structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
    notes: '',
  };

  try {
    const response = await analyze(
      PROMPT_ENGINEERING_SYSTEM_PROMPT,
      `${basePrompt}\n\n${styleContext}`
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          track_number: trackNumber,
          title: parsed.title || `Track ${trackNumber}`,
          suno_prompt: parsed.suno_prompt || '',
          udio_prompt: parsed.udio_prompt || '',
          structure:
            parsed.structure ||
            '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
          notes: parsed.notes || '',
        };
      } catch (e) {
        console.error('Failed to parse track JSON:', e);
      }
    }
  } catch (e) {
    console.error('Failed to regenerate track:', e);
  }

  return defaultTrack;
}
