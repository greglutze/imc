import { chat } from './ai';
import type { LyricSessionMessage, ProjectConcept, MoodboardBrief } from '../types';

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
