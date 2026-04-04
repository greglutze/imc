import { analyze } from './ai';
import {
  ProjectConcept,
  I1Report,
  I2StyleProfile,
  I2VocalistPersona,
  I2Track,
  MoodboardBrief,
} from '../types';

function truncateToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

const PROMPT_ENGINEERING_SYSTEM_PROMPT = `You are IMC's prompt engineering system. You translate artist concepts and market intelligence into precision-engineered prompts for AI music generation platforms (Suno and Udio).

Given the artist concept and market data, generate:

1. A style_profile capturing the overall sonic identity
2. A vocalist_persona defining the vocal character
3. Individual track prompts optimized for both Suno and Udio

CRITICAL RULES:
- NEVER include real person names, band names, or artist names in ANY Suno prompt or Udio prompt. Describe the sound, style, and aesthetic using descriptive language only. For example, instead of "vocals like Sam Carter" write "soaring clean vocals with aggressive screamed passages". This applies to suno_prompt fields, udio_prompt fields, and the vocalist_persona vocal_character/delivery_style fields. The reference_vocalists and reference_artists fields in the data model are for internal context only and must NEVER appear in any prompt text.
- Suno prompts use bracketed category tags. Max 1000 characters. Format each prompt as a continuous string of bracketed sections:
  [Genres: ...] [Moods: ...] [Instrumentation: ... — include exclusions like "no guitar, no 808"] [Tempo: BPM range, feel description — "played not programmed"] [Vocal Style: specific character — include what NOT to do] [Production: aesthetic description — reference textures, recording approach, analog vs digital] [Structure: section-by-section flow in plain language, not bracket notation] [Sound Design: evocative scene-setting — describe the physical space and emotional landscape the listener inhabits]
  Be poetic and specific in each category. Use em dashes for contrast and exclusions. Each section should read like a creative brief, not a tag list.
- Udio prompts are more narrative. Describe the sound in natural language. Include production style, era references, sonic textures. Max ~500 chars. Do NOT reference any real artists or bands by name.
- Maintain 80%+ genre consistency across tracks while allowing creative variation
- Each track should have a distinct identity within the project's sonic universe
- Structure notation uses: [Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro] [Drop] [Break]
- If market data is available, use the sonic blueprint to inform production choices
- If a visual moodboard brief is provided, treat it as the atmospheric north star for the project. Let it shape the texture, mood, and production character of every prompt. The moodboard brief represents the artist's visual world translated into sonic language — it should infuse every aspect of the output without overriding the artist's explicit concept direction.

Return JSON:
{
  "style_profile": {
    "production_aesthetic": "A rich, evocative 2-4 sentence description of the overall sonic identity. This is the project's sound in words — think how a producer would pitch the vibe to an engineer. Be specific about textures, space, weight, warmth/coolness, and era. This is displayed as a hero quote so make it count.",
    "sonic_signatures": ["At least 5-8 specific sonic characteristics. Each should be a short vivid phrase like 'Tape-saturated drum machines with swing quantization' or 'Cathedral reverb on layered vocal harmonics'. Be concrete — not 'good bass' but 'Sub-bass that blooms rather than hits, tuned to root notes with gentle overdrive'"],
    "tempo_range": "Specific BPM range with feel descriptor, e.g. '88-96 BPM — leans into the pocket, human-played feel'",
    "key_preferences": ["2-4 specific keys with reasoning, e.g. 'D minor — classic melancholy without being obvious', 'F major — warm and open'"]
  },
  "vocalist_persona": {
    "vocal_character": "2-3 sentences describing the vocal identity. Timbre, range, texture, breath. Be cinematic — 'A midnight voice — smoky lower register that opens into clear falsetto on emotional peaks. Intimate like a late-night voicemail.'",
    "delivery_style": "2-3 sentences on phrasing, rhythm, attitude. 'Conversational verses that tighten into rhythmic precision on hooks. Words land slightly behind the beat, creating a pulling sensation. Never shouts — intensity comes from restraint.'",
    "reference_vocalists": ["2-4 vocalist names for internal reference only — NEVER used in prompts"],
    "tone_keywords": ["6-10 evocative keywords: 'velvet', 'midnight', 'vulnerable', 'controlled fire', 'whispered intensity'"]
  },
  "tracks": [
    {
      "track_number": 1,
      "title": "Evocative working title that captures the track's identity",
      "suno_prompt": "[Genres: ...] [Moods: ...] [Instrumentation: ... — be exhaustive, include exclusions like 'no acoustic guitar, no 808'] [Tempo: specific BPM with feel] [Vocal Style: specific character — what to do AND what to avoid] [Production: detailed aesthetic — reference textures, recording approach, analog vs digital, spatial qualities] [Structure: section-by-section flow in plain language] [Sound Design: evocative scene-setting — describe the physical space the listener inhabits] — MINIMUM 400 characters, aim for 600-800. Fill the 1000 char limit with rich detail.",
      "udio_prompt": "Detailed narrative description of the track. 300-500 chars. Describe how it SOUNDS and FEELS — the opening moment, how the beat enters, how the chorus lifts, what textures dominate. Written like a producer describing the finished track to someone who hasn't heard it yet.",
      "structure": "[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]",
      "notes": "2-3 sentences of generation guidance: what makes this track unique in the project, what to watch for, what would make it great vs generic."
    }
  ]
}

Generate EXACTLY the number of tracks specified in track_count. Each track must have a distinct identity within the project's sonic universe — different enough to be interesting, cohesive enough to belong. Every prompt should be RICH and DETAILED — sparse prompts produce generic music. Fill the suno_prompt character limit. Be creative but commercially aware.`;

