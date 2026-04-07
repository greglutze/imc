/**
 * Art & Graphic Design movement taxonomy.
 * Used by the Visual Engine to match an artist's concept (genre, mood, creative direction)
 * to relevant art/design movements, which then influence typography recs, image prompts,
 * color direction, and overall visual identity.
 *
 * RULE: No promptFragment or any prompt-facing text may reference a real artist or band.
 */

export interface ArtMovement {
  id: string;
  name: string;
  era: string;
  category: string;
  description: string;
  keywords: string[];
  typeFamilies: {
    display: string;
    body: string;
    direction: string;
    /** Google Font family name for display preview (null = use system font) */
    displayGoogleFont: string | null;
    /** Google Font family name for body preview (null = use system font) */
    bodyGoogleFont: string | null;
  };
  colorDirection: string;
  /** Injected into image prompts — MUST NOT contain artist/band names */
  promptFragment: string;
  genreAffinities: string[];
  moodAffinities: string[];
}

// ────────────────────────────────────────────
// Full catalogue
// ────────────────────────────────────────────

export const ART_MOVEMENTS: ArtMovement[] = [
  {
    id: 'swiss',
    name: 'Swiss / International Typographic Style',
    era: '1950s–60s',
    category: 'Graphic Design',
    description: 'Grid-based layouts, sans-serif type (Helvetica, Akzidenz-Grotesk), asymmetric compositions, objective photography over illustration.',
    keywords: ['grid systems', 'Helvetica', 'whitespace', 'objectivity', 'Müller-Brockmann'],
    typeFamilies: {
      display: 'Helvetica Neue / Akzidenz-Grotesk',
      body: 'Univers / Aktiv Grotesk',
      direction: 'Strict grid alignment, generous whitespace. Mathematical precision in hierarchy. Neutral, objective typography.',
      displayGoogleFont: 'DM Sans',
      bodyGoogleFont: 'Inter',
    },
    colorDirection: 'Limited, purposeful palette. Often black + one accent color. Clean and functional.',
    promptFragment: 'Swiss international style, grid-based composition, objective photography, clean modernist layout, Helvetica-era precision',
    genreAffinities: ['electronic', 'techno', 'minimal', 'ambient', 'house'],
    moodAffinities: ['clean', 'precise', 'minimal', 'structured', 'refined', 'modern'],
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    era: '1919–1933',
    category: 'Graphic Design',
    description: 'Form follows function. Primary colors, geometric shapes, unity of fine art and craft. Typography as visual element.',
    keywords: ['geometric', 'primary colors', 'functionalism', 'Herbert Bayer', 'sans-serif'],
    typeFamilies: {
      display: 'Futura / ITC Avant Garde',
      body: 'DIN / Neuzeit',
      direction: 'Geometric sans-serif, universal forms. Type as architecture. Primary color accents on functional layouts.',
      displayGoogleFont: 'Jost',
      bodyGoogleFont: 'DM Sans',
    },
    colorDirection: 'Primary colors (red, yellow, blue) on white/black. Bold, unambiguous.',
    promptFragment: 'Bauhaus design, geometric shapes, primary colors, functional composition, universal typography as visual element',
    genreAffinities: ['electronic', 'synth-pop', 'industrial', 'techno'],
    moodAffinities: ['geometric', 'bold', 'structured', 'functional', 'primary', 'clean'],
  },
  {
    id: 'art-nouveau',
    name: 'Art Nouveau',
    era: '1890–1910',
    category: 'Fine Art / Design',
    description: 'Organic, flowing lines inspired by natural forms. Ornamental, feminine, whiplash curves. Alphonse Mucha\'s poster work is canonical.',
    keywords: ['organic curves', 'floral', 'ornamental', 'Mucha', 'decorative'],
    typeFamilies: {
      display: 'Arnold Böcklin / Eckmann',
      body: 'Garamond / Cormorant',
      direction: 'Decorative display type with organic, flowing serifs. Ornamental flourishes. Body in elegant traditional serif.',
      displayGoogleFont: 'Cormorant Garamond',
      bodyGoogleFont: 'Cormorant',
    },
    colorDirection: 'Muted golds, sage greens, dusty roses. Natural tones with metallic accents.',
    promptFragment: 'Art Nouveau style, flowing organic lines, floral ornament, decorative borders, whiplash curves, natural forms',
    genreAffinities: ['folk', 'indie-folk', 'dream-pop', 'chamber-pop', 'classical'],
    moodAffinities: ['organic', 'flowing', 'lush', 'ornate', 'romantic', 'dreamy', 'elegant'],
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    era: '1920s–30s',
    category: 'Fine Art / Design',
    description: 'Geometric luxury. Bold symmetry, gold and black palettes, streamlined forms, chevrons and sunbursts. Modernity as glamour.',
    keywords: ['geometric', 'luxury', 'symmetry', 'gold', 'bold type'],
    typeFamilies: {
      display: 'Broadway / Poiret One / Parisian',
      body: 'Didot / Bodoni',
      direction: 'Tall, geometric display type with strong vertical emphasis. Gold on black. Luxurious high-contrast serifs for body.',
      displayGoogleFont: 'Poiret One',
      bodyGoogleFont: 'Bodoni Moda',
    },
    colorDirection: 'Gold, black, deep emerald, midnight blue. Opulent metallics.',
    promptFragment: 'Art Deco style, geometric symmetry, gold and black palette, streamlined luxury, chevron patterns, sunburst motifs',
    genreAffinities: ['jazz', 'soul', 'r&b', 'neo-soul', 'lounge'],
    moodAffinities: ['luxurious', 'glamorous', 'sophisticated', 'opulent', 'elegant', 'bold', 'classic'],
  },
  {
    id: 'constructivism',
    name: 'Constructivism',
    era: '1920s',
    category: 'Graphic Design',
    description: 'Soviet-born. Dynamic diagonal composition, red/black/white palette, bold sans-serif, photomontage. Art as political tool.',
    keywords: ['diagonal', 'red/black', 'photomontage', 'propaganda', 'Rodchenko'],
    typeFamilies: {
      display: 'Druk / Impact / Anton',
      body: 'PT Sans / Roboto Condensed',
      direction: 'Heavy condensed sans-serif, dynamic diagonals, extreme weight contrast. Agitprop energy. Red + black.',
      displayGoogleFont: 'Anton',
      bodyGoogleFont: 'PT Sans',
    },
    colorDirection: 'Red, black, white. High contrast, politically charged palette.',
    promptFragment: 'Constructivist style, dynamic diagonal composition, red and black palette, photomontage, bold propaganda typography',
    genreAffinities: ['hip-hop', 'punk', 'industrial', 'post-punk', 'rap'],
    moodAffinities: ['aggressive', 'bold', 'political', 'raw', 'powerful', 'intense', 'revolutionary'],
  },
  {
    id: 'de-stijl',
    name: 'De Stijl / Neoplasticism',
    era: '1917–1931',
    category: 'Fine Art / Design',
    description: 'Pure abstraction: primary colors only, horizontal and vertical lines, white/black/gray. Grids as spiritual geometry.',
    keywords: ['primary colors', 'grid', 'abstraction', 'Mondrian', 'minimalism'],
    typeFamilies: {
      display: 'Futura / Geometria',
      body: 'Gill Sans / Avenir',
      direction: 'Geometric sans with strict horizontal/vertical alignment. Primary color blocks as compositional elements.',
      displayGoogleFont: 'Jost',
      bodyGoogleFont: 'Nunito Sans',
    },
    colorDirection: 'Primary red, blue, yellow with black lines and white ground. Pure abstraction.',
    promptFragment: 'De Stijl style, grid of primary colors, geometric abstraction, horizontal and vertical lines only, neoplasticism',
    genreAffinities: ['electronic', 'minimal', 'ambient', 'experimental'],
    moodAffinities: ['minimal', 'abstract', 'geometric', 'pure', 'structured', 'balanced'],
  },
  {
    id: 'psychedelic',
    name: 'Psychedelic / Haight-Ashbury',
    era: '1960s–70s',
    category: 'Graphic Design',
    description: 'Distorted, melting letterforms. Saturated complementary colors, op-art patterns, spiritual symbols.',
    keywords: ['distorted type', 'neon', 'op-art', 'counterculture', 'poster art'],
    typeFamilies: {
      display: 'Custom distorted / Fillmore / Acid Grotesk',
      body: 'Cooper Black / Windsor',
      direction: 'Melting, distorted display type that pushes legibility. Saturated color fills. Organic, hand-drawn lettering.',
      displayGoogleFont: 'Bungee Shade',
      bodyGoogleFont: 'Fraunces',
    },
    colorDirection: 'Saturated complementary pairs: magenta + lime, orange + purple. Vibrating color interactions.',
    promptFragment: 'Psychedelic poster art, melting distorted typography, saturated complementary colors, op-art patterns, 1960s counterculture',
    genreAffinities: ['psychedelic-rock', 'indie', 'neo-psychedelia', 'shoegaze', 'jam-band'],
    moodAffinities: ['trippy', 'surreal', 'colorful', 'spiritual', 'experimental', 'vibrant', 'cosmic'],
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    era: '1955–1969',
    category: 'Fine Art',
    description: 'Consumer culture as canvas. Bold outlines, Ben-Day dots, flat color, irony. Screen prints and comic-book imagery.',
    keywords: ['bold outlines', 'Ben-Day dots', 'flat color', 'Warhol', 'irony'],
    typeFamilies: {
      display: 'Futura Bold / Trade Gothic / Compacta',
      body: 'Neue Haas Grotesk / Franklin Gothic',
      direction: 'Bold, punchy headlines. Comic-book lettering influences. Flat color fills with strong black outlines.',
      displayGoogleFont: 'Oswald',
      bodyGoogleFont: 'Source Sans 3',
    },
    colorDirection: 'Flat, saturated primaries + secondaries. CMYK printing palette. Bold, unapologetic.',
    promptFragment: 'Pop Art style, bold outlines, Ben-Day dots, flat saturated color, screen print aesthetic, comic-book inspired',
    genreAffinities: ['pop', 'synth-pop', 'new-wave', 'dance-pop', 'k-pop'],
    moodAffinities: ['fun', 'bold', 'ironic', 'playful', 'colorful', 'commercial', 'bright'],
  },
  {
    id: 'modernist',
    name: 'Modernist / Late Modernism',
    era: '1950s–80s',
    category: 'Graphic Design',
    description: 'Reduction to essentials. Clean grids, restrained palettes, rational layout. Corporate identity at its most refined.',
    keywords: ['rational', 'grid', 'corporate identity', 'clean'],
    typeFamilies: {
      display: 'Helvetica / Futura / Century Gothic',
      body: 'Garamond / Times New Roman',
      direction: 'Restrained elegance. Clear hierarchy through weight and scale, not decoration. Corporate polish.',
      displayGoogleFont: 'Libre Franklin',
      bodyGoogleFont: 'EB Garamond',
    },
    colorDirection: 'Restrained: black, white, one or two brand colors. Purposeful, no excess.',
    promptFragment: 'Modernist graphic design, clean grid layout, restrained color, corporate identity, rational composition',
    genreAffinities: ['jazz', 'classical', 'adult-contemporary', 'soft-rock'],
    moodAffinities: ['clean', 'refined', 'professional', 'restrained', 'sophisticated', 'classic', 'timeless'],
  },
  {
    id: 'postmodernism',
    name: 'Postmodernism',
    era: '1970s–90s',
    category: 'Graphic Design',
    description: 'Rules as fodder. Layered typography, historical pastiche, irony, clashing fonts and colors.',
    keywords: ['pastiche', 'layered', 'irony', 'rule-breaking', 'Cranbrook'],
    typeFamilies: {
      display: 'Emigre fonts / Template Gothic',
      body: 'Mrs Eaves / Filosofia',
      direction: 'Layered, overlapping type. Mix of historical and digital fonts. Deliberate dissonance and collage.',
      displayGoogleFont: 'Syne',
      bodyGoogleFont: 'Libre Baskerville',
    },
    colorDirection: 'Clashing, unexpected combinations. Historical palettes remixed. Nothing matches on purpose.',
    promptFragment: 'Postmodern graphic design, layered typography, historical pastiche, clashing fonts, ironic composition',
    genreAffinities: ['art-rock', 'post-punk', 'experimental', 'art-pop', 'new-wave'],
    moodAffinities: ['ironic', 'eclectic', 'layered', 'experimental', 'chaotic', 'playful', 'subversive'],
  },
  {
    id: 'deconstructivism',
    name: 'Deconstructivism',
    era: '1980s–90s',
    category: 'Design / Architecture',
    description: 'Fragmentation and dislocation. Type escapes the grid, visuals pulled apart. Grunge type and anti-design.',
    keywords: ['fragmented', 'anti-grid', 'grunge type', 'chaos'],
    typeFamilies: {
      display: 'Arbitrary / Keedy Sans',
      body: 'Any — deliberately mismatched',
      direction: 'Fragmented, overlapping, deliberately illegible. Type breaks free of the grid. Grunge textures.',
      displayGoogleFont: 'Syne',
      bodyGoogleFont: 'Space Mono',
    },
    colorDirection: 'Murky, desaturated with sudden high-contrast spikes. Photocopied feel.',
    promptFragment: 'Deconstructivist design, fragmented layout, grunge typography, anti-grid composition, collaged visual chaos',
    genreAffinities: ['grunge', 'noise-rock', 'post-hardcore', 'experimental', 'shoegaze'],
    moodAffinities: ['chaotic', 'fragmented', 'raw', 'angry', 'deconstructed', 'rebellious', 'intense'],
  },
  {
    id: 'memphis',
    name: 'Memphis Design',
    era: '1981–1988',
    category: 'Design',
    description: 'Anti-functionalist kitsch. Pastel + neon palette, geometric patterns (squiggles, dots, terrazzo), cartoonish forms. Deliberately tacky.',
    keywords: ['pastel', 'neon', 'squiggles', 'Sottsass', 'kitsch'],
    typeFamilies: {
      display: 'VAG Rounded / Poppins / Baloo',
      body: 'Karla / Nunito',
      direction: 'Rounded, playful type. Geometric patterns as backgrounds. Pastel + neon clashes. Deliberately over-designed.',
      displayGoogleFont: 'Poppins',
      bodyGoogleFont: 'Nunito',
    },
    colorDirection: 'Pastel pink, mint, lavender + neon accents. Terrazzo patterns. Deliberately clashing.',
    promptFragment: 'Memphis design style, pastel and neon palette, squiggles and terrazzo patterns, geometric kitsch, bold playful forms',
    genreAffinities: ['hyper-pop', 'bubblegum-pop', 'j-pop', 'disco', 'funk'],
    moodAffinities: ['playful', 'fun', 'colorful', 'quirky', 'bold', 'campy', 'retro', 'energetic'],
  },
  {
    id: 'brutalism-graphic',
    name: 'Brutalism (Graphic)',
    era: '2010s–present',
    category: 'Graphic Design',
    description: 'Raw exposure of structure. Visible grids, harsh borders, default web fonts, flat color, purposeful ugliness as aesthetic choice.',
    keywords: ['raw', 'exposed structure', 'default fonts', 'anti-pretty', 'high contrast'],
    typeFamilies: {
      display: 'Times New Roman / Arial / Courier (system defaults)',
      body: 'System default stack',
      direction: 'Default system fonts used deliberately. Raw HTML aesthetic. Visible grid structure. Anti-design as design.',
      displayGoogleFont: 'Courier Prime',
      bodyGoogleFont: null,
    },
    colorDirection: 'Black and white, with occasional single harsh accent. Raw, unpolished.',
    promptFragment: 'Graphic brutalism, raw exposed structure, harsh borders, system font aesthetic, anti-design, high contrast flat color',
    genreAffinities: ['punk', 'noise', 'industrial', 'hardcore', 'post-punk', 'experimental'],
    moodAffinities: ['raw', 'harsh', 'minimal', 'anti-pretty', 'confrontational', 'honest', 'stark'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    era: '2010s',
    category: 'Digital / Subculture',
    description: '80s/90s nostalgia distorted. Pastel purples and pinks, glitch, Roman busts, sunset gradients, retro tech. Irony and longing.',
    keywords: ['nostalgia', 'glitch', 'pastel purple/pink', 'retrowave', 'lo-fi'],
    typeFamilies: {
      display: 'VCR OSD Mono / Chrome-effect type',
      body: 'MS Gothic / Arial',
      direction: 'Retro digital fonts, mixed CJK + Latin scripts. Chrome and gradient text effects. VHS tracking lines.',
      displayGoogleFont: 'VT323',
      bodyGoogleFont: 'Share Tech Mono',
    },
    colorDirection: 'Pastel purple, pink, cyan. Sunset gradients. Digital decay colors.',
    promptFragment: 'Vaporwave aesthetic, pastel purple and pink, sunset gradients, Roman bust sculptures, retro tech, VHS glitch, 80s nostalgia',
    genreAffinities: ['vaporwave', 'lo-fi', 'synthwave', 'chillwave', 'future-funk'],
    moodAffinities: ['nostalgic', 'dreamy', 'melancholic', 'retro', 'hazy', 'lo-fi', 'ethereal'],
  },
  {
    id: 'brutalism-arch',
    name: 'Brutalism (Architecture-led)',
    era: '1950s–70s',
    category: 'Design',
    description: 'Raw concrete honesty. Exposed materials, monolithic mass, repetition, anti-ornament. Translated into design as heaviness and texture.',
    keywords: ['raw concrete', 'texture', 'heavy', 'monolithic', 'exposed'],
    typeFamilies: {
      display: 'Druk / Tusker Grotesk / Bebas Neue',
      body: 'Suisse Int\'l / Founders Grotesk',
      direction: 'Heavy, monolithic type. Condensed, all-caps. Raw texture. Concrete-like weight and mass.',
      displayGoogleFont: 'Bebas Neue',
      bodyGoogleFont: 'DM Sans',
    },
    colorDirection: 'Concrete gray, charcoal, slate. Occasional warm ochre. Monochromatic and heavy.',
    promptFragment: 'Brutalist architecture aesthetic, raw concrete texture, monolithic forms, anti-ornament, heavy geometric mass',
    genreAffinities: ['industrial', 'post-punk', 'dark-wave', 'trip-hop', 'drone'],
    moodAffinities: ['heavy', 'dark', 'monolithic', 'raw', 'industrial', 'cold', 'imposing'],
  },
  {
    id: 'surrealism',
    name: 'Surrealism',
    era: '1920s–50s',
    category: 'Fine Art',
    description: 'Dreamscapes. Unexpected juxtapositions, hyper-realistic rendering of impossible scenes. Melting clocks and bowler hats.',
    keywords: ['dreamlike', 'juxtaposition', 'hyper-realism', 'Dalí', 'Magritte'],
    typeFamilies: {
      display: 'Playfair Display / Caslon / Baskerville',
      body: 'Garamond / EB Garamond',
      direction: 'Classical serif in surreal contexts. Elegant type that contradicts dreamlike imagery. Formal meets unconscious.',
      displayGoogleFont: 'Playfair Display',
      bodyGoogleFont: 'EB Garamond',
    },
    colorDirection: 'Hyper-real, uncanny. Desert earth tones, impossibly blue skies, flesh tones. Photographic realism.',
    promptFragment: 'Surrealist art, dreamscape, unexpected juxtapositions, hyper-realistic impossible scenes, melting forms, uncanny imagery',
    genreAffinities: ['art-rock', 'progressive', 'experimental', 'dream-pop', 'psychedelic'],
    moodAffinities: ['surreal', 'dreamlike', 'strange', 'mysterious', 'subconscious', 'fantastical', 'otherworldly'],
  },
  {
    id: 'expressionism',
    name: 'Expressionism / Neo-Expressionism',
    era: '1905s / 1970s–80s',
    category: 'Fine Art',
    description: 'Emotion over depiction. Distorted figures, violent brushwork, raw color. Crown motifs and visceral mark-making.',
    keywords: ['raw emotion', 'distortion', 'painterly', 'visceral'],
    typeFamilies: {
      display: 'Hand-painted / Crown motif / Knockout',
      body: 'Libre Baskerville / Charter',
      direction: 'Hand-drawn, raw, imperfect lettering. Crown symbols. Scratched, spray-painted aesthetic. Visceral mark-making.',
      displayGoogleFont: 'Permanent Marker',
      bodyGoogleFont: 'Libre Baskerville',
    },
    colorDirection: 'Raw, violent color. Heavy blacks, blood reds, cadmium yellow. Unblended, emotional.',
    promptFragment: 'Expressionist art, raw emotional brushwork, distorted figures, visceral mark-making, violent color, crown motifs',
    genreAffinities: ['hip-hop', 'punk', 'post-punk', 'noise-rock', 'rap', 'trap'],
    moodAffinities: ['raw', 'emotional', 'visceral', 'angry', 'passionate', 'intense', 'violent', 'expressive'],
  },
  {
    id: 'minimalism',
    name: 'Minimalism',
    era: '1960s–present',
    category: 'Fine Art / Design',
    description: 'Nothing extra. Monochrome or near-monochrome, geometric form, negative space as protagonist.',
    keywords: ['reduction', 'negative space', 'monochrome', 'geometric', 'stillness'],
    typeFamilies: {
      display: 'Söhne / Suisse Int\'l / Untitled Sans',
      body: 'Inter / iA Writer Mono',
      direction: 'Ultra-clean contemporary sans. Maximum whitespace. Type at extremes: very large or very small. Nothing decorative.',
      displayGoogleFont: 'Inter',
      bodyGoogleFont: 'JetBrains Mono',
    },
    colorDirection: 'Monochrome: black, white, one gray. Or single-color studies. Maximum restraint.',
    promptFragment: 'Minimalist art, monochrome, geometric form, negative space, reduction to essentials, pure visual silence',
    genreAffinities: ['ambient', 'minimal', 'classical', 'electronic', 'post-rock'],
    moodAffinities: ['minimal', 'quiet', 'still', 'contemplative', 'sparse', 'serene', 'meditative', 'calm'],
  },
  {
    id: 'risograph',
    name: 'Risograph / Riso Print Aesthetic',
    era: '2010s–present',
    category: 'Graphic Design',
    description: 'Limited-color offset printing feel. Deliberate misregistration, grain, flat color overlap creating new hues. Analog warmth via digital.',
    keywords: ['grain', 'misregistration', 'flat color', 'limited palette', 'analog'],
    typeFamilies: {
      display: 'Whyte / Pangram fonts / GT Walsheim',
      body: 'Atkinson Hyperlegible / Work Sans',
      direction: 'Contemporary indie type. Flat color fills, deliberate print misregistration. Two-color overlay effects.',
      displayGoogleFont: 'Space Grotesk',
      bodyGoogleFont: 'Work Sans',
    },
    colorDirection: 'Two or three spot colors that overlap: coral + blue → purple. Grain texture. Paper-white ground.',
    promptFragment: 'Risograph print aesthetic, limited color offset printing, misregistration, grain texture, flat color overlaps, analog warmth',
    genreAffinities: ['indie', 'indie-pop', 'bedroom-pop', 'folk', 'lo-fi'],
    moodAffinities: ['warm', 'analog', 'handmade', 'indie', 'tactile', 'organic', 'lo-fi', 'cozy'],
  },
  {
    id: 'wabi-sabi',
    name: 'Wabi-Sabi / Japanese Aesthetic',
    era: 'Traditional–present',
    category: 'Fine Art / Design',
    description: 'Beauty in imperfection and transience. Asymmetry, roughness, emptiness. Ink wash, natural materials, restraint.',
    keywords: ['imperfection', 'asymmetry', 'emptiness', 'wabi-sabi', 'ink wash'],
    typeFamilies: {
      display: 'Noto Serif JP / Shippori Mincho',
      body: 'Noto Sans / Source Han Sans',
      direction: 'Japanese-influenced restraint. Extreme whitespace, asymmetric placement. Brush-stroke quality. Less is reverence.',
      displayGoogleFont: 'Noto Serif JP',
      bodyGoogleFont: 'Noto Sans JP',
    },
    colorDirection: 'Earth tones, ink black, paper white. Washed-out, faded. Natural material colors.',
    promptFragment: 'Wabi-sabi aesthetic, beauty in imperfection, ink wash painting, asymmetry, natural materials, Japanese minimalism',
    genreAffinities: ['ambient', 'lo-fi', 'jazz', 'classical', 'world'],
    moodAffinities: ['peaceful', 'contemplative', 'imperfect', 'natural', 'quiet', 'empty', 'serene', 'intimate'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Aesthetic',
    era: '1980s–present',
    category: 'Digital / Subculture',
    description: 'High tech, low life. Neon on black, rain-slick streets, kanji and latin mixed, glitch and scan lines, chrome and decay.',
    keywords: ['neon', 'glitch', 'dark', 'chrome', 'urban'],
    typeFamilies: {
      display: 'Orbitron / Rajdhani',
      body: 'Share Tech Mono / Fira Code',
      direction: 'Monospaced tech fonts, neon glow effects, mixed CJK + Latin scripts. Terminal aesthetic with chrome gradients.',
      displayGoogleFont: 'Orbitron',
      bodyGoogleFont: 'Fira Code',
    },
    colorDirection: 'Neon cyan, magenta, electric blue on black. Chrome highlights. Rain-reflected light.',
    promptFragment: 'Cyberpunk aesthetic, neon lights on dark cityscape, rain-slick streets, holographic displays, chrome and decay',
    genreAffinities: ['cyberpunk', 'synthwave', 'industrial', 'drum-and-bass', 'dubstep', 'dark-electronic'],
    moodAffinities: ['dark', 'futuristic', 'dystopian', 'neon', 'gritty', 'urban', 'tech', 'nocturnal'],
  },
  {
    id: 'flat-design',
    name: 'Flat Design',
    era: '2010s',
    category: 'Digital / UX',
    description: 'No skeuomorphism. Pure 2D, solid color, clean iconography. Reaction against glass effects and faux textures.',
    keywords: ['2D', 'solid color', 'icon-driven', 'no shadows', 'Metro'],
    typeFamilies: {
      display: 'Segoe UI / San Francisco / Product Sans',
      body: 'Open Sans / Lato',
      direction: 'System UI fonts. Flat, solid color fields. Clean iconography. No gradients, shadows, or textures.',
      displayGoogleFont: 'Product Sans',
      bodyGoogleFont: 'Lato',
    },
    colorDirection: 'Solid, saturated blocks. Material design palette. Friendly, approachable colors.',
    promptFragment: 'Flat design style, solid color blocks, clean 2D illustration, no shadows or gradients, material design inspired',
    genreAffinities: ['pop', 'edm', 'dance-pop'],
    moodAffinities: ['clean', 'friendly', 'accessible', 'modern', 'bright', 'simple'],
  },
  {
    id: 'swiss-punk',
    name: 'Swiss Punk / Neue Grafik',
    era: '1970s–80s',
    category: 'Graphic Design',
    description: 'Swiss rigour meets punk energy. Tight grids subverted by photocopier texture, rubber stamps, hand lettering layered over systems.',
    keywords: ['grid + texture', 'photocopy', 'subversion', 'punk'],
    typeFamilies: {
      display: 'Helvetica (distressed) / OCR / Trixie',
      body: 'Akkurat / Helvetica',
      direction: 'Swiss grid foundation deliberately disrupted. Photocopied textures over clean type. Controlled chaos.',
      displayGoogleFont: 'Space Mono',
      bodyGoogleFont: 'Inter',
    },
    colorDirection: 'Black + fluorescent accents. Photocopier artifacts. Punk zine energy with Swiss bones.',
    promptFragment: 'Swiss Punk typography, grid subverted by photocopy texture, rubber stamps over clean sans-serif, controlled chaos',
    genreAffinities: ['punk', 'post-punk', 'noise-rock', 'hardcore', 'garage-rock'],
    moodAffinities: ['rebellious', 'raw', 'energetic', 'subversive', 'gritty', 'loud'],
  },
  {
    id: 'mid-century-modern',
    name: 'Mid-Century Modern',
    era: '1940s–60s',
    category: 'Design / Illustration',
    description: 'Optimism rendered in organic shapes. Atomic motifs, curves, earthy + turquoise palettes, playful illustration, teak everything.',
    keywords: ['atomic', 'organic curves', 'earthy', 'optimism'],
    typeFamilies: {
      display: 'Neutra / Proxima Nova / Century Modern',
      body: 'Bookman / Century Schoolbook',
      direction: 'Clean mid-century sans with warm personality. Organic curves in lettering. Earthy palette. Optimistic illustration.',
      displayGoogleFont: 'Josefin Sans',
      bodyGoogleFont: 'Libre Baskerville',
    },
    colorDirection: 'Turquoise, mustard, burnt orange, olive green, cream. Warm, optimistic earth tones.',
    promptFragment: 'Mid-century modern design, atomic age motifs, organic shapes, earthy turquoise palette, retro illustration, warm optimism',
    genreAffinities: ['jazz', 'bossa-nova', 'lounge', 'indie-pop', 'soul'],
    moodAffinities: ['warm', 'optimistic', 'retro', 'playful', 'organic', 'cozy', 'charming'],
  },
  {
    id: 'dark-academia',
    name: 'Dark Academia',
    era: '2010s–present',
    category: 'Digital / Subculture',
    description: 'Romanticized intellectualism. Sepia and forest green, classical art, serif type, candlelight texture, books-and-libraries imagery.',
    keywords: ['sepia', 'classical', 'serif', 'literary', 'candlelight'],
    typeFamilies: {
      display: 'EB Garamond / Cormorant / Playfair Display',
      body: 'Libre Baskerville / Source Serif Pro',
      direction: 'Classical serifs, literary feel. Sepia-toned. Old book typography. Candlelight warmth. Scholarly.',
      displayGoogleFont: 'Playfair Display',
      bodyGoogleFont: 'Source Serif 4',
    },
    colorDirection: 'Sepia, forest green, burgundy, aged cream. Candlelight warmth. Old library palette.',
    promptFragment: 'Dark academia aesthetic, sepia tones, classical art, old library, candlelight, literary atmosphere, forest green and burgundy',
    genreAffinities: ['classical', 'chamber-pop', 'folk', 'indie-folk', 'post-rock'],
    moodAffinities: ['melancholic', 'introspective', 'romantic', 'literary', 'moody', 'contemplative', 'dark', 'nostalgic'],
  },
  {
    id: 'suprematism',
    name: 'Suprematism',
    era: '1915–1925',
    category: 'Fine Art',
    description: 'Pure geometric abstraction: squares, circles, crosses. Black on white. Year zero of abstract art.',
    keywords: ['geometric', 'black on white', 'pure abstraction', 'reductive'],
    typeFamilies: {
      display: 'Futura / Geometria / Brandon Grotesque',
      body: 'Assistant / Jost',
      direction: 'Pure geometric forms. Floating elements on white ground. Type as geometric shape. Extreme reduction.',
      displayGoogleFont: 'Jost',
      bodyGoogleFont: 'Assistant',
    },
    colorDirection: 'Black, white, occasional red or yellow. Absolute reduction. White void.',
    promptFragment: 'Suprematist art, pure geometric abstraction, black square on white, floating forms, reductive composition',
    genreAffinities: ['minimal', 'ambient', 'experimental', 'classical'],
    moodAffinities: ['abstract', 'pure', 'minimal', 'stark', 'geometric', 'spiritual'],
  },
  {
    id: 'letterpress',
    name: 'Letterpress / Vernacular Print',
    era: 'Traditional / Revival 2000s',
    category: 'Graphic Design',
    description: 'Physical pressure of type into paper. Deep impression, ink spread, aged typefaces, off-white stock. Craft as authenticity signal.',
    keywords: ['impression', 'craft', 'aged type', 'texture', 'analogue'],
    typeFamilies: {
      display: 'Clarendon / Rockwell / Sentinel',
      body: 'Plantin / Mercury',
      direction: 'Slab serifs and wood type. Deep impression texture. Ink spread warmth. Aged, worn letterforms as character.',
      displayGoogleFont: 'Rokkitt',
      bodyGoogleFont: 'Lora',
    },
    colorDirection: 'Ink-dark colors on warm cream/kraft stock. Single-color printing. Aged, warm.',
    promptFragment: 'Letterpress printing aesthetic, deep impression in paper, aged typefaces, ink texture, craft and authenticity, off-white stock',
    genreAffinities: ['folk', 'americana', 'country', 'bluegrass', 'singer-songwriter'],
    moodAffinities: ['authentic', 'warm', 'handmade', 'vintage', 'craft', 'honest', 'earthy', 'rustic'],
  },
  {
    id: 'glitch-art',
    name: 'Glitch Art',
    era: '2000s–present',
    category: 'Digital',
    description: 'Error as medium. RGB channel separation, pixelation, databending, scan-line breaks. Malfunction aestheticized.',
    keywords: ['RGB shift', 'databending', 'pixel', 'error', 'digital decay'],
    typeFamilies: {
      display: 'Custom glitched / Neue Machina / Space Mono',
      body: 'IBM Plex Mono / Fira Mono',
      direction: 'Monospaced type with RGB channel separation. Pixel corruption effects. Scan-line interference on clean type.',
      displayGoogleFont: 'Space Mono',
      bodyGoogleFont: 'IBM Plex Mono',
    },
    colorDirection: 'RGB primary separation: cyan, magenta, green channels. Digital noise. Corrupted gradients.',
    promptFragment: 'Glitch art, RGB channel separation, pixelation, databending, scan-line breaks, digital corruption, error aesthetic',
    genreAffinities: ['glitch', 'electronic', 'idm', 'experimental', 'noise', 'hyperpop'],
    moodAffinities: ['glitchy', 'digital', 'chaotic', 'broken', 'experimental', 'tech', 'corrupted'],
  },
  {
    id: 'kawaii',
    name: 'Kawaii / Cute Japanese Design',
    era: '1970s–present',
    category: 'Design / Illustration',
    description: 'Softness as power. Pastel palettes, round forms, simplified faces, small features on large heads.',
    keywords: ['pastel', 'round forms', 'simplified', 'kawaii', 'playful'],
    typeFamilies: {
      display: 'Nunito / Quicksand / Fredoka One',
      body: 'Nunito Sans / M PLUS Rounded',
      direction: 'Extremely rounded, soft type. Pastel fills. Simplified, friendly letterforms. Everything curves.',
      displayGoogleFont: 'Quicksand',
      bodyGoogleFont: 'Nunito',
    },
    colorDirection: 'Soft pastels: baby pink, lavender, mint, butter yellow. Friendly and approachable.',
    promptFragment: 'Kawaii aesthetic, cute Japanese design, pastel palette, round soft forms, simplified faces, playful and friendly',
    genreAffinities: ['j-pop', 'k-pop', 'bubblegum-pop', 'city-pop'],
    moodAffinities: ['cute', 'playful', 'soft', 'friendly', 'sweet', 'innocent', 'light', 'happy'],
  },
  {
    id: 'lo-fi-zine',
    name: 'Lo-Fi / Zine Aesthetic',
    era: '1970s–present',
    category: 'Graphic Design',
    description: 'DIY production values as politics. Photocopied texture, cut-and-paste layout, typewriter text, imperfect alignment, intentional rawness.',
    keywords: ['DIY', 'photocopy', 'cut-and-paste', 'typewriter', 'raw'],
    typeFamilies: {
      display: 'Courier / American Typewriter / OCR-B',
      body: 'Typewriter fonts / Handwritten',
      direction: 'Typewriter type, hand-scrawled notes. Cut-and-paste collage. Photocopied degradation as texture. Deliberately imperfect.',
      displayGoogleFont: 'Special Elite',
      bodyGoogleFont: 'Courier Prime',
    },
    colorDirection: 'Black and white photocopied. Occasional highlighter accents. Kraft paper, newsprint.',
    promptFragment: 'Lo-fi zine aesthetic, DIY photocopy texture, cut-and-paste collage, typewriter text, punk rawness, imperfect alignment',
    genreAffinities: ['punk', 'indie', 'lo-fi', 'garage-rock', 'emo', 'hardcore'],
    moodAffinities: ['raw', 'DIY', 'authentic', 'underground', 'rebellious', 'intimate', 'honest', 'scrappy'],
  },
];


// ────────────────────────────────────────────
// Matching engine
// ────────────────────────────────────────────

export interface MatchedMovement {
  movement: ArtMovement;
  score: number;
  matchReasons: string[];
}

/**
 * Score movements against a concept and return top N matches.
 *
 * Weights:
 *  - Genre affinity:      +3
 *  - Mood keyword:        +2
 *  - Creative direction:  +1 per keyword hit
 */
export function matchMovements(
  concept: {
    genre_primary?: string;
    genre_secondary?: string[];
    mood_keywords?: string[];
    creative_direction?: string;
  },
  topN = 3,
): MatchedMovement[] {
  const genreTokens = tokenize([
    concept.genre_primary || '',
    ...(concept.genre_secondary || []),
  ].join(' '));

  const moodTokens = new Set(
    (concept.mood_keywords || []).map(w => w.toLowerCase().trim()),
  );

  const directionLower = (concept.creative_direction || '').toLowerCase();

  const scored: MatchedMovement[] = ART_MOVEMENTS.map(mov => {
    let score = 0;
    const reasons: string[] = [];

    for (const aff of mov.genreAffinities) {
      const affTokens = tokenize(aff);
      for (const tok of affTokens) {
        if (genreTokens.has(tok)) {
          score += 3;
          reasons.push(`genre: ${aff}`);
          break;
        }
      }
    }

    for (const aff of mov.moodAffinities) {
      if (moodTokens.has(aff)) {
        score += 2;
        reasons.push(`mood: ${aff}`);
      }
      for (const m of moodTokens) {
        if (m !== aff && (m.includes(aff) || aff.includes(m)) && m.length > 3) {
          score += 1;
          break;
        }
      }
    }

    if (directionLower.length > 0) {
      for (const kw of mov.keywords) {
        if (directionLower.includes(kw.toLowerCase())) {
          score += 1;
          reasons.push(`direction: "${kw}"`);
        }
      }
    }

    return { movement: mov, score, matchReasons: [...new Set(reasons)] };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/** Collect all unique Google Font families needed for a set of matched movements */
export function collectGoogleFonts(matches: MatchedMovement[]): string[] {
  const fonts = new Set<string>();
  for (const { movement } of matches) {
    if (movement.typeFamilies.displayGoogleFont) fonts.add(movement.typeFamilies.displayGoogleFont);
    if (movement.typeFamilies.bodyGoogleFont) fonts.add(movement.typeFamilies.bodyGoogleFont);
  }
  return [...fonts];
}

/** Build a Google Fonts <link> URL for a list of families */
export function buildGoogleFontsUrl(families: string[]): string {
  if (families.length === 0) return '';
  const params = families
    .map(f => `family=${encodeURIComponent(f)}:wght@400;500;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[\s/\-_,]+/).filter(w => w.length > 1),
  );
}
