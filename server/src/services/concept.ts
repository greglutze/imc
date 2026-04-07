import { chat } from './ai';
import { ConversationMessage, ProjectConcept } from '../types';

const CONCEPT_BASE_PROMPT = `You are IMC's creative director — part A&R, part strategist. Your job is to help an artist define their concept clearly enough to run market research on it.

Ask focused questions to understand:
- Genre and subgenre positioning
- Reference artists (who they sound like, who they want to sit next to)
- Creative direction and aesthetic vision
- Target audience
- Mood and sonic keywords
- How many tracks they're planning

Be direct. No filler. One question at a time. Build on their answers. When you have enough signal across all six areas, respond with a brief conversational summary of what you've locked in (2-3 sentences reflecting back the artist's vision), then on a new line write "CONCEPT_READY" followed by the JSON block:

CONCEPT_READY
{"genre_primary": "...", "genre_secondary": [...], "reference_artists": [...], "creative_direction": "...", "target_audience": "...", "mood_keywords": [...], "track_count": N}

IMPORTANT: Always include a conversational message BEFORE "CONCEPT_READY". Never start your response with CONCEPT_READY directly.

The conversation continues after concept extraction — the artist can always come back to refine their concept. If they send more messages after extraction, engage naturally and if the concept should change, output a new CONCEPT_READY block with the updated concept.

Don't force the conversation — if they give you rich answers, you can cover multiple areas fast. If they're vague, probe deeper. Speak like an experienced A&R: confident, knowledgeable, never condescending.`;

/**
 * Extract context tags from the conversation so far.
 * These accumulate as the artist reveals more about their vision,
 * making each AI response more attuned and specific.
 */
function extractContextTags(messages: ConversationMessage[]): string {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());

  if (userMessages.length === 0) return '';

  const allUserText = userMessages.join(' ');

  const tags: string[] = [];

  // Genre signals
  const genreWords = ['hip-hop', 'hip hop', 'rap', 'r&b', 'rnb', 'pop', 'rock', 'indie', 'electronic',
    'soul', 'jazz', 'folk', 'country', 'metal', 'punk', 'lo-fi', 'lofi', 'ambient', 'trap',
    'drill', 'house', 'techno', 'disco', 'funk', 'gospel', 'classical', 'alternative',
    'shoegaze', 'post-punk', 'synth-pop', 'synthpop', 'neo-soul', 'afrobeats', 'latin',
    'reggaeton', 'dancehall', 'grunge', 'emo', 'screamo', 'experimental', 'noise',
    'psych', 'psychedelic', 'dream pop', 'bedroom pop', 'cloud rap', 'phonk', 'jersey club'];
  const foundGenres = genreWords.filter(g => allUserText.includes(g));
  if (foundGenres.length > 0) tags.push(`Genres mentioned: ${foundGenres.join(', ')}`);

  // Mood / energy signals
  const moodWords = ['dark', 'bright', 'melancholy', 'angry', 'sad', 'euphoric', 'chill', 'aggressive',
    'dreamy', 'nostalgic', 'uplifting', 'haunting', 'ethereal', 'raw', 'minimal', 'lush',
    'gritty', 'smooth', 'chaotic', 'introspective', 'vulnerable', 'confident', 'moody',
    'atmospheric', 'cinematic', 'intimate', 'anthemic', 'brooding', 'playful', 'somber',
    'warm', 'cold', 'hazy', 'crisp', 'heavy', 'light', 'floating', 'driving'];
  const foundMoods = moodWords.filter(m => allUserText.includes(m));
  if (foundMoods.length > 0) tags.push(`Mood/energy: ${foundMoods.join(', ')}`);

  // Production era signals
  const eraWords = ['90s', '80s', '70s', '2000s', 'y2k', 'vintage', 'retro', 'modern', 'futuristic',
    'analog', 'digital', 'lo-fi', 'hi-fi', 'tape', 'vinyl'];
  const foundEras = eraWords.filter(e => allUserText.includes(e));
  if (foundEras.length > 0) tags.push(`Era/aesthetic: ${foundEras.join(', ')}`);

  // Conversation depth indicator
  const turnCount = userMessages.length;
  if (turnCount >= 5) {
    tags.push('Deep in conversation — be specific, reference what they\'ve told you');
  } else if (turnCount >= 3) {
    tags.push('Building rapport — start connecting their ideas together');
  }

  if (tags.length === 0) return '';

  return `\n\n--- CONTEXT FROM THIS SESSION ---\n${tags.join('\n')}\n\nUse this context to make your responses more specific and attuned. Reference their language. Mirror their energy. The deeper the conversation goes, the more you should sound like you truly understand their vision.`;
}

