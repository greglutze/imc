'use client';

import { useState, useCallback } from 'react';
import { Badge, Tabs } from '../../../../components/ui';
import StyleProfile from '../../../../components/StyleProfile';
import TrackPrompts from '../../../../components/TrackPrompts';
import type { I2StyleProfile, I2VocalistPersona, I2Track } from '../../../../lib/api';

/* ———————————————————————————————————————
   Demo data — matches the MMe. concept
   ——————————————————————————————————————— */

const DEMO_STYLE: I2StyleProfile = {
  production_aesthetic: 'Layered orchestral-electronic production with a cinematic scope. Piano and strings form the harmonic foundation, processed through granular synthesis, tape saturation, and spatial effects. Breakbeat and two-step rhythms provide kinetic energy beneath the classical elements. Heavy use of reverb tails, sidechain compression, and stereo field manipulation. The overall feel bridges late-night club energy with concert hall gravitas.',
  sonic_signatures: [
    'Piano runs through granular synthesis creating shimmering, fragmented textures',
    'String arrangements that morph into synth pads via crossfading and spectral processing',
    'Breakbeat patterns layered with acoustic percussion (brushed snares, rim clicks)',
    'Sub-bass as a counterweight to high-register violin lines',
    'Field recordings (rain, vinyl crackle, room tone) as transitional glue',
  ],
  tempo_range: '118–136 BPM',
  key_preferences: ['C minor', 'A minor', 'D minor', 'F major'],
};

const DEMO_VOCALIST: I2VocalistPersona = {
  vocal_character: 'Ethereal and intimate. A voice that sounds like it\'s confiding a secret in a cathedral — hushed intensity with occasional breaks into full, soaring delivery.',
  delivery_style: 'Primarily whispered and breathy in verses, building to sustained, emotive belting in choruses. Occasional spoken-word passages over stripped-back instrumental sections.',
  reference_vocalists: ['James Blake', 'Thom Yorke', 'Bon Iver (falsetto register)', 'Sampha'],
  tone_keywords: ['Haunting', 'Intimate', 'Fragile', 'Soaring', 'Melancholic'],
};

