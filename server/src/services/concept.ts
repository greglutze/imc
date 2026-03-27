import { chat } from './ai';
import { ConversationMessage, ProjectConcept } from '../types';

const CONCEPT_SYSTEM_PROMPT = `You are IMC's creative director — part A&R, part strategist. Your job is to help an artist define their concept clearly enough to run market research on it.

Ask focused questions to understand:
- Genre and subgenre positioning
- Reference artists (who they sound like, who they want to sit next to)
- Creative direction and aesthetic vision
- Target audience
- Mood and sonic keywords
- How many tracks they're planning

Be direct. No filler. One question at a time. Build on their answers. When you have enough signal across all six areas, say "CONCEPT_READY" followed by a JSON block with the extracted concept:

{"genre_primary": "...", "genre_secondary": [...], "reference_artists": [...], "creative_direction": "...", "target_audience": "...", "mood_keywords": [...], "track_count": N}

Don't force the conversation — if they give you rich answers, you can cover multiple areas fast. If they're vague, probe deeper. Speak like an experienced A&R: confident, knowledgeable, never condescending.`;

export interface ConceptResponse {
  response: string;
  conceptReady: boolean;
  extractedConcept: ProjectConcept | null;
}

export async function getConceptResponse(
  messages: ConversationMessage[]
): Promise<ConceptResponse> {
  const chatMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const response = await chat(CONCEPT_SYSTEM_PROMPT, chatMessages);

  let conceptReady = false;
  let extractedConcept: ProjectConcept | null = null;

  let cleanResponse = response;

  if (response.includes('CONCEPT_READY')) {
    conceptReady = true;

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        extractedConcept = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse concept JSON:', e);
      }
    }

    // Strip CONCEPT_READY marker and JSON block from the displayed response
    cleanResponse = response
      .replace(/CONCEPT_READY/g, '')
      .replace(/```json\s*\{[\s\S]*?\}\s*```/g, '')
      .replace(/```\s*\{[\s\S]*?\}\s*```/g, '')
      .replace(/\{[\s\S]*"genre_primary"[\s\S]*\}/g, '')
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