interface PromptContext {
  concept: ProjectConcept;
  report: I1Report | null;
  moodboardBrief: MoodboardBrief | null;
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

  // Append moodboard brief if available
  const moodboardSection = context.moodboardBrief ? `

Visual Moodboard — Sonic Brief:
${context.moodboardBrief.prose}

Moodboard Atmospheric Details:
- Tempo Feel: ${context.moodboardBrief.tempo_feel}
- Texture: ${context.moodboardBrief.texture}
- Atmosphere: ${context.moodboardBrief.atmosphere}
- Emotional Register: ${context.moodboardBrief.emotional_register}
- Arrangement Density: ${context.moodboardBrief.arrangement_density}
- Dynamic Range: ${context.moodboardBrief.dynamic_range}${context.moodboardBrief.production_era ? `\n- Production Era: ${context.moodboardBrief.production_era}` : ''}${context.moodboardBrief.sonic_references.length > 0 ? `\n- Sonic References: ${context.moodboardBrief.sonic_references.join(', ')}` : ''}

This moodboard brief represents the visual world of the project translated into sonic language. Let it shape the texture, production character, atmosphere, and [Sound Design] sections of every prompt.` : '';

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

Use this market intelligence to inform your prompt generation. The sonic blueprint and comparable artists data will help ensure the prompts produce commercially viable music aligned with market positioning.${moodboardSection}`;
  }

  return `${basePrompt}${moodboardSection}

No market research data available. Generate prompts based on the artist concept${context.moodboardBrief ? ' and visual moodboard brief' : ''} provided.`;
}

export async function generatePrompts(
  concept: ProjectConcept,
  report: I1Report | null,
  moodboardBrief?: MoodboardBrief | null
): Promise<{
  style_profile: I2StyleProfile;
  vocalist_persona: I2VocalistPersona;
  tracks: I2Track[];
}> {
  const context: PromptContext = { concept, report, moodboardBrief: moodboardBrief || null };
  const prompt = contextToPrompt(context);

  const defaultResponse = {
    style_profile: {
      production_aesthetic: `A ${concept.genre_primary}-rooted project with ${concept.mood_keywords.slice(0, 3).join(', ')} sensibilities. ${concept.creative_direction ? concept.creative_direction.slice(0, 200) : 'Modern production approach with attention to sonic detail.'}`,
      sonic_signatures: concept.mood_keywords.length > 0
        ? concept.mood_keywords.slice(0, 4).map(m => `${m} textures throughout`)
        : ['Modern production approach'],
      tempo_range: '100-130 BPM',
      key_preferences: ['To be determined during production'],
    },
    vocalist_persona: {
      vocal_character: 'Contemporary vocal approach suited to the genre',
      delivery_style: 'Natural and emotive delivery with genre-appropriate phrasing',
      reference_vocalists: concept.reference_artists.slice(0, 3),
      tone_keywords: concept.mood_keywords.slice(0, 5),
    },
    tracks: Array.from({ length: concept.track_count }, (_, i) => ({
      track_number: i + 1,
      title: `Track ${i + 1}`,
      suno_prompt: `[Genres: ${concept.genre_primary}${concept.genre_secondary.length ? ', ' + concept.genre_secondary.join(', ') : ''}] [Moods: ${concept.mood_keywords.join(', ')}]`,
      udio_prompt: `A ${concept.genre_primary} track with ${concept.mood_keywords.join(', ')} mood.`,
      structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
      notes: 'Auto-generated from concept — regenerate for full prompt',
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
            suno_prompt: truncateToChars(t.suno_prompt || '', 1000),
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
  currentPrompts: { style_profile: I2StyleProfile; vocalist_persona: I2VocalistPersona; tracks: I2Track[] },
  moodboardBrief?: MoodboardBrief | null
): Promise<I2Track> {
  const context: PromptContext = { concept, report, moodboardBrief: moodboardBrief || null };
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
          suno_prompt: truncateToChars(parsed.suno_prompt || '', 1000),
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