const DEMO_TRACKS: I2Track[] = [
  {
    track_number: 1,
    title: 'Overture in Glass',
    suno_prompt: 'neoclassical electronic, cinematic, 124 BPM, C minor, piano, strings, breakbeat drums, atmospheric, reverb-heavy, melancholic, building intensity, granular synthesis textures',
    udio_prompt: 'An opening statement that blends a solo piano figure — processed through granular synthesis so the notes shimmer and fragment — with slowly building string arrangements. At the 1-minute mark, breakbeat drums enter beneath, creating tension between classical beauty and urban rhythm. The production is spacious and cinematic, heavy on reverb and stereo width.',
    structure: '[Intro] [Build] [Drop] [Verse] [Chorus] [Outro]',
    notes: 'Opening track — establish the sonic world. Start acoustic, end electronic. The "drop" should feel like stepping from a concert hall into a club.',
  },
  {
    track_number: 2,
    title: 'Collapse / Rebuild',
    suno_prompt: 'post-dubstep, neoclassical, 130 BPM, A minor, sub-bass, violin, two-step drums, atmospheric vocal chops, dark, driving, emotional, UK electronic',
    udio_prompt: 'A driving two-step beat underpins a melancholic violin melody. Sub-bass pulses beneath, creating physical weight. Vocal samples — chopped and pitched — weave through the arrangement like ghosts. The production references Burial\'s textural approach but with live orchestral elements replacing the garage samples. Dark, propulsive, emotional.',
    structure: '[Intro] [Verse] [Pre-Chorus] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
    notes: 'The single candidate. Most accessible track — clear verse/chorus structure. The bridge should strip to just piano and voice before the final chorus hits with full production.',
  },
  {
    track_number: 3,
    title: 'Interlude: Rain on Concrete',
    suno_prompt: 'ambient, neoclassical, 90 BPM, D minor, solo piano, field recordings, rain sounds, minimal, intimate, contemplative, tape hiss, lo-fi warmth',
    udio_prompt: 'A solo piano piece recorded with close microphones, capturing the mechanical sounds of the instrument — pedal clicks, key noise, breathing. Field recordings of rain on concrete blend with the piano. Tape saturation adds warmth. No drums, no bass — just the instrument and its environment. A moment of stillness.',
    structure: '[Intro] [Movement] [Outro]',
    notes: 'Palate cleanser. Keep under 2 minutes. The field recordings should feel like you\'re in the room.',
  },
  {
    track_number: 4,
    title: 'Fracture Lines',
    suno_prompt: 'electronic, orchestral, 136 BPM, C minor, glitchy breakbeats, cello, distorted bass, crescendo, intense, cinematic, aggressive, IDM influenced',
    udio_prompt: 'The most intense track on the EP. Cello drones build beneath increasingly complex and glitchy breakbeat patterns. The tempo is faster, the energy more aggressive. Distorted bass hits punctuate the arrangement. Think Amon Tobin meets Max Richter — the classical and electronic elements are fully fused, not layered. Build to an overwhelming crescendo that suddenly cuts to silence.',
    structure: '[Intro] [Build] [Verse] [Drop] [Build] [Drop] [Break] [Final Drop] [Silence]',
    notes: 'Peak energy moment. The "drops" should feel physical. The final silence after the crescendo is as important as the noise.',
  },
  {
    track_number: 5,
    title: 'Eulogy for the Living',
    suno_prompt: 'neoclassical, ambient electronic, 118 BPM, F major, piano, strings quartet, gentle beats, hopeful, bittersweet, warm, sunrise feeling, synth pads',
    udio_prompt: 'A warm resolution after the intensity of Fracture Lines. Piano and string quartet play in F major — the first major key on the EP. Gentle electronic beats emerge but never dominate. Synth pads add warmth. The vocal (if used) should be at its most open and vulnerable. This is the sunrise after the storm — bittersweet, hopeful, unresolved.',
    structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Extended Outro]',
    notes: 'Closing track. The extended outro should gradually strip away elements until only the piano remains, mirroring the opening of Track 1 but in a major key.',
  },
  {
    track_number: 6,
    title: 'MMe. (Title Track)',
    suno_prompt: 'neoclassical electronic, 126 BPM, A minor, full orchestral, breakbeat, vocal, cinematic climax, epic, emotional peak, strings, brass hints, reverb, layered',
    udio_prompt: 'The definitive statement of the MMe. project. Full orchestral arrangement — strings, hints of brass — combined with the breakbeat production palette established across the EP. This track brings together every element: the granular piano, the two-step rhythms, the sub-bass, the field recordings. The vocal delivers the project\'s emotional thesis. Production should feel like the biggest room you\'ve ever been in.',
    structure: '[Intro] [Verse] [Pre-Chorus] [Chorus] [Verse] [Chorus] [Bridge] [Final Chorus] [Outro]',
    notes: 'The centerpiece. If the EP is a film, this is the climax. Consider placing this as Track 4 or 5 in final sequencing rather than at the end.',
  },
  {
    track_number: 7,
    title: 'Coda: What Remains',
    suno_prompt: 'ambient, minimal, neoclassical, 80 BPM, C minor, solo strings, reverb, fading, contemplative, ending, delicate, sparse',
    udio_prompt: 'A brief, delicate coda. Solo string phrases — possibly just violin and cello — played with extreme tenderness. Heavy reverb creates a sense of vast, empty space. Elements from earlier tracks appear as faint echoes in the reverb tails. The piece fades gradually, as if the music is walking away from you down a long hallway.',
    structure: '[Single Movement]',
    notes: 'Hidden track / album closer. Under 90 seconds. Should feel like an ending and a beginning simultaneously.',
  },
  {
    track_number: 8,
    title: 'Collapse / Rebuild (Club Edit)',
    suno_prompt: 'club mix, neoclassical electronic, 132 BPM, A minor, extended intro, heavier drums, sub-bass, dancefloor, DJ-friendly, breakbeat, driving, peak-time',
    udio_prompt: 'An extended, club-optimized version of Track 2. Longer intro for DJ mixing (32 bars). Heavier kick drum and more prominent sub-bass. The orchestral elements are still present but filtered and processed for club sound systems. Extended breakdown section that builds tension before the main drop. This version prioritizes physical impact and dancefloor utility over the album version\'s emotional nuance.',
    structure: '[Extended Intro] [Build] [Drop] [Break] [Verse] [Build] [Main Drop] [Break] [Final Drop] [Outro]',
    notes: 'Bonus / streaming extra. The club version that DJs can actually play. 6-7 minutes. Focus on the low end and rhythm.',
  },
];

/* ———————————————————————————————————————
   Prompts Page
   ——————————————————————————————————————— */

type I2View = 'style' | 'tracks';

export default function PromptsPage() {
  const [activeTab, setActiveTab] = useState<I2View>('style');
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const handleRegenerate = useCallback(async (trackNumber: number) => {
    setRegenerating(trackNumber);
    await new Promise(r => setTimeout(r, 2000));
    setRegenerating(null);
  }, []);

  const tabs = [
    { id: 'style', label: 'Style Profile' },
    { id: 'tracks', label: 'Tracks', count: DEMO_TRACKS.length },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Page header */}
      <div className="border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2">
              <span className="text-body">&#8592;</span>
              IMC
            </a>
            <span className="text-neutral-200">/</span>
            <a href="/projects/demo" className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast">
              MMe.
            </a>
            <span className="text-neutral-200">/</span>
            <span className="text-micro font-bold uppercase tracking-widest text-black">
              Prompts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="blue">Generating</Badge>
            <span className="text-micro font-mono text-neutral-300">
              Instrument 02
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as I2View)} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'style' && (
            <StyleProfile
              styleProfile={DEMO_STYLE}
              vocalistPersona={DEMO_VOCALIST}
            />
          )}

          {activeTab === 'tracks' && (
            <TrackPrompts
              tracks={DEMO_TRACKS}
              onRegenerateTrack={handleRegenerate}
              regenerating={regenerating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
