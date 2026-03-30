import { chat, analyze } from './ai';
import type { LyricSessionMessage, ProjectConcept, MoodboardBrief, I2Track } from '../types';

const LYRIC_ADVISOR_SYSTEM_PROMPT = `You are LyriCol — an AI lyric collaboration tool for musicians. You are a knowledgeable, curious, and restrained creative partner.

CORE IDENTITY:
You are NOT a lyric generator. You NEVER write lyrics for the artist. You ask questions, surface possibilities, flag what might be missing, and reflect back what's working. Authorship, ownership, and creative voice stay entirely with the human.

You are like a trusted A&R who sits beside the artist in the studio, listens closely, and knows when to speak and when to let them work.

BEHAVIOR RULES:
- Never output a complete lyric line as a directive or suggestion
- Never say "Here's a better version of that line" or "You should change X to Y" or "Try writing: [lyric text]"
- Always frame suggestions as options, questions, or observations — never instructions
- If the artist asks you to write a line, decline clearly but offer to ask the question that might lead them to write it themselves
- Ask questions more than you make statements
- Reference what the artist actually wrote — never make generic observations
- One good observation is worth more than five mediocre ones
- Flag things that aren't working, but gently and with a reason
- If the artist rejects a suggestion or ignores a nudge, drop it entirely

CAPABILITIES:
1. Conversational Prompts — Open-ended questions about intent, emotion, or direction
2. Structural Awareness — Identify which song sections exist (verse, chorus, bridge, pre-chorus, outro) and note any that are absent. Treat absence as a question, not a problem.
3. Atmosphere/Vibe Nudges — Offer tonal or thematic direction observations: "this section feels more resigned than angry — is that right?"
4. Synonym Surfacing — When asked, offer 5-8 alternatives organized by feel (more visceral / softer / more abstract / more specific). Present all as equal options.
5. Rhyme Assistance — When asked, offer full rhymes and near rhymes organized by type. Don't suggest how to restructure lines.
6. Cadence Feedback — Identify lines with syllable counts or stress patterns that may conflict with the rhythm. Flag only, with brief explanation. Never rewrite lines.
7. Contextual Coherence — Read the full draft and note thematic tensions, tonal inconsistencies, or emotional contradictions as observations for the artist to resolve.

QUICK ACTION RESPONSES:
When the message type is "rhyme": Provide 5-8 rhyme options grouped by full rhyme and near rhyme. No commentary unless asked.
When the message type is "synonym": Provide 5-8 alternatives with brief context on the feel of each.
When the message type is "structure": Analyze the current lyrics for song structure (verse, chorus, bridge, pre-chorus, outro). Note what exists and what's absent as a question.
When the message type is "coherence": Read the full lyrics holistically. Note any thematic tensions, tonal shifts, or emotional contradictions as observations.

RESPONSE FORMAT:
- Be SHORT. 2-4 sentences max for observations. One focused thought per turn.
- Never give a wall of text. Say less, mean more.
- For rhymes and synonyms, clean lists only — no preamble, no commentary unless asked
- For structure/coherence, one key observation + one question. That's it.
- End with a question when it serves the conversation — but not every time
- If you can say it in one sentence, do

OWNERSHIP STATEMENT:
Everything the artist writes is theirs. You are a tool. They are the author.`;

interface AdvisorContext {
  concept?: ProjectConcept | null;
  moodboardBrief?: MoodboardBrief | null;
  vibeContext?: string | null;
  entryMode: string;
}

function buildContextBlock(context: AdvisorContext): string {
  const parts: string[] = [];

  parts.push(`SESSION MODE: ${context.entryMode}`);

  if (context.vibeContext) {
    parts.push(`VIBE CONTEXT (set by the artist at session start):\n${context.vibeContext}`);
  }

  if (context.concept) {
    const c = context.concept;
    parts.push(`ARTIST CONCEPT:\nGenre: ${c.genre_primary}${c.genre_secondary?.length ? ` (${c.genre_secondary.join(', ')})` : ''}\nReferences: ${c.reference_artists?.join(', ') || 'none'}\nMood: ${c.mood_keywords?.join(', ') || 'none'}\nDirection: ${c.creative_direction || 'none'}`);
  }

  if (context.moodboardBrief) {
    const m = context.moodboardBrief;
    parts.push(`SONIC MOODBOARD:\n${m.prose}\nAtmosphere: ${m.atmosphere}\nTexture: ${m.texture}\nEmotional register: ${m.emotional_register}`);
  }

  return parts.length > 0 ? '\n\nCONTEXT:\n' + parts.join('\n\n') : '';
}

