import { analyzeImages } from './ai';
import { MoodboardBrief } from '../types';

const VISUAL_ANALYSIS_SYSTEM_PROMPT = `You are a creative director who deeply understands how visual worlds translate into emotional and sonic energy. You feel images before you analyze them.

You will receive a collection of images that represent the visual world of a music project. Experience them AS A COLLECTION — not individually. Feel into:

- What emotions hit first? (longing, defiance, tenderness, euphoria, grief, desire, restlessness)
- What energy lives here? (still vs kinetic, heavy vs weightless, intimate vs vast)
- What does this world feel like to stand inside? (temperature, air, light, time of day)
- What kind of person lives here? What are they feeling?
- Is there tension, release, or both? Where does the emotional arc go?

Then translate those feelings into how the music should FEEL — not technical production specs, but the emotional and energetic qualities that will guide the sonic engine:
- What emotions should the listener feel in the first 10 seconds?
- What's the emotional journey across a track?
- How does the energy move — does it build, pulse, drift, explode?
- What's the relationship between vulnerability and power?

Return ONLY valid JSON with this exact schema:
{
  "tempo_feel": "descriptor string",
  "texture": "descriptor string — focus on how it FEELS (rough and raw, silk over glass, warm and thick) not technical terms",
  "atmosphere": "descriptor string — describe the emotional space (lonely 3am hallway, sun breaking through after rain, the moment before a fight)",
  "emotional_register": "descriptor string — the core feeling (aching vulnerability, quiet fury, bittersweet euphoria)",
  "production_era": "descriptor string or null",
  "arrangement_density": "sparse" | "moderate" | "dense",
  "dynamic_range": "compressed" | "moderate" | "wide",
  "sonic_references": ["max 3 artist/genre references implied by the visuals"],
  "confidence": "high" | "medium" | "low",
  "prose": "80-120 word emotional brief. NOT production jargon. Write about how this music should make someone FEEL. What emotions, what energy, what world does the listener enter? Be specific and vivid — describe feelings, not frequencies. This is the emotional compass for the entire project."
}

The prose brief is the most important output. It should read like a letter to the artist about the emotional world they're building. Feelings first, always. Not production notes. Not data. The raw emotional truth of what these images are saying.`;

export async function analyzeMoodboard(imageDataUrls: string[]): Promise<MoodboardBrief> {
  const textPrompt = `These ${imageDataUrls.length} images represent the visual world of a music project. Feel into them as a unified collection. What emotions live here? What energy? Write the prose brief about how this music should make someone FEEL — not production specs. 80-120 words, feelings first.`;

  const response = await analyzeImages(
    VISUAL_ANALYSIS_SYSTEM_PROMPT,
    imageDataUrls,
    textPrompt
  );

  // Extract JSON from response
  let jsonStr = response;
  const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // Try to find raw JSON
    const braceMatch = response.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }
  }

  const parsed = JSON.parse(jsonStr);

  return {
    tempo_feel: parsed.tempo_feel || '',
    texture: parsed.texture || '',
    atmosphere: parsed.atmosphere || '',
    emotional_register: parsed.emotional_register || '',
    production_era: parsed.production_era || null,
    arrangement_density: parsed.arrangement_density || 'moderate',
    dynamic_range: parsed.dynamic_range || 'moderate',
    sonic_references: parsed.sonic_references || [],
    confidence: parsed.confidence || 'medium',
    prose: parsed.prose || '',
    flagged_elements: [],
    version: 1,
    previous_prose: null,
  };
}
