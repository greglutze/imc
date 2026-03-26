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
    suno_prompt: '[Genres: Neoclassical Electronic, Cinematic Ambient, Art Pop] [Moods: Ethereal Wonder, Fragile Beauty, Quiet Devastation, Emerging Light] [Instrumentation: Solo Piano through granular synthesis, String Ensemble with close mics, Breakbeat Drums entering at midpoint, Sub-Bass Swells — no guitar, no EDM synths, no trap hi-hats] [Tempo: 122–126 BPM, half-time feel in verses — played not quantized] [Vocal Style: No vocals — purely instrumental opening statement] [Production: Concert hall into club — spacious reverb, stereo width, room mics on everything, tape saturation on the piano, sidechain compression on the strings] [Structure: Solo piano intro, granular shimmer build, string entrance, breakbeat drop, layered crescendo, stripped outro] [Sound Design: A concert hall with the walls dissolving — piano notes fragment and scatter, strings breathe like living things, drums arrive like a heartbeat you forgot you had]',
    udio_prompt: 'An opening statement that blends a solo piano figure — processed through granular synthesis so the notes shimmer and fragment — with slowly building string arrangements. At the 1-minute mark, breakbeat drums enter beneath, creating tension between classical beauty and urban rhythm. The production is spacious and cinematic, heavy on reverb and stereo width.',
    structure: '[Intro] [Build] [Drop] [Verse] [Chorus] [Outro]',
    notes: 'Opening track — establish the sonic world. Start acoustic, end electronic. The "drop" should feel like stepping from a concert hall into a club.',
  },
  {
    track_number: 2,
    title: 'Collapse / Rebuild',
    suno_prompt: '[Genres: Post-Dubstep, Neoclassical, UK Electronic, Dark Pop] [Moods: Haunted Longing, Driving Urgency, Ghost-Touched Intimacy, Defiant Vulnerability] [Instrumentation: Solo Violin melody, Sub-Bass with weight, Two-Step Garage Drums, Chopped Vocal Samples pitched and scattered, Reverb-Soaked Piano stabs — no acoustic guitar, no standard pop synths, no 808] [Tempo: 128–132 BPM, two-step shuffle — human swing not programmed] [Vocal Style: Single intimate male lead — whispered verses building to exposed, cracking chorus delivery, vocal chops as texture not melody] [Production: Burial meets orchestra — tape-degraded vocal samples, vinyl crackle in transitions, room-mic strings, sub-bass you feel in your chest, sidechain pumping on pads] [Structure: Atmospheric intro, whispered verse, pre-chorus swell, two-step chorus, stripped piano bridge, full-production final chorus, fading crackle] [Sound Design: A rain-soaked London street at 3am — bass vibrates through concrete, violin echoes off wet walls, chopped voices drift past like strangers]',
    udio_prompt: 'A driving two-step beat underpins a melancholic violin melody. Sub-bass pulses beneath, creating physical weight. Vocal samples — chopped and pitched — weave through the arrangement like ghosts. The production references Burial\'s textural approach but with live orchestral elements replacing the garage samples. Dark, propulsive, emotional.',
    structure: '[Intro] [Verse] [Pre-Chorus] [Chorus] [Verse] [Chorus] [Bridge] [Chorus] [Outro]',
    notes: 'The single candidate. Most accessible track — clear verse/chorus structure. The bridge should strip to just piano and voice before the final chorus hits with full production.',
  },
  {
    track_number: 3,
    title: 'Interlude: Rain on Concrete',
    suno_prompt: '[Genres: Ambient, Modern Classical, Lo-Fi Minimalism] [Moods: Solitary Contemplation, Tender Grief, Rain-Washed Stillness] [Instrumentation: Solo Upright Piano with close mics capturing pedal and key noise, Field Recordings of rain on concrete and room tone — no drums, no bass, no electronics, no synths] [Tempo: 88–92 BPM, rubato — breath-paced not metronomic] [Vocal Style: No vocals — the piano breathes for itself] [Production: Intimate and imperfect — close microphones capturing the mechanical life of the instrument, tape hiss as warmth, lo-fi saturation, room sound left in, no compression] [Structure: Single unbroken movement — rain fades in, piano enters, rain fades out] [Sound Design: Sitting alone at a piano in an empty room while it rains outside — you can hear the pedal creak, the felt on strings, the rain hitting the window]',
    udio_prompt: 'A solo piano piece recorded with close microphones, capturing the mechanical sounds of the instrument — pedal clicks, key noise, breathing. Field recordings of rain on concrete blend with the piano. Tape saturation adds warmth. No drums, no bass — just the instrument and its environment. A moment of stillness.',
    structure: '[Intro] [Movement] [Outro]',
    notes: 'Palate cleanser. Keep under 2 minutes. The field recordings should feel like you\'re in the room.',
  },
  {
    track_number: 4,
    title: 'Fracture Lines',
    suno_prompt: '[Genres: IDM, Orchestral Electronic, Dark Cinematic, Glitch] [Moods: Controlled Rage, Fracturing Composure, Cathartic Destruction, Sudden Void] [Instrumentation: Cello Drones layered and distorted, Glitchy Breakbeat Drums with increasing complexity, Distorted Sub-Bass hits, Granular Piano debris, Metallic Percussion — no clean synths, no pop structure, no gentle anything] [Tempo: 134–138 BPM, breakbeat patterns accelerating — precision chaos not random] [Vocal Style: No clean vocals — processed vocal fragments as texture, guttural low harmonics buried in the mix] [Production: Amon Tobin meets Max Richter — classical and electronic fully fused not layered, bit-crushed cello, acoustic drums through distortion, sub-bass that rattles speakers, crescendo to overwhelming then instant silence] [Structure: Cello drone intro, breakbeat entrance, escalating glitch build, first drop, second build, overwhelming climax drop, abrupt silence] [Sound Design: A pressure cooker of sound — cello screams through distortion, drums fracture into shrapnel, bass hits like physical impact, then nothing — absolute void]',
    udio_prompt: 'The most intense track on the EP. Cello drones build beneath increasingly complex and glitchy breakbeat patterns. The tempo is faster, the energy more aggressive. Distorted bass hits punctuate the arrangement. Think Amon Tobin meets Max Richter — the classical and electronic elements are fully fused, not layered. Build to an overwhelming crescendo that suddenly cuts to silence.',
    structure: '[Intro] [Build] [Verse] [Drop] [Build] [Drop] [Break] [Final Drop] [Silence]',
    notes: 'Peak energy moment. The "drops" should feel physical. The final silence after the crescendo is as important as the noise.',
  },
  {
    track_number: 5,
    title: 'Eulogy for the Living',
    suno_prompt: '[Genres: Neoclassical, Ambient Pop, Post-Minimalism, Orchestral Electronic] [Moods: Bittersweet Hope, Sunrise After Storm, Tender Resolution, Unfinished Healing] [Instrumentation: Piano in F major warm and open, String Quartet with room mics, Gentle Electronic Beats — brushed and light, Synth Pads as warmth not melody, Celesta accents — no heavy drums, no distortion, no darkness] [Tempo: 116–120 BPM, gentle pulse — heartbeat at rest] [Vocal Style: Single raw male lead — open and vulnerable, no processing, no doubles, the most exposed vocal on the EP, occasional breath audible] [Production: Morning light in sound — warm tape saturation, wide stereo strings, piano with sustain pedal ringing, beats that suggest rhythm without demanding it, everything breathing and unhurried] [Structure: Piano intro in F major, gentle vocal verse, strings enter chorus, second verse with beats, full warm chorus, extended outro stripping to solo piano] [Sound Design: First light through curtains — everything warm and golden, strings float like dust motes in sunlight, piano rings with hope it almost believes in]',
    udio_prompt: 'A warm resolution after the intensity of Fracture Lines. Piano and string quartet play in F major — the first major key on the EP. Gentle electronic beats emerge but never dominate. Synth pads add warmth. The vocal (if used) should be at its most open and vulnerable. This is the sunrise after the storm — bittersweet, hopeful, unresolved.',
    structure: '[Intro] [Verse] [Chorus] [Verse] [Chorus] [Extended Outro]',
    notes: 'Closing track. The extended outro should gradually strip away elements until only the piano remains, mirroring the opening of Track 1 but in a major key.',
  },
  {
    track_number: 6,
    title: 'MMe. (Title Track)',
    suno_prompt: '[Genres: Neoclassical Electronic, Art Rock, Cinematic Pop, Orchestral Breakbeat] [Moods: Epic Vulnerability, Cathedral Intimacy, Defiant Beauty, Emotional Thesis] [Instrumentation: Full String Section with brass hints, Breakbeat Drums with live room sound, Granular Piano from Track 1 returning, Sub-Bass as foundation, Field Recording textures woven throughout — no simple pop production, no standard synths] [Tempo: 124–128 BPM, half-time verses into full-time chorus — dynamic shift not gradual] [Vocal Style: Single male lead — hushed cathedral whisper in verses erupting to full soaring delivery in chorus, spoken-word bridge passage, raw and unprocessed] [Production: The biggest room you have ever been in — every element from the EP converges, orchestral reverb tails, breakbeat energy, sub-bass weight, field recordings as transitions, production that sounds like it was recorded in a cathedral the size of a city] [Structure: Atmospheric intro with field recordings, whispered verse, explosive pre-chorus, full orchestral-breakbeat chorus, second verse, bridge with spoken word over stripped piano, final chorus with everything, fading hum] [Sound Design: Standing in the center of everything you have ever felt — orchestra surrounds you, drums pulse through the floor, voice raw and close like a confession, brass cuts through like dawn breaking]',
    udio_prompt: 'The definitive statement of the MMe. project. Full orchestral arrangement — strings, hints of brass — combined with the breakbeat production palette established across the EP. This track brings together every element: the granular piano, the two-step rhythms, the sub-bass, the field recordings. The vocal delivers the project\'s emotional thesis. Production should feel like the biggest room you\'ve ever been in.',
    structure: '[Intro] [Verse] [Pre-Chorus] [Chorus] [Verse] [Chorus] [Bridge] [Final Chorus] [Outro]',
    notes: 'The centerpiece. If the EP is a film, this is the climax. Consider placing this as Track 4 or 5 in final sequencing rather than at the end.',
  },
  {
    track_number: 7,
    title: 'Coda: What Remains',
    suno_prompt: '[Genres: Ambient, Modern Classical, Drone, Minimalism] [Moods: Fading Memory, Gentle Dissolution, Ending as Beginning, Quiet Acceptance] [Instrumentation: Solo Violin with extreme reverb, Solo Cello in tender register, Faint echoes of earlier tracks buried in reverb tails — no drums, no bass, no electronics, no piano] [Tempo: 78–82 BPM, rubato — dissolving not metered] [Vocal Style: No vocals — strings speak alone] [Production: Vast empty space — heavy reverb creating cathedral-scale room, strings recorded close then sent into infinite decay, ghost fragments of earlier tracks appearing and disappearing in the reverb, gradual fade to nothing] [Structure: Single unbroken movement — violin enters alone, cello joins, echoes appear, everything fades] [Sound Design: Music walking away from you down an endless hallway — strings grow distant, echoes of the whole EP drift past like memories, silence arrives not as absence but as resolution]',
    udio_prompt: 'A brief, delicate coda. Solo string phrases — possibly just violin and cello — played with extreme tenderness. Heavy reverb creates a sense of vast, empty space. Elements from earlier tracks appear as faint echoes in the reverb tails. The piece fades gradually, as if the music is walking away from you down a long hallway.',
    structure: '[Single Movement]',
    notes: 'Hidden track / album closer. Under 90 seconds. Should feel like an ending and a beginning simultaneously.',
  },
  {
    track_number: 8,
    title: 'Collapse / Rebuild (Club Edit)',
    suno_prompt: '[Genres: UK Garage, Neoclassical Club, Post-Dubstep, Breakbeat] [Moods: Physical Release, Dark Euphoria, Dancefloor Catharsis, Peak-Time Energy] [Instrumentation: Heavy Kick Drum with sub-weight, Prominent Sub-Bass dominating the low end, Filtered Orchestral Stabs, Two-Step Breakbeat Drums heavier than album version, Processed Violin riffs as hooks — no acoustic elements unprocessed, no gentle passages] [Tempo: 130–134 BPM, driving two-step — relentless not laid back] [Vocal Style: Chopped vocal fragments only — no full vocal, pitched and scattered, used as rhythmic texture and euphoric lifts] [Production: Club system optimized — extended 32-bar intro for DJ mixing, heavier low-end than album version, orchestral elements filtered for club speakers, sidechain compression on everything, breakdown that builds physical tension before the drop, 6-7 minute runtime] [Structure: Extended DJ intro, filtered build, first drop with full sub, breakdown, vocal chop verse, tension build, main drop with everything, second breakdown, final peak drop, extended DJ outro] [Sound Design: 3am in a concrete basement — sub-bass vibrates your ribs, filtered strings cut through smoke and strobe, two-step drums make your body move before your brain catches up, the orchestra reimagined as a weapon of euphoria]',
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
