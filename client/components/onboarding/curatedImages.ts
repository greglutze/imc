import type { CuratedImage } from './OnboardingFlow';

/**
 * Curated image library for the onboarding flow.
 *
 * In production, these are fetched from GET /api/onboarding/images.
 * This file serves as the seed data / fallback, with placeholder
 * images from Unsplash (free to use, no attribution required for this usage).
 *
 * Each image is tagged with mood, genre affinity, palette, and category
 * to power algorithmic matching when a professional user skips image selection.
 */

// Helper to generate a curated image entry
function img(
  id: string,
  category: string,
  mood_tags: string[],
  genre_affinity: Record<string, number>,
  palette: string[],
  unsplashId: string,
): CuratedImage {
  return {
    id,
    // Unsplash source URLs — optimized at 800w for grid, 1600w for full
    src: `https://images.unsplash.com/photo-${unsplashId}?w=1600&q=80&auto=format`,
    thumbnail_src: `https://images.unsplash.com/photo-${unsplashId}?w=400&q=80&auto=format`,
    mood_tags,
    genre_affinity,
    palette,
    category,
  };
}

export const CURATED_IMAGES: CuratedImage[] = [
  // ── Urban / Night (12) ──
  img('urban-01', 'Urban / Night', ['energetic', 'electric', 'nocturnal'], { 'electronic': 0.9, 'hip-hop': 0.7, 'pop': 0.5 }, ['#1a0a2e', '#ff006e', '#3a86ff'], '1519501025264-f67962a626fd'),
  img('urban-02', 'Urban / Night', ['moody', 'urban', 'cinematic'], { 'hip-hop': 0.9, 'rnb': 0.7, 'electronic': 0.5 }, ['#0d1117', '#58a6ff', '#8b949e'], '1534430480872-3498386e7856'),
  img('urban-03', 'Urban / Night', ['gritty', 'raw', 'street'], { 'hip-hop': 0.9, 'punk': 0.6, 'rock': 0.5 }, ['#2d2d2d', '#ff4500', '#ffa500'], '1517736996520-5c8a9de7e9f8'),
  img('urban-04', 'Urban / Night', ['dreamy', 'neon', 'futuristic'], { 'electronic': 0.9, 'pop': 0.6, 'ambient': 0.5 }, ['#0a0a2a', '#e040fb', '#00e5ff'], '1514565131-fce0801e5785'),
  img('urban-05', 'Urban / Night', ['lonely', 'melancholic', 'reflective'], { 'rnb': 0.8, 'ambient': 0.7, 'indie': 0.5 }, ['#1c1c1e', '#6c5ce7', '#a29bfe'], '1504608524841-42fe6f032b4b'),
  img('urban-06', 'Urban / Night', ['vibrant', 'energetic', 'alive'], { 'pop': 0.8, 'electronic': 0.7, 'latin': 0.6 }, ['#ff0054', '#f8f32b', '#00f5d4'], '1553531384-397c80973a0b'),
  img('urban-07', 'Urban / Night', ['underground', 'dark', 'intense'], { 'electronic': 0.8, 'metal': 0.5, 'hip-hop': 0.6 }, ['#0d0d0d', '#b33dc6', '#ffffff'], '1504703395950-b89145a5425b'),
  img('urban-08', 'Urban / Night', ['atmospheric', 'hazy', 'nocturnal'], { 'ambient': 0.8, 'electronic': 0.7, 'jazz': 0.4 }, ['#1a1a2e', '#16213e', '#e94560'], '1519608487953-e999c86e7455'),
  img('urban-09', 'Urban / Night', ['warm', 'intimate', 'late-night'], { 'jazz': 0.7, 'rnb': 0.8, 'folk': 0.3 }, ['#2b1810', '#ff7b54', '#ffb26b'], '1544022613-e87ca75a784a'),
  img('urban-10', 'Urban / Night', ['slick', 'modern', 'polished'], { 'pop': 0.9, 'rnb': 0.6, 'electronic': 0.5 }, ['#141414', '#c0c0c0', '#ffffff'], '1480714378408-67cf0d13bc1b'),
  img('urban-11', 'Urban / Night', ['chaotic', 'frantic', 'electric'], { 'punk': 0.7, 'electronic': 0.8, 'rock': 0.6 }, ['#ff006e', '#8338ec', '#3a86ff'], '1518481612222-68bbe828ecd1'),
  img('urban-12', 'Urban / Night', ['serene', 'still', 'contemplative'], { 'ambient': 0.9, 'classical': 0.5, 'indie': 0.4 }, ['#0a192f', '#64ffda', '#8892b0'], '1542332213-31f87348057f'),

  // ── Nature / Organic (12) ──
  img('nature-01', 'Nature / Organic', ['ethereal', 'mystical', 'foggy'], { 'ambient': 0.9, 'folk': 0.7, 'classical': 0.5 }, ['#2d4a3e', '#7db7a4', '#c4dccf'], '1507400492013-162706c8c05e'),
  img('nature-02', 'Nature / Organic', ['powerful', 'vast', 'oceanic'], { 'rock': 0.7, 'ambient': 0.8, 'classical': 0.6 }, ['#1a3a4a', '#4a90a4', '#8ec8e8'], '1505118380757-91f5f5632de0'),
  img('nature-03', 'Nature / Organic', ['arid', 'expansive', 'lonely'], { 'country': 0.7, 'ambient': 0.8, 'folk': 0.6 }, ['#c2956b', '#e8c79e', '#f5e6d3'], '1509316785289-025f5b846b35'),
  img('nature-04', 'Nature / Organic', ['bright', 'hopeful', 'warm'], { 'pop': 0.7, 'folk': 0.8, 'country': 0.6 }, ['#4caf50', '#ffeb3b', '#ff9800'], '1500829243541-74b677fecc30'),
  img('nature-05', 'Nature / Organic', ['melancholic', 'rainy', 'introspective'], { 'indie': 0.9, 'folk': 0.7, 'ambient': 0.6 }, ['#546e7a', '#90a4ae', '#cfd8dc'], '1515694346937-94d85e41e6f0'),
  img('nature-06', 'Nature / Organic', ['majestic', 'grand', 'soaring'], { 'classical': 0.8, 'rock': 0.6, 'ambient': 0.7 }, ['#37474f', '#78909c', '#eceff1'], '1464822759023-fed622ff2c3b'),
  img('nature-07', 'Nature / Organic', ['tranquil', 'zen', 'minimal'], { 'ambient': 0.9, 'classical': 0.7, 'jazz': 0.4 }, ['#e8d5b7', '#f0e6d3', '#ffffff'], '1518241353330-0f7941c2d9b5'),
  img('nature-08', 'Nature / Organic', ['wild', 'untamed', 'raw'], { 'rock': 0.8, 'metal': 0.6, 'folk': 0.5 }, ['#1b5e20', '#33691e', '#827717'], '1441974231531-c6227db76b6e'),
  img('nature-09', 'Nature / Organic', ['golden', 'nostalgic', 'warm'], { 'folk': 0.9, 'country': 0.7, 'indie': 0.6 }, ['#ff8f00', '#ffc107', '#ffecb3'], '1507525428034-b723cf961d3e'),
  img('nature-10', 'Nature / Organic', ['icy', 'stark', 'minimal'], { 'ambient': 0.9, 'electronic': 0.5, 'classical': 0.6 }, ['#b3e5fc', '#e1f5fe', '#ffffff'], '1491002052546-521e1a89d743'),
  img('nature-11', 'Nature / Organic', ['lush', 'tropical', 'alive'], { 'reggaeton': 0.7, 'latin': 0.8, 'afrobeats': 0.6 }, ['#1b5e20', '#4caf50', '#81c784'], '1518531933037-91b2f5f229cc'),
  img('nature-12', 'Nature / Organic', ['stormy', 'dramatic', 'intense'], { 'rock': 0.8, 'metal': 0.7, 'classical': 0.6 }, ['#1a237e', '#283593', '#5c6bc0'], '1461511669078-d46bf351cd6e'),

  // ── Texture / Abstract (12) ──
  img('texture-01', 'Texture / Abstract', ['fluid', 'ethereal', 'dreamy'], { 'ambient': 0.9, 'electronic': 0.7, 'classical': 0.4 }, ['#ce93d8', '#f48fb1', '#90caf9'], '1541701494587-cb58502866ab'),
  img('texture-02', 'Texture / Abstract', ['gritty', 'decayed', 'industrial'], { 'metal': 0.8, 'punk': 0.7, 'electronic': 0.5 }, ['#795548', '#8d6e63', '#d7ccc8'], '1527176930608-250500e02f7e'),
  img('texture-03', 'Texture / Abstract', ['smooth', 'liquid', 'chrome'], { 'electronic': 0.9, 'pop': 0.6, 'rnb': 0.5 }, ['#c0c0c0', '#808080', '#e0e0e0'], '1553356084-58ef4a67b2a7'),
  img('texture-04', 'Texture / Abstract', ['fiery', 'passionate', 'intense'], { 'rock': 0.7, 'latin': 0.8, 'reggaeton': 0.6 }, ['#ff1744', '#ff6e40', '#ffd740'], '1507003211169-0a1dd7228f2d'),
  img('texture-05', 'Texture / Abstract', ['fractured', 'broken', 'angular'], { 'punk': 0.8, 'electronic': 0.7, 'rock': 0.6 }, ['#212121', '#616161', '#bdbdbd'], '1496715976403-7e36dc43f17b'),
  img('texture-06', 'Texture / Abstract', ['soft', 'organic', 'natural'], { 'folk': 0.8, 'ambient': 0.7, 'classical': 0.5 }, ['#efebe9', '#d7ccc8', '#bcaaa4'], '1533035353720-f1c6a75cd8ab'),
  img('texture-07', 'Texture / Abstract', ['electric', 'vivid', 'synthetic'], { 'electronic': 0.9, 'pop': 0.7, 'hip-hop': 0.4 }, ['#00bcd4', '#e040fb', '#76ff03'], '1550859492-d5da9d8e45f3'),
  img('texture-08', 'Texture / Abstract', ['misty', 'smoky', 'mysterious'], { 'ambient': 0.8, 'jazz': 0.7, 'rnb': 0.5 }, ['#37474f', '#546e7a', '#90a4ae'], '1504893524553-b855bce32c67'),
  img('texture-09', 'Texture / Abstract', ['cosmic', 'expansive', 'deep'], { 'electronic': 0.8, 'ambient': 0.9, 'classical': 0.4 }, ['#0d0221', '#190535', '#7b2d8e'], '1462331940025-496dfbfc7564'),
  img('texture-10', 'Texture / Abstract', ['earthy', 'warm', 'tactile'], { 'folk': 0.7, 'country': 0.6, 'jazz': 0.5 }, ['#8d6e63', '#a1887f', '#d7ccc8'], '1517697471339-4aa32003c11a'),
  img('texture-11', 'Texture / Abstract', ['clean', 'precise', 'minimal'], { 'electronic': 0.7, 'ambient': 0.6, 'pop': 0.5 }, ['#ffffff', '#f5f5f5', '#e0e0e0'], '1557672172-298e090bd0f1'),
  img('texture-12', 'Texture / Abstract', ['dark', 'oily', 'visceral'], { 'metal': 0.8, 'hip-hop': 0.6, 'electronic': 0.7 }, ['#1a1a1a', '#0d0d0d', '#333333'], '1505533321630-975218a5f66f'),

  // ── People / Movement (10) ──
  img('people-01', 'People / Movement', ['euphoric', 'communal', 'alive'], { 'pop': 0.8, 'electronic': 0.9, 'hip-hop': 0.6 }, ['#ff4081', '#ff80ab', '#f8bbd0'], '1429962714451-bb934ecdc4ec'),
  img('people-02', 'People / Movement', ['soulful', 'focused', 'crafted'], { 'jazz': 0.9, 'rnb': 0.7, 'folk': 0.5 }, ['#3e2723', '#5d4037', '#8d6e63'], '1511379938547-c1f69419868d'),
  img('people-03', 'People / Movement', ['free', 'joyful', 'expressive'], { 'afrobeats': 0.8, 'pop': 0.7, 'latin': 0.7 }, ['#ff6f00', '#ffca28', '#fff176'], '1504609813442-a8924e83f76e'),
  img('people-04', 'People / Movement', ['intimate', 'quiet', 'personal'], { 'indie': 0.8, 'folk': 0.9, 'ambient': 0.5 }, ['#efebe9', '#d7ccc8', '#bcaaa4'], '1507838153414-b4b713384a76'),
  img('people-05', 'People / Movement', ['rebellious', 'intense', 'charged'], { 'punk': 0.9, 'rock': 0.8, 'metal': 0.6 }, ['#b71c1c', '#d32f2f', '#f44336'], '1459749411175-04bf5292ceea'),
  img('people-06', 'People / Movement', ['elegant', 'fluid', 'graceful'], { 'classical': 0.8, 'jazz': 0.7, 'ambient': 0.5 }, ['#1a1a1a', '#4a4a4a', '#9e9e9e'], '1508700929628-666bc8bd84ea'),
  img('people-07', 'People / Movement', ['gritty', 'street', 'authentic'], { 'hip-hop': 0.9, 'rnb': 0.6, 'reggaeton': 0.5 }, ['#424242', '#757575', '#bdbdbd'], '1547036967-23d11aacaee0'),
  img('people-08', 'People / Movement', ['electric', 'explosive', 'powerful'], { 'rock': 0.9, 'metal': 0.7, 'punk': 0.6 }, ['#ff1744', '#ff5252', '#ff8a80'], '1493225457124-a3eb161ffa5f'),
  img('people-09', 'People / Movement', ['tender', 'romantic', 'close'], { 'rnb': 0.9, 'pop': 0.7, 'indie': 0.5 }, ['#f8bbd0', '#f48fb1', '#ec407a'], '1516450360452-9258d9fc7a1e'),
  img('people-10', 'People / Movement', ['focused', 'driven', 'precise'], { 'electronic': 0.7, 'hip-hop': 0.6, 'pop': 0.5 }, ['#263238', '#37474f', '#546e7a'], '1598488035139-bdbb2231ce04'),

  // ── Architecture / Space (10) ──
  img('arch-01', 'Architecture / Space', ['brutalist', 'heavy', 'imposing'], { 'metal': 0.7, 'electronic': 0.6, 'ambient': 0.5 }, ['#616161', '#9e9e9e', '#e0e0e0'], '1518005020951-bacb37cc8099'),
  img('arch-02', 'Architecture / Space', ['futuristic', 'sleek', 'neon'], { 'electronic': 0.9, 'pop': 0.6, 'hip-hop': 0.5 }, ['#e040fb', '#00e5ff', '#1a1a2e'], '1521136095380-08fbd7be93c8'),
  img('arch-03', 'Architecture / Space', ['sacred', 'grand', 'echoing'], { 'classical': 0.9, 'ambient': 0.8, 'folk': 0.4 }, ['#5d4037', '#8d6e63', '#efebe9'], '1507003211169-0a1dd7228f2d'),
  img('arch-04', 'Architecture / Space', ['minimal', 'clean', 'precise'], { 'ambient': 0.7, 'electronic': 0.6, 'jazz': 0.4 }, ['#fafafa', '#e0e0e0', '#bdbdbd'], '1486406146926-c627a92ad1ab'),
  img('arch-05', 'Architecture / Space', ['abandoned', 'decayed', 'haunting'], { 'ambient': 0.8, 'metal': 0.6, 'indie': 0.5 }, ['#4e342e', '#6d4c41', '#a1887f'], '1518005020951-bacb37cc8099'),
  img('arch-06', 'Architecture / Space', ['industrial', 'raw', 'warehouse'], { 'electronic': 0.8, 'punk': 0.7, 'hip-hop': 0.6 }, ['#424242', '#757575', '#9e9e9e'], '1504198453319-5ce911bafcde'),
  img('arch-07', 'Architecture / Space', ['airy', 'open', 'light'], { 'pop': 0.7, 'indie': 0.6, 'folk': 0.5 }, ['#ffffff', '#f5f5f5', '#e0e0e0'], '1488972685288-c3fd2e5db0a4'),
  img('arch-08', 'Architecture / Space', ['underground', 'enclosed', 'pressure'], { 'electronic': 0.8, 'hip-hop': 0.7, 'metal': 0.5 }, ['#1a1a1a', '#333333', '#616161'], '1517694712202-14dd9538aa97'),
  img('arch-09', 'Architecture / Space', ['retro', 'mid-century', 'warm'], { 'jazz': 0.8, 'rnb': 0.6, 'pop': 0.5 }, ['#ff8f00', '#ffb300', '#fff8e1'], '1495542779398-9fec7dc7986c'),
  img('arch-10', 'Architecture / Space', ['geometric', 'angular', 'bold'], { 'electronic': 0.7, 'rock': 0.5, 'ambient': 0.4 }, ['#0d47a1', '#1565c0', '#42a5f5'], '1500462918059-b1a0cb512f1d'),

  // ── Vintage / Film (10) ──
  img('vintage-01', 'Vintage / Film', ['nostalgic', 'grainy', 'warm'], { 'indie': 0.9, 'folk': 0.7, 'pop': 0.5 }, ['#d4a574', '#e8c79e', '#f5e6d3'], '1542038784456-1ea8e935640e'),
  img('vintage-02', 'Vintage / Film', ['retro', 'faded', 'dreamy'], { 'pop': 0.7, 'indie': 0.8, 'rnb': 0.5 }, ['#e1bee7', '#f8bbd0', '#ffe0b2'], '1558618666-fcd25c85f82e'),
  img('vintage-03', 'Vintage / Film', ['lo-fi', 'degraded', 'raw'], { 'hip-hop': 0.7, 'indie': 0.8, 'punk': 0.5 }, ['#ff6f00', '#ff8f00', '#f9a825'], '1509281373149-e957c6296406'),
  img('vintage-04', 'Vintage / Film', ['classic', 'timeless', 'smooth'], { 'jazz': 0.9, 'rnb': 0.7, 'classical': 0.5 }, ['#3e2723', '#4e342e', '#efebe9'], '1517142089942-ba376ce32a2e'),
  img('vintage-05', 'Vintage / Film', ['analog', 'tactile', 'crafted'], { 'electronic': 0.7, 'ambient': 0.6, 'indie': 0.8 }, ['#795548', '#a1887f', '#d7ccc8'], '1513151233558-d860c5398176'),
  img('vintage-06', 'Vintage / Film', ['cinematic', 'moody', 'narrative'], { 'indie': 0.8, 'folk': 0.6, 'ambient': 0.7 }, ['#37474f', '#546e7a', '#b0bec5'], '1485846234645-a62644f84728'),
  img('vintage-07', 'Vintage / Film', ['sun-bleached', 'summer', 'free'], { 'pop': 0.8, 'indie': 0.7, 'country': 0.6 }, ['#fff9c4', '#fff176', '#ffee58'], '1502444330042-d1a1ddf9bb5b'),
  img('vintage-08', 'Vintage / Film', ['glamorous', 'golden-age', 'rich'], { 'jazz': 0.8, 'pop': 0.6, 'rnb': 0.7 }, ['#ffd54f', '#ffe082', '#fff8e1'], '1470225620780-dba8ba36b745'),
  img('vintage-09', 'Vintage / Film', ['dark-room', 'intimate', 'shadowy'], { 'rnb': 0.8, 'jazz': 0.7, 'ambient': 0.6 }, ['#1a1a1a', '#424242', '#757575'], '1489599849927-2ee91cede3ba'),
  img('vintage-10', 'Vintage / Film', ['psychedelic', 'colorful', 'trippy'], { 'rock': 0.8, 'electronic': 0.7, 'indie': 0.6 }, ['#e040fb', '#7c4dff', '#448aff'], '1506792006437-256b665541e2'),

  // ── Color Fields (8) ──
  img('color-01', 'Color Fields', ['calm', 'gradient', 'minimal'], { 'ambient': 0.9, 'electronic': 0.5, 'classical': 0.4 }, ['#667eea', '#764ba2'], '1557682250583-56a2f92b2a16'),
  img('color-02', 'Color Fields', ['bold', 'saturated', 'electric'], { 'pop': 0.8, 'electronic': 0.7, 'reggaeton': 0.5 }, ['#ff6b6b', '#feca57', '#48dbfb'], '1550684376-efcbd6e3f031'),
  img('color-03', 'Color Fields', ['dark', 'monochrome', 'heavy'], { 'metal': 0.8, 'ambient': 0.6, 'electronic': 0.5 }, ['#0d0d0d', '#1a1a1a', '#333333'], '1553356084-58ef4a67b2a7'),
  img('color-04', 'Color Fields', ['warm', 'sunset', 'golden'], { 'folk': 0.7, 'pop': 0.6, 'country': 0.7 }, ['#ff6b35', '#f7c59f', '#efefd0'], '1496715976403-7e36dc43f17b'),
  img('color-05', 'Color Fields', ['cool', 'oceanic', 'deep'], { 'ambient': 0.8, 'electronic': 0.7, 'jazz': 0.4 }, ['#0077b6', '#00b4d8', '#90e0ef'], '1488415032211-f9e71152e06e'),
  img('color-06', 'Color Fields', ['pastel', 'soft', 'gentle'], { 'pop': 0.8, 'indie': 0.7, 'rnb': 0.5 }, ['#ffd6e0', '#c1d5e0', '#d5c6e0'], '1558591710-4b4a1ae0f04d'),
  img('color-07', 'Color Fields', ['neon', 'vivid', 'synthetic'], { 'electronic': 0.9, 'pop': 0.6, 'hip-hop': 0.5 }, ['#39ff14', '#ff073a', '#04d9ff'], '1550684376-efcbd6e3f031'),
  img('color-08', 'Color Fields', ['earthy', 'muted', 'organic'], { 'folk': 0.8, 'jazz': 0.6, 'country': 0.5 }, ['#a0826d', '#c4a882', '#e8d5b7'], '1523049673857-eb18f1d7b578'),

  // ── Dark / Moody (10) ──
  img('dark-01', 'Dark / Moody', ['shadowy', 'mysterious', 'noir'], { 'ambient': 0.8, 'electronic': 0.7, 'jazz': 0.6 }, ['#0d0d0d', '#1a1a1a', '#2d2d2d'], '1489599849927-2ee91cede3ba'),
  img('dark-02', 'Dark / Moody', ['candlelit', 'intimate', 'sacred'], { 'folk': 0.7, 'classical': 0.8, 'ambient': 0.7 }, ['#1a0a00', '#3e1f00', '#ff6f00'], '1473177104440-ffee2f376098'),
  img('dark-03', 'Dark / Moody', ['foggy', 'liminal', 'unsettling'], { 'ambient': 0.9, 'metal': 0.5, 'electronic': 0.6 }, ['#263238', '#37474f', '#546e7a'], '1516146544006-2e5b0e94fcca'),
  img('dark-04', 'Dark / Moody', ['dead', 'beautiful', 'decayed'], { 'indie': 0.7, 'folk': 0.6, 'ambient': 0.8 }, ['#3e2723', '#4e342e', '#795548'], '1490750967868-88aa4f44baee'),
  img('dark-05', 'Dark / Moody', ['cold', 'stark', 'winter'], { 'ambient': 0.8, 'classical': 0.7, 'metal': 0.5 }, ['#eceff1', '#cfd8dc', '#90a4ae'], '1457269449834-928af64c684d'),
  img('dark-06', 'Dark / Moody', ['deep-water', 'submerged', 'pressure'], { 'electronic': 0.8, 'ambient': 0.9, 'hip-hop': 0.4 }, ['#01579b', '#0277bd', '#0288d1'], '1518837695005-2083093ee35b'),
  img('dark-07', 'Dark / Moody', ['volcanic', 'smoldering', 'primal'], { 'metal': 0.9, 'rock': 0.8, 'electronic': 0.5 }, ['#bf360c', '#e64a19', '#ff6e40'], '1501041449506-8a3789e9f25a'),
  img('dark-08', 'Dark / Moody', ['lunar', 'ethereal', 'otherworldly'], { 'ambient': 0.9, 'electronic': 0.7, 'classical': 0.5 }, ['#0a0a2e', '#1a1a4e', '#4a4a8a'], '1446776811953-b23d57bd21aa'),
  img('dark-09', 'Dark / Moody', ['velvet', 'luxurious', 'dark'], { 'rnb': 0.9, 'jazz': 0.7, 'hip-hop': 0.5 }, ['#1a0a2e', '#2d1b4e', '#4a2d8a'], '1504893524553-b855bce32c67'),
  img('dark-10', 'Dark / Moody', ['silent', 'empty', 'desolate'], { 'ambient': 0.9, 'folk': 0.5, 'metal': 0.4 }, ['#212121', '#424242', '#616161'], '1508739773434-c26b3d09e071'),
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
