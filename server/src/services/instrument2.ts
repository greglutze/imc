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

/**
 * Repair JSON that contains raw newlines inside string values.
 * Claude often writes lyrics with actual line breaks in JSON strings,
 * which makes JSON.parse fail. This finds string values and escapes
 * any raw newlines/tabs inside them.
 */
function repairJsonNewlines(raw: string): string {
  // Strategy: walk through the string character by character,
  // tracking whether we're inside a JSON string value.
  // If we encounter a raw newline inside a string, replace with \n.
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch === '\n') {
      result += '\\n';
      continue;
    }

    if (inString && ch === '\r') {
      continue; // skip carriage returns
    }

    if (inString && ch === '\t') {
      result += '\\t';
      continue;
    }

    result += ch;
  }

  return result;
}

const PROMPT_ENGINEERING_SYSTEM_PROMPT = `You are IMC's prompt engineering and songwriting system. You translate artist concepts and market intelligence into precision-engineered prompts for AI music generation AND original lyrics for each track.

Given the artist concept and market data, generate:

1. A style_profile capturing the overall sonic identity
2. A vocalist_persona defining the vocal character
3. Individual track prompts optimized for Suno, PLUS full lyrics for each track

CRITICAL RULES:
- NEVER include real person names, band names, or artist names in ANY Suno prompt. Describe the sound, style, and aesthetic using descriptive language only. For example, instead of "vocals like Sam Carter" write "soaring clean vocals with aggressive screamed passages". This applies to suno_prompt fields and the vocalist_persona vocal_character/delivery_style fields. The reference_vocalists and reference_artists fields in the data model are for internal context only and must NEVER appear in any prompt text.
- Suno prompts use bracketed category tags. Max 1000 characters. Format each prompt as a continuous string of bracketed sections:
  [Genres: ...] [Moods: ...] [Instrumentation: ... — include exclusions like "no guitar, no 808"] [Tempo: BPM range, feel description — "played not programmed"] [Vocal Style: specific character — include what NOT to do] [Production: aesthetic description — reference textures, recording approach, analog vs digital] [Structure: section-by-section flow in plain language, not bracket notation] [Sound Design: evocative scene-setting — describe the physical space and emotional landscape the listener inhabits]
  Be poetic and specific in each category. Use em dashes for contrast and exclusions. Each section should read like a creative brief, not a tag list.
- LYRICS: This is CRITICAL. Write COMPLETE, FULL-LENGTH, ORIGINAL song lyrics for EVERY track.
  THE LYRICS FIELD MUST CONTAIN THE ACTUAL WORDS A SINGER WOULD SING. NOT a description of the song's sound. NOT a production brief. NOT "Cinematic intro with rain sounds..." — that belongs in suno_prompt. The lyrics field is ONLY for singable words with song structure tags.

  WRONG (this is a production description, NOT lyrics):
  "Cinematic experimental hip-hop intro. Opens with synthetic rain layered under a slowly evolving C minor analog pad..."

  RIGHT (these are actual song lyrics):
  "[Verse 1]\\nNeon bleeding through the rain on glass\\nEvery streetlight holds a ghost I know by name\\nMidnight traffic like a pulse beneath my skin\\nI keep walking but the city pulls me in"

  Rules:
  * Every section in the structure field MUST have corresponding lyrics. No skipping sections.
  * Include song structure tags as brackets on their own lines: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro], etc.
  * Each [Verse] must have 4-8 lines of lyrics. Each [Chorus] must have 4-6 lines. [Bridge] must have 2-4 lines. [Pre-Chorus] must have 2-4 lines.
  * [Intro] can have 1-4 atmospheric or spoken-word lines, or simply the tag alone if instrumental
  * [Outro] can repeat a chorus line, fade with a final image, or be tagged as instrumental
  * When a [Chorus] repeats, write "(repeat)" or write slight variations — but the first appearance MUST be full lyrics
  * Lyrics must match the mood, theme, creative direction, and vocalist persona
  * Each track tells a distinct story or explores a unique emotional theme within the project's world
  * Write with rhythm, cadence, and syllable count in mind — SINGABLE at the track's tempo, not poetry
  * Use \\n for line breaks in JSON. Separate sections with \\n\\n
  * Be evocative and specific — avoid generic filler
  * Choruses must be HOOKY — designed to stick in the listener's head
  * Total lyrics per track: 25-50 lines minimum. This is a FULL SONG.
- Maintain 80%+ genre consistency across tracks while allowing creative variation
- Each track should have a distinct identity within the project's sonic universe
- Structure notation uses: [Intro] [Verse 1] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Outro] [Drop] [Break]
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
      "lyrics": "[Verse 1]\\nWoke up to the sound of sirens fading out\\nSunlight cutting through the blinds like something sharp\\nYour jacket on the chair, your coffee getting cold\\nI trace the ring you left around the dark\\n\\n[Pre-Chorus]\\nAnd I know you said don't wait up\\nBut the silence sounds like giving up\\n\\n[Chorus]\\nSo I'll leave the light on\\nEven if you don't come home tonight\\nI'll leave the light on\\nCause the dark don't know us like I do\\n\\n[Verse 2]\\nThirty-seven missed calls from a version of myself\\nWho believed in permanence and parking spots for two\\nNow I'm talking to your voicemail like a prayer\\nHoping something in my voice still gets to you\\n\\n[Pre-Chorus]\\nAnd I know the door is open\\nBut it feels like something broken\\n\\n[Chorus]\\n(repeat)\\n\\n[Bridge]\\nMaybe love is just the courage\\nTo stand still when everything is moving\\nMaybe I've been running from the quiet\\nThat was always trying to prove it\\n\\n[Chorus]\\nSo I'll leave the light on\\nEven when the morning takes your place\\nI'll leave the light on\\nCause the dark don't know us like I do\\n\\n[Outro]\\nLeave the light on\\nLeave the light on",
      "structure": "[Intro] [Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Chorus] [Outro]",
      "notes": "2-3 sentences of generation guidance: what makes this track unique in the project, what to watch for, what would make it great vs generic."
    }
  ]
}

Generate EXACTLY the number of tracks specified in track_count. Each track must have a distinct identity within the project's sonic universe — different enough to be interesting, cohesive enough to belong. Every prompt should be RICH and DETAILED — sparse prompts produce generic music. Fill the suno_prompt character limit.

LYRICS ARE NON-NEGOTIABLE: Every track MUST have COMPLETE, FULL-LENGTH lyrics with real words a singer would sing. The lyrics field is NOT for production descriptions or sonic briefs — those go in suno_prompt. The lyrics field contains ONLY song lyrics with [Section] tags and singable lines. If you put a production description in the lyrics field, you have failed. Every section in the structure must have corresponding lyrics. 25-50 lines per track minimum. This is the most important part of the output.

Be creative but commercially aware.`;

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
      lyrics: `[Verse 1]\nLyrics will be generated here\n\n[Chorus]\nAwaiting generation...\n\n[Verse 2]\nRegenerate this track for full lyrics`,
      structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
      notes: 'Auto-generated from concept — regenerate for full prompt',
    })),
  };

  try {
    // Full lyrics for multiple tracks requires significant output — scale with track count
    const tokenBudget = Math.min(32000, 8192 + concept.track_count * 2500);
    const response = await analyze(PROMPT_ENGINEERING_SYSTEM_PROMPT, prompt, { maxTokens: tokenBudget });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      let parsed: any;

      // First attempt: parse raw JSON
      try {
        parsed = JSON.parse(jsonStr);
      } catch (_e) {
        // Second attempt: repair newlines inside string values (common with lyrics)
        console.log('[instrument2] JSON parse failed, attempting repair...');
        try {
          jsonStr = repairJsonNewlines(jsonStr);
          parsed = JSON.parse(jsonStr);
          console.log('[instrument2] JSON repair succeeded');
        } catch (e2) {
          console.error('[instrument2] JSON repair also failed:', e2);
          console.error('[instrument2] First 500 chars of response:', response.slice(0, 500));
        }
      }

      if (parsed) {
        return {
          style_profile: parsed.style_profile || defaultResponse.style_profile,
          vocalist_persona:
            parsed.vocalist_persona || defaultResponse.vocalist_persona,
          tracks: (parsed.tracks || []).map((t: any, idx: number) => ({
            track_number: idx + 1,
            title: t.title || `Track ${idx + 1}`,
            suno_prompt: truncateToChars(t.suno_prompt || '', 1000),
            lyrics: t.lyrics || '',
            structure:
              t.structure ||
              '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
            notes: t.notes || '',
          })),
        };
      }
    } else {
      console.error('[instrument2] No JSON found in response. First 500 chars:', response.slice(0, 500));
    }
  } catch (e) {
    console.error('[instrument2] Failed to generate prompts:', e);
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
      `Track ${t.track_number}: ${t.title}\nSuno: ${t.suno_prompt}\nLyrics: ${t.lyrics}`
  )
  .join('\n\n')}