const IMMEDIATE_EXTRACTION_ADDENDUM = `

CRITICAL OVERRIDE: The user is providing all project details in a single message from the onboarding flow. They have already answered every question. DO NOT ask follow-up questions. DO NOT ask for clarification. You MUST extract the concept immediately from what they've provided.

Respond with a brief 2-3 sentence summary of what you've understood, then output CONCEPT_READY followed by the JSON block. This is non-negotiable — the user has given you all six areas (genre, reference artists, creative direction, target audience, mood, track count). Extract now.`;

function buildSystemPrompt(messages: ConversationMessage[], immediate: boolean = false): string {
  let prompt = CONCEPT_BASE_PROMPT + extractContextTags(messages);
  if (immediate) {
    prompt += IMMEDIATE_EXTRACTION_ADDENDUM;
  }
  return prompt;
}

export interface ConceptResponse {
  response: string;
  conceptReady: boolean;
  extractedConcept: ProjectConcept | null;
}

/**
 * Try to extract a valid concept JSON from an AI response.
 * Handles multiple formats: CONCEPT_READY marker, markdown code fences,
 * or raw JSON containing genre_primary.
 */
function tryExtractConceptJson(text: string): ProjectConcept | null {
  // Look for JSON blocks — try markdown-fenced first, then raw
  const patterns = [
    /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
    /(\{[\s\S]*?"genre_primary"[\s\S]*?\})/,
    /(\{[\s\S]*\})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        // Validate it has the required field
        if (parsed.genre_primary) {
          return parsed as ProjectConcept;
        }
      } catch {
        // Try next pattern
      }
    }
  }
  return null;
}

export async function getConceptResponse(
  messages: ConversationMessage[],
  immediate: boolean = false
): Promise<ConceptResponse> {
  const chatMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const systemPrompt = buildSystemPrompt(messages, immediate);

  console.log(`[concept] Sending ${chatMessages.length} messages to AI (immediate=${immediate})`);
  const response = await chat(systemPrompt, chatMessages);
  console.log(`[concept] AI response length: ${response.length} chars`);
  console.log(`[concept] Contains CONCEPT_READY: ${response.includes('CONCEPT_READY')}`);

  let conceptReady = false;
  let extractedConcept: ProjectConcept | null = null;
  let cleanResponse = response;

  // Primary path: explicit CONCEPT_READY marker
  if (response.includes('CONCEPT_READY')) {
    conceptReady = true;
    extractedConcept = tryExtractConceptJson(response);
  }
  // Fallback: no marker but response contains valid concept JSON (model sometimes omits the marker)
  else if (immediate && response.includes('genre_primary')) {
    console.log('[concept] No CONCEPT_READY marker but found genre_primary — attempting fallback extraction');
    extractedConcept = tryExtractConceptJson(response);
    if (extractedConcept) {
      conceptReady = true;
      console.log('[concept] Fallback extraction succeeded');
    }
  }

  if (extractedConcept) {
    console.log(`[concept] Extracted concept: genre=${extractedConcept.genre_primary}, artists=${(extractedConcept.reference_artists || []).length}`);
  } else if (conceptReady) {
    console.warn('[concept] CONCEPT_READY found but JSON extraction failed');
    conceptReady = false; // Don't mark as ready if we couldn't extract
  }

  if (conceptReady) {
    // Strip CONCEPT_READY marker and any JSON block (with or without markdown fences)
    cleanResponse = response
      .replace(/CONCEPT_READY/gi, '')
      .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '')
      .replace(/\{[\s\S]*?"genre_primary"[\s\S]*?\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // If stripping left nothing meaningful, add a clean message
    if (!cleanResponse || cleanResponse.length < 10) {
      cleanResponse = "Got it — I've locked in your concept. You're ready to run market research.";
    }
  }

  return {
    response: cleanResponse,
    conceptReady,
    extractedConcept,
  };
}