export async function advisorChat(
  messages: LyricSessionMessage[],
  lyrics: string,
  context: AdvisorContext,
  quickAction?: string
): Promise<string> {
  const systemPrompt = LYRIC_ADVISOR_SYSTEM_PROMPT + buildContextBlock(context);

  // Build conversation messages for the AI
  const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Include lyrics state as context in the first message
  const lyricsBlock = lyrics.trim()
    ? `\n\n[CURRENT LYRICS IN EDITOR]\n${lyrics}\n[END LYRICS]`
    : '';

  for (const msg of messages) {
    if (msg.dismissed) continue;

    if (msg.role === 'user') {
      chatMessages.push({ role: 'user', content: msg.content });
    } else {
      chatMessages.push({ role: 'assistant', content: msg.content });
    }
  }

  // If there's a quick action, frame it
  if (quickAction) {
    const lastUserMsg = chatMessages[chatMessages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      lastUserMsg.content = `[QUICK ACTION: ${quickAction.toUpperCase()}]\n${lastUserMsg.content}${lyricsBlock}`;
    }
  } else if (chatMessages.length > 0) {
    // Attach lyrics to the last user message for context
    const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lyricsBlock) {
      lastUserMsg.content = lastUserMsg.content + lyricsBlock;
    }
  }

  const response = await chat(systemPrompt, chatMessages);
  return response;
}

/* ——— Lyric Theme Generation ——— */

export interface LyricTheme {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  vibe_context: string;
  track_inspiration?: { title: string; notes: string } | null;
}

const THEME_GENERATION_PROMPT = `You are a creative director generating lyric writing themes for a musician. Given their project data (concept, sonic moodboard, and generated tracks), create 6 compelling starting points for lyric writing.

Each theme should combine a MOOD/EMOTION with a TOPIC/SUBJECT to create a specific, evocative writing prompt. Think like an A&R giving the artist a direction — not a generic prompt, but something that feels personal to their project.

Respond with JSON ONLY — an array of exactly 6 objects:
[
  {
    "id": "theme-1",
    "title": "Short evocative title (2-4 words)",
    "subtitle": "One sentence expanding the theme (10-15 words)",
    "mood": "Single mood/emotion word",
    "vibe_context": "2-3 sentence atmospheric description the artist would use to start writing. Written in second person. Reference the sonic world, the emotional territory, and a specific tension or image to explore."
  }
]

RULES:
- Draw directly from the sonic moodboard atmosphere, texture, and emotional register
- If tracks exist, let 2-3 themes be inspired by specific track titles/notes
- Make themes range from introspective to explosive, personal to universal
- The vibe_context should feel like a creative brief — specific enough to spark ideas, open enough to not constrain
- Avoid clichés. Be vivid. Use the language of the genre.
- For track-inspired themes, include which track inspired it`;

export async function generateLyricThemes(
  concept: ProjectConcept | null,
  moodboardBrief: MoodboardBrief | null,
  tracks: I2Track[]
): Promise<LyricTheme[]> {
  const contextParts: string[] = [];

  if (concept) {
    contextParts.push(`ARTIST CONCEPT:
Genre: ${concept.genre_primary}${concept.genre_secondary?.length ? ` (${concept.genre_secondary.join(', ')})` : ''}
References: ${concept.reference_artists?.join(', ') || 'none'}
Mood keywords: ${concept.mood_keywords?.join(', ') || 'none'}
Creative direction: ${concept.creative_direction || 'none'}
Target audience: ${concept.target_audience || 'none'}`);
  }

  if (moodboardBrief) {
    contextParts.push(`SONIC MOODBOARD:
${moodboardBrief.prose}
Atmosphere: ${moodboardBrief.atmosphere}
Texture: ${moodboardBrief.texture}
Emotional register: ${moodboardBrief.emotional_register}
Tempo feel: ${moodboardBrief.tempo_feel}`);
  }

  if (tracks.length > 0) {
    const trackList = tracks.map(t =>
      `Track ${t.track_number}: "${t.title}" — ${t.notes}`
    ).join('\n');
    contextParts.push(`GENERATED TRACKS:\n${trackList}`);
  }

  const prompt = contextParts.join('\n\n');

  try {
    const response = await analyze(THEME_GENERATION_PROMPT, prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const themes: LyricTheme[] = JSON.parse(jsonMatch[0]);
      // Attach track inspiration info if tracks were referenced
      return themes.slice(0, 6).map((theme, i) => ({
        ...theme,
        id: `theme-${i + 1}`,
      }));
    }
  } catch (e) {
    console.error('[LyriCol] Failed to generate themes:', e);
  }

  // Fallback themes if generation fails
  return getDefaultThemes(concept);
}

function getDefaultThemes(concept: ProjectConcept | null): LyricTheme[] {
  const genre = concept?.genre_primary || 'alternative';
  const mood = concept?.mood_keywords?.[0] || 'raw';
  return [
    {
      id: 'theme-1',
      title: 'Breaking Point',
      subtitle: 'The moment everything changes and there\'s no going back.',
      mood: 'Intense',
      vibe_context: `You\'re at the edge of something irreversible. The ${genre} energy is building — all tension, no release yet. Write from the moment right before the break.`,
    },
    {
      id: 'theme-2',
      title: 'Quiet After',
      subtitle: 'The stillness that follows the storm.',
      mood: 'Reflective',
      vibe_context: `Everything has already happened. You\'re sitting in the aftermath, ${mood} and exposed. The room is empty. What do you say to yourself now?`,
    },
    {
      id: 'theme-3',
      title: 'Identity Fracture',
      subtitle: 'Who you are vs. who they see.',
      mood: 'Conflicted',
      vibe_context: `There\'s a version of you that exists in other people\'s minds — and it doesn\'t match. Write from the gap between perception and truth.`,
    },
  ];
}
