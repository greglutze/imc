'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, Badge } from '../../../components/ui';
import ConceptChat from '../../../components/ConceptChat';
import ResearchReport from '../../../components/ResearchReport';
import type { ConversationMessage, ProjectConcept, I1Report, I1Confidence } from '../../../lib/api';

/* ———————————————————————————————————————
   Demo data — used until auth is wired up.
   Once the API is connected, this file
   switches to real data seamlessly.
   ——————————————————————————————————————— */

const DEMO_CONCEPT: ProjectConcept = {
  genre_primary: 'Neoclassical Electronic',
  genre_secondary: ['Ambient', 'Post-Dubstep'],
  reference_artists: ['Ólafur Arnalds', 'The Prodigy', 'Burial', 'Nils Frahm'],
  creative_direction: 'Classical instruments processed through electronic production techniques. Piano and strings layered with breakbeats, sub-bass, and atmospheric textures. Cinematic but club-ready.',
  target_audience: '25-35 year old music enthusiasts who straddle indie/electronic scenes',
  mood_keywords: ['Melancholic', 'Driving', 'Atmospheric', 'Cinematic'],
  track_count: 8,
};

const DEMO_REPORT: I1Report = {
  market_overview: {
    genre_landscape: 'The neoclassical electronic space occupies a growing niche at the intersection of contemporary classical and electronic music. Artists like Ólafur Arnalds, Nils Frahm, and Kiasmos have demonstrated that orchestral elements can coexist with electronic production to create commercially viable, critically acclaimed work. The genre has seen steady growth in streaming numbers, fueled by playlist culture and the broader trend toward ambient and focus-oriented listening.',
    saturation_level: 'Low-Medium',
    growth_trend: 'Growing steadily',
    key_trends: [
      'Increasing crossover between classical training and electronic production tools',
      'Rise of "focus" and "study" playlists driving ambient-adjacent discovery',
      'Live performance blending acoustic instruments with real-time electronic processing',
      'Sync licensing demand for cinematic, emotionally rich instrumentals',
    ],
  },
  comparable_artists: [
    { name: 'Ólafur Arnalds', monthly_listeners: 3_200_000, relevance_score: 95, positioning_gap: 'More ambient and less beat-driven. MMe. can capture the energy gap with breakbeat elements.' },
    { name: 'Kiasmos', monthly_listeners: 1_800_000, relevance_score: 88, positioning_gap: 'Minimal techno + piano duo. MMe. can differentiate with fuller orchestration and wider dynamic range.' },
    { name: 'Nils Frahm', monthly_listeners: 2_100_000, relevance_score: 82, positioning_gap: 'Piano-centric, more acoustic. MMe. fills the gap with heavier electronic production.' },
    { name: 'Burial', monthly_listeners: 1_400_000, relevance_score: 74, positioning_gap: 'UK garage/dubstep influence. MMe. shares atmospheric DNA but adds classical instruments.' },
  ],
  audience_profile: {
    primary_age_range: '25–35',
    gender_split: '58% Male, 42% Female',
    top_markets: ['United Kingdom', 'Germany', 'United States', 'Netherlands', 'Iceland'],
    platforms: ['Spotify', 'Apple Music', 'Bandcamp', 'YouTube', 'SoundCloud'],
    psychographics: 'Design-conscious, culturally curious listeners. Value artistic integrity over commercial polish. Frequent independent cinema, art galleries, and boutique festivals like Melt! or Sónar.',
  },
  playlist_landscape: {
    target_playlists: [
      { name: 'Peaceful Piano', followers: 7_200_000, placement_difficulty: 'High' },
      { name: 'Electronic Concentration', followers: 2_100_000, placement_difficulty: 'Medium' },
      { name: 'Ambient Relaxation', followers: 3_500_000, placement_difficulty: 'Medium' },
      { name: 'Chillout Lounge', followers: 1_800_000, placement_difficulty: 'Low' },
      { name: 'Modern Classical', followers: 890_000, placement_difficulty: 'Low' },
    ],
    curator_patterns: 'Curators in this space prioritize production quality and emotional coherence over commercial metrics. Pitching with a clear narrative — the classical-meets-electronic angle — resonates well. Algorithmic playlists (Discover Weekly, Release Radar) perform strongly due to the genre\'s consistent audio features.',
  },
  sonic_blueprint: {
    bpm_range: '110–140',
    key_signatures: ['C minor', 'A minor', 'D minor', 'F major'],
    energy_profile: 'Builds from ambient foundations to driving peaks. Average energy 0.45–0.65.',
    production_style: 'Layered: acoustic core → electronic processing → spatial mixing. Heavy use of reverb, delay, sidechain compression.',
    sonic_signatures: [
      'Piano processed through granular synthesis and tape saturation',
      'String arrangements that dissolve into pad-like textures',
      'Breakbeat and two-step rhythms under orchestral elements',
      'Field recordings and found sound as transitional elements',
      'Sub-bass as a counterweight to high-register strings',
    ],
  },
  opportunities: [
    { gap: 'No dominant artist occupying the "symphonic breakbeat" crossover', market_score: 87, success_probability: 72 },
    { gap: 'Sync licensing demand for emotionally rich, beat-driven instrumentals', market_score: 91, success_probability: 68 },
    { gap: 'Festival circuit gap between classical stages and electronic tents', market_score: 74, success_probability: 55 },
  ],
  revenue_projections: {
    streaming: '$8K–15K/mo at 500K monthly listeners (12-month target)',
    touring: '$2K–5K per show, 30-show circuit in Year 1',
    merch: '$1K–3K/mo with limited-run vinyl and branded items',
    sync_licensing: '$5K–25K per placement — high potential for film/TV',
  },
  risk_assessment: [
    { risk: 'Niche genre may limit mainstream crossover potential', severity: 'Medium' },
    { risk: 'Dependence on playlist placement for initial discovery', severity: 'Medium' },
    { risk: 'Live performance complexity requires significant production investment', severity: 'High' },
    { risk: 'Reference artist fatigue if positioning is too derivative', severity: 'Low' },
  ],
  recommendations: [
    { priority: 1, action: 'Release 2-track single to test market response before full EP', timeline: '0–2 months' },
    { priority: 2, action: 'Pitch to Modern Classical and Electronic Concentration playlists', timeline: '2–3 months' },
    { priority: 3, action: 'Develop live A/V show concept for festival applications', timeline: '3–6 months' },
    { priority: 4, action: 'Target sync licensing agencies specializing in film/TV placement', timeline: '2–4 months' },
    { priority: 5, action: 'Build Bandcamp presence for direct-to-fan revenue', timeline: '0–1 months' },
  ],
};

