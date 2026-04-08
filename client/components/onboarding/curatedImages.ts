import type { CuratedImage } from './OnboardingFlow';

/**
 * Curated image library for the onboarding flow.
 *
 * Custom-sourced images served from /images/curated/.
 * Each image is tagged with mood, genre affinity, palette, and category
 * to power algorithmic matching when a professional user skips image selection.
 */

function img(
  id: string,
  category: string,
  mood_tags: string[],
  genre_affinity: Record<string, number>,
  palette: string[],
  filename: string,
): CuratedImage {
  return {
    id,
    src: `/images/curated/${filename}`,
    thumbnail_src: `/images/curated/thumbs/${filename}`,
    mood_tags,
    genre_affinity,
    palette,
    category,
  };
}

export const CURATED_IMAGES: CuratedImage[] = [
  // 01 — Green anthurium plant with pearls, white background
  img('curated-01', 'Nature / Organic', ['botanical', 'sculptural', 'pristine'], { 'ambient': 0.7, 'indie': 0.6, 'folk': 0.8, 'classical': 0.5 }, ['#2d5a1e', '#8b6914', '#f5f5f0'], 'curated-01.jpg'),

  // 02 — Abstract color fluid: neon pink, green, lavender gradients
  img('curated-02', 'Texture / Abstract', ['fluid', 'vivid', 'synthetic'], { 'electronic': 0.9, 'pop': 0.8, 'rnb': 0.5 }, ['#7fbf00', '#ff3366', '#d8b4fe'], 'curated-02.jpg'),

  // 03 — Portrait with rainbow prism light, blue hair, lavender backdrop
  img('curated-03', 'People / Movement', ['prismatic', 'editorial', 'ethereal'], { 'pop': 0.9, 'electronic': 0.7, 'rnb': 0.6 }, ['#5bc0eb', '#d4a5a5', '#f0c987'], 'curated-03.jpg'),

  // 04 — Chrome spheres in symmetrical arrangement, white background
  img('curated-04', 'Texture / Abstract', ['precise', 'chrome', 'futuristic'], { 'electronic': 0.9, 'ambient': 0.6, 'pop': 0.5 }, ['#c0c0c0', '#4a4a4a', '#ffffff'], 'curated-04.jpg'),

  // 05 — Motion blur of dancers/figures in green field
  img('curated-05', 'People / Movement', ['kinetic', 'wild', 'blurred'], { 'folk': 0.7, 'ambient': 0.6, 'rock': 0.5, 'classical': 0.6 }, ['#556b2f', '#d2b48c', '#8fbc8f'], 'curated-05.jpg'),

  // 06 — Long-exposure figure silhouette in amber/orange haze
  img('curated-06', 'Dark / Moody', ['spectral', 'warm', 'dissolving'], { 'ambient': 0.9, 'rnb': 0.7, 'electronic': 0.6, 'hip-hop': 0.5 }, ['#ff6b00', '#1a0a00', '#cc5500'], 'curated-06.jpg'),

  // 07 — Blurred B&W silhouette figure with arms extended
  img('curated-07', 'People / Movement', ['ethereal', 'vulnerable', 'minimal'], { 'ambient': 0.8, 'classical': 0.7, 'indie': 0.6 }, ['#1a1a1a', '#c0c0c0', '#ffffff'], 'curated-07.jpg'),

  // 08 — Blue ocean/shoreline abstract, deep indigo tones
  img('curated-08', 'Nature / Organic', ['oceanic', 'serene', 'deep'], { 'ambient': 0.9, 'electronic': 0.6, 'jazz': 0.5 }, ['#001f3f', '#4a90a4', '#87ceeb'], 'curated-08.jpg'),

  // 09 — Light painting / long-exposure mechanical spiral, B&W
  img('curated-09', 'Texture / Abstract', ['mechanical', 'orbital', 'spectral'], { 'electronic': 0.8, 'ambient': 0.7, 'metal': 0.5 }, ['#0d0d0d', '#c0c0c0', '#ffffff'], 'curated-09.jpg'),

  // 10 — Printer receipt tape, data / ephemera
  img('curated-10', 'Vintage / Found', ['data', 'ephemeral', 'analog'], { 'electronic': 0.6, 'hip-hop': 0.5, 'indie': 0.7 }, ['#f5f5f0', '#d4c5a0', '#8a8a8a'], 'curated-10.jpg'),

  // 11 — Hand touching dark water with light ripples, volcanic rock
  img('curated-11', 'Nature / Organic', ['tactile', 'ritualistic', 'primal'], { 'ambient': 0.9, 'folk': 0.7, 'rnb': 0.5 }, ['#0d0d0d', '#c0c0c0', '#3a3a3a'], 'curated-11.jpg'),

  // 12 — Botanical specimen: white flower with dark green leaves on black
  img('curated-12', 'Nature / Organic', ['botanical', 'nocturnal', 'delicate'], { 'ambient': 0.8, 'classical': 0.7, 'folk': 0.6, 'indie': 0.5 }, ['#0a2a0a', '#4a6a4a', '#ffffff'], 'curated-12.jpg'),

  // 13 — Dark green textured head silhouette on grey
  img('curated-13', 'Dark / Moody', ['identity', 'masked', 'textured'], { 'electronic': 0.7, 'hip-hop': 0.8, 'ambient': 0.6 }, ['#0a3a2a', '#808080', '#2d2d2d'], 'curated-13.jpg'),

  // 14 — Decayed wall with chair, B&W, peeling paint
  img('curated-14', 'Dark / Moody', ['decayed', 'abandoned', 'raw'], { 'punk': 0.7, 'ambient': 0.6, 'indie': 0.8, 'metal': 0.5 }, ['#3a3a3a', '#8a8a8a', '#d4d4d4'], 'curated-14.jpg'),

  // 15 — Dark textured surface / geological close-up
  img('curated-15', 'Texture / Abstract', ['geological', 'ancient', 'visceral'], { 'ambient': 0.8, 'metal': 0.7, 'electronic': 0.5 }, ['#0d0d0d', '#4a4a4a', '#8a8a8a'], 'curated-15.jpg'),

  // 16 — Color palette grid / swatch matrix
  img('curated-16', 'Color Fields', ['systematic', 'chromatic', 'infinite'], { 'electronic': 0.7, 'pop': 0.6, 'ambient': 0.5 }, ['#ff6b6b', '#4ecdc4', '#2c3e50'], 'curated-16.jpg'),

  // 17 — Neon blue cross in ornate church interior
  img('curated-17', 'Architecture / Sacred', ['sacred', 'neon', 'cinematic'], { 'hip-hop': 0.7, 'rnb': 0.8, 'ambient': 0.6, 'latin': 0.5 }, ['#00bfff', '#8b6914', '#1a1a2e'], 'curated-17.jpg'),

  // 18 — Psychedelic color burst / radial light explosion
  img('curated-18', 'Color Fields', ['explosive', 'transcendent', 'cosmic'], { 'rock': 0.7, 'electronic': 0.8, 'pop': 0.6 }, ['#e040fb', '#ff8c00', '#4169e1'], 'curated-18.jpg'),

  // 19 — Halftone close-up face in deep blue / cyanotype
  img('curated-19', 'Dark / Moody', ['intimate', 'halftone', 'submerged'], { 'rnb': 0.8, 'electronic': 0.7, 'ambient': 0.6 }, ['#001f4d', '#003366', '#1a1a2e'], 'curated-19.jpg'),

  // 20 — Colorful overlapping circles on vintage document
  img('curated-20', 'Vintage / Found', ['collage', 'playful', 'archival'], { 'pop': 0.8, 'indie': 0.7, 'electronic': 0.5 }, ['#ffcc00', '#ff1493', '#4169e1'], 'curated-20.jpg'),

  // 21 — Group huddle from behind, all in black, white background
  img('curated-21', 'People / Movement', ['communal', 'unified', 'anonymous'], { 'hip-hop': 0.8, 'rock': 0.6, 'electronic': 0.5, 'rnb': 0.6 }, ['#0d0d0d', '#2d2d2d', '#ffffff'], 'curated-21.jpg'),

  // 22 — B&W profile portrait, minimal, hoop earring
  img('curated-22', 'People / Movement', ['quiet', 'editorial', 'elegant'], { 'indie': 0.8, 'jazz': 0.6, 'rnb': 0.7, 'folk': 0.5 }, ['#1a1a1a', '#a0a0a0', '#f0f0f0'], 'curated-22.jpg'),

  // 23 — B&W multiple-exposure silhouette with light burst
  img('curated-23', 'Dark / Moody', ['ritualistic', 'explosive', 'mythic'], { 'rock': 0.8, 'metal': 0.6, 'ambient': 0.7, 'electronic': 0.5 }, ['#0d0d0d', '#808080', '#e0e0e0'], 'curated-23.jpg'),

  // 24 — Dark field with wildflowers, red poppies, moody green
  img('curated-24', 'Nature / Organic', ['lush', 'melancholic', 'alive'], { 'folk': 0.9, 'indie': 0.7, 'ambient': 0.6 }, ['#1a3a1a', '#ff4444', '#4a6a8a'], 'curated-24.jpg'),

  // 25 — Car on fire on a beach at dusk
  img('curated-25', 'Dark / Moody', ['apocalyptic', 'cinematic', 'beautiful-destruction'], { 'rock': 0.8, 'hip-hop': 0.7, 'electronic': 0.6, 'punk': 0.7 }, ['#ff6b00', '#87ceeb', '#1a1a1a'], 'curated-25.jpg'),

  // 26 — Motion-blur horses running, ethereal double-exposure
  img('curated-26', 'Nature / Organic', ['wild', 'free', 'dreamlike'], { 'folk': 0.8, 'ambient': 0.7, 'country': 0.6, 'rock': 0.5 }, ['#3a2a1a', '#d4c5a0', '#b0c4de'], 'curated-26.jpg'),

  // 27 — B&W dramatic portrait, bearded man, split light
  img('curated-27', 'People / Movement', ['introspective', 'raw', 'soulful'], { 'folk': 0.8, 'jazz': 0.7, 'rock': 0.6, 'rnb': 0.5 }, ['#1a1a1a', '#4a4a4a', '#a0a0a0'], 'curated-27.jpg'),

  // 28 — Anatomical illustration in warm tones, X-ray skull/spine
  img('curated-28', 'Texture / Abstract', ['anatomical', 'visceral', 'scientific'], { 'electronic': 0.7, 'metal': 0.6, 'hip-hop': 0.5, 'ambient': 0.6 }, ['#ff8c00', '#8b0000', '#2d0a00'], 'curated-28.jpg'),

  // 29 — Abstract light refraction: yellow, teal, black diagonal
  img('curated-29', 'Color Fields', ['prismatic', 'sharp', 'bold'], { 'electronic': 0.8, 'pop': 0.7, 'ambient': 0.5 }, ['#ffd700', '#008b8b', '#0d0d0d'], 'curated-29.jpg'),

  // 30 — Futuristic helmet/mannequin, sleek grey and black
  img('curated-30', 'Texture / Abstract', ['futuristic', 'sleek', 'posthuman'], { 'electronic': 0.9, 'hip-hop': 0.6, 'pop': 0.5 }, ['#c0c0c0', '#1a1a1a', '#e0e0e0'], 'curated-30.jpg'),

  // 31 — Bold graphic: purple/violet mushroom shape on orange
  img('curated-31', 'Color Fields', ['bold', 'graphic', 'playful'], { 'pop': 0.9, 'electronic': 0.7, 'reggaeton': 0.5, 'latin': 0.5 }, ['#ff4500', '#9370db', '#006994'], 'curated-31.jpg'),

  // 32 — Stack of white papers with binder clip on black
  img('curated-32', 'Texture / Abstract', ['minimal', 'tactile', 'clean'], { 'ambient': 0.7, 'indie': 0.6, 'jazz': 0.5 }, ['#0d0d0d', '#f5f5f0', '#c0c0c0'], 'curated-32.jpg'),

];

/**
 * Returns curated images sorted by genre affinity score for the given genres.
 * Used when a Professional user skips image selection — we auto-pick the top N.
 */
export function getTopImagesForGenres(genres: string[], count = 8): CuratedImage[] {
  return [...CURATED_IMAGES]
    .sort((a, b) => {
      const scoreA = genres.reduce((sum, g) => sum + (a.genre_affinity[g] || 0), 0);
      const scoreB = genres.reduce((sum, g) => sum + (b.genre_affinity[g] || 0), 0);
      return scoreB - scoreA;
    })
    .slice(0, count);
}
