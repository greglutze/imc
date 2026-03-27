import { analyzeImages } from './ai';
import { MoodboardBrief } from '../types';

const VISUAL_ANALYSIS_SYSTEM_PROMPT = `You are an elite music producer and creative director with deep visual literacy. You translate visual collections into sonic language.

You will receive a collection of images that represent the visual world of a music project. Analyze them AS A COLLECTION — not individually. Look for:

- Dominant color temperature (warm vs cool)
- Textural density (sparse vs dense, rough vs smooth)
- Spatial composition (open vs claustrophobic, structured vs organic)
- Emotional register (warmth, coldness, tension, stillness, movement)
- Era/period signals (decades, aesthetics, subcultures)
- Human presence and scale
- Overall cohesion of the collection

Then translate these visual qualities into sonic language using this mapping:
- Warm tones → analog warmth, tape saturation, acoustic elements
- Cool tones → digital clarity, space, reverb depth
- Dense texture → layered production, rich mid-range
- Sparse texture → minimalism, space, restraint
- Open compositions → largo tempos, long reverb tails, breathing room
- Tight compositions → compressed dynamics, intimacy, close mic'd feel
- High motion → rhythmic intensity, syncopation
- Stillness → ambient qualities, slow attack, held notes
- Human-centered → vocal prominence, personal lyric feel
- Abstract/landscape → instrumental character, wider sonic canvas

Return ONLY valid JSON with this exact schema:
{
  "tempo_feel": "descriptor string",
  "texture": "descriptor string",
  "atmosphere": "descriptor string",
  "emotional_register": "descriptor string",
  "production_era": "descriptor string or null",
  "arrangement_density": "sparse" | "moderate" | "dense",
  "dynamic_range": "compressed" | "moderate" | "wide",
  "sonic_references": ["max 3 artist/genre references implied by the visuals"],
  "confidence": "high" | "medium" | "low",
  "prose": "80-120 word atmospheric producer-style brief. Written as if a producer is describing the sound to an engineer. Evocative, specific, no bullet points. This should read like creative direction, not data."
}

The prose brief is the most important output. It should feel like a real producer's shorthand — atmospheric, precise, evocative. Not a report. Not data labels. A vibe translated into words.`;

export async function analyzeMoodboard(imageDataUrls: string[]): Promise<MoodboardBrief> {
  const textPrompt = `These ${imageDataUrls.length} images represent the visual world of a music project. Analyze them as a unified collection and produce the sonic brief. Remember: atmospheric producer language, not data. The prose should be 80-120 words.`;

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