const DEMO_CONFIDENCE: I1Confidence = {
  overall_score: 87,
  data_completeness: 82,
  sources_used: ['Spotify Search', 'Related Artists', 'Top Tracks', 'Audio Features', 'Playlists'],
  sources_failed: [],
};

/* ———————————————————————————————————————
   Project Page
   ——————————————————————————————————————— */

type ViewState = 'concept' | 'report';

export default function ProjectPage() {
  const [activeTab, setActiveTab] = useState<ViewState>('concept');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conceptReady, setConceptReady] = useState(false);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [report, setReport] = useState<{ report: I1Report; confidence: I1Confidence } | null>(null);
  const [researchRunning, setResearchRunning] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('imc_demo_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.messages?.length) setMessages(state.messages);
        if (state.conceptReady) setConceptReady(true);
        if (state.concept) setConcept(state.concept);
        if (state.report) setReport(state.report);
        if (state.activeTab) setActiveTab(state.activeTab);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist state to sessionStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem('imc_demo_state', JSON.stringify({
        messages,
        conceptReady,
        concept,
        report,
        activeTab,
      }));
    } catch { /* ignore */ }
  }, [messages, conceptReady, concept, report, activeTab, hydrated]);

  // Demo mode: simulate conversation
  const handleSendMessage = useCallback(async (content: string) => {
    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);

    // Simulate AI response delay
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const turnCount = Math.floor(messages.length / 2) + 1;

    const responses = [
      "I love the direction. Let's dig deeper — when you say symphonic meets electronic, which classical instruments are most central to the sound? And are we talking lush orchestral arrangements or more intimate, solo instrument pieces processed through effects?",
      "Interesting — piano and strings as the foundation, run through electronic processing. That reminds me of Ólafur Arnalds' approach but with more energy. What's the rhythmic backbone? Are we thinking four-on-the-floor, breakbeats, UK garage patterns, or something more fluid?",
      "Breakbeats and two-step under classical elements — that's a distinctive combination. Now tell me about the emotional arc. Is this music for dark clubs at 2am, or headphones on a rainy afternoon, or something that moves between those worlds?",
      `CONCEPT_READY. I've captured the full artist concept for MMe. — a neoclassical electronic project blending piano and strings with breakbeat rhythms and atmospheric production. The creative direction is clear: cinematic but club-ready, melancholic but driving.\n\nI've extracted all the key parameters. You're ready to run market research.`,
    ];

    const responseIdx = Math.min(turnCount - 1, responses.length - 1);
    const isLastResponse = turnCount >= responses.length;

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: responses[responseIdx],
    }]);

    if (isLastResponse) {
      setConceptReady(true);
      setConcept(DEMO_CONCEPT);
    }

    setLoading(false);
  }, [messages.length]);

  const handleRunResearch = useCallback(async () => {
    setResearchRunning(true);
    setActiveTab('report');

    // Simulate research delay
    await new Promise(r => setTimeout(r, 3000));

    setReport({ report: DEMO_REPORT, confidence: DEMO_CONFIDENCE });
    setResearchRunning(false);
  }, []);

  const tabs = [
    { id: 'concept', label: 'Concept', count: messages.length > 0 ? Math.ceil(messages.length / 2) : undefined },
    { id: 'report', label: 'Research', count: report ? 1 : undefined },
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
            <span className="text-micro font-bold uppercase tracking-widest text-black">
              MMe.
            </span>
            {activeTab === 'report' && (
              <>
                <span className="text-neutral-200">/</span>
                <button
                  onClick={() => setActiveTab('concept')}
                  className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                >
                  Concept
                </button>
                <span className="text-neutral-200">/</span>
                <span className="text-micro font-bold uppercase tracking-widest text-black">
                  Research
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="green">Active</Badge>
            <span className="text-micro font-mono text-neutral-300">
              Instrument 01
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as ViewState)} />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'concept' && (
            <ConceptChat
              messages={messages}
              onSend={handleSendMessage}
              loading={loading}
              conceptReady={conceptReady}
              concept={concept}
              onRunResearch={handleRunResearch}
            />
          )}

          {activeTab === 'report' && (
            <>
              {researchRunning && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
                  <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
                    Running Market Research
                  </p>
                  <p className="text-body-lg text-black mt-5 max-w-sm">
                    Analyzing Spotify data, mapping comparable artists,
                    and generating your market intelligence report.
                  </p>
                  <div className="mt-8 flex items-center gap-2">
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}

              {!researchRunning && !report && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
                  <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
                    No Research Yet
                  </p>
                  <p className="text-body-lg text-black mt-5 max-w-sm">
                    Complete the concept interview first, then run market research
                    to generate your intelligence report.
                  </p>
                </div>
              )}

              {!researchRunning && report && (
                <ResearchReport
                  report={report.report}
                  confidence={report.confidence}
                  version={1}
                  artistName="MMe."
                  createdAt={new Date().toISOString()}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