Now regenerate Track ${trackNumber} keeping the style consistent with the rest of the project. CRITICAL: Do NOT include any real person, band, or artist names in the suno_prompt. Use descriptive language only.

You MUST write COMPLETE, FULL-LENGTH lyrics for this track — every section in the structure must have real, singable words. Verses need 4-8 lines each. Choruses need 4-6 lines. This is a full song, not a sketch.

Return a JSON object with these exact fields:
{
  "track_number": ${trackNumber},
  "title": "Track title",
  "suno_prompt": "[Genres: ...] [Moods: ...] [Instrumentation: ...] [Tempo: ...] [Vocal Style: ...] [Production: ...] [Structure: ...] [Sound Design: ...]",
  "lyrics": "[Verse 1]\\nFull lyrics line 1\\nLine 2\\nLine 3\\nLine 4\\n\\n[Pre-Chorus]\\nBuilding line 1\\nBuilding line 2\\n\\n[Chorus]\\nHook line 1\\nHook line 2\\nHook line 3\\nHook line 4\\n\\n[Verse 2]\\n...continue with ALL sections from the structure field",
  "structure": "[Section] [Section] ...",
  "notes": "Generation guidance"
}`;

  const defaultTrack: I2Track = {
    track_number: trackNumber,
    title: `Track ${trackNumber}`,
    suno_prompt: '',
    lyrics: '',
    structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
    notes: '',
  };

  try {
    const response = await analyze(
      PROMPT_ENGINEERING_SYSTEM_PROMPT,
      `${basePrompt}\n\n${styleContext}`,
      { maxTokens: 4096 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      let parsed: any;

      try {
        parsed = JSON.parse(jsonStr);
      } catch (_e) {
        console.log('[instrument2] Track JSON parse failed, attempting repair...');
        try {
          jsonStr = repairJsonNewlines(jsonStr);
          parsed = JSON.parse(jsonStr);
          console.log('[instrument2] Track JSON repair succeeded');
        } catch (e2) {
          console.error('[instrument2] Track JSON repair also failed:', e2);
        }
      }

      if (parsed) {
        return {
          track_number: trackNumber,
          title: parsed.title || `Track ${trackNumber}`,
          suno_prompt: truncateToChars(parsed.suno_prompt || '', 1000),
          lyrics: parsed.lyrics || '',
          structure:
            parsed.structure ||
            '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
          notes: parsed.notes || '',
        };
      }
    } else {
      console.error('[instrument2] No JSON found in track response');
    }
  } catch (e) {
    console.error('[instrument2] Failed to regenerate track:', e);
  }

  return defaultTrack;
}
