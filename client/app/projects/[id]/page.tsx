'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ConceptChat from '../../../components/ConceptChat';
import ResearchReport from '../../../components/ResearchReport';
import VisualMoodboard from '../../../components/VisualMoodboard';
import ProjectNav from '../../../components/ProjectNav';
import { Tabs } from '../../../components/ui';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import type { ConversationMessage, ProjectConcept, I1Report, I1Confidence, Project, MoodboardImage } from '../../../lib/api';

/* eslint-disable @next/next/no-img-element */

type ViewState = 'home' | 'concept' | 'report';
type ConceptSubTab = 'interview' | 'moodboard';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Read ?tab= param to determine initial view
  const tabParam = searchParams.get('tab');
  const initialTab: ViewState = tabParam === 'research' ? 'report' : tabParam === 'concept' ? 'concept' : tabParam === 'moodboard' ? 'concept' : 'home';
  const initialSubTab: ConceptSubTab = tabParam === 'moodboard' ? 'moodboard' : 'interview';
  const [activeTab, setActiveTab] = useState<ViewState>(initialTab);
  const [conceptSubTab, setConceptSubTab] = useState<ConceptSubTab>(initialSubTab);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conceptReady, setConceptReady] = useState(false);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [report, setReport] = useState<{ report: I1Report; confidence: I1Confidence } | null>(null);
  const [researchRunning, setResearchRunning] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [reportVersion, setReportVersion] = useState(1);
  const [totalVersions, setTotalVersions] = useState(1);
  const autoResearchTriggered = useRef(false);

  // Index page data
  const [checklistSummary, setChecklistSummary] = useState<{ total: number; checked: number } | null>(null);
  const [hasPrompts, setHasPrompts] = useState(false);
  const [lyricSessionCount, setLyricSessionCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load project data on mount
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadProject = async () => {
      try {
        // Fetch project details
        const proj = await api.getProject(id);
        setProject(proj);

        // If concept exists on project, set it
        if (proj.concept && proj.concept.genre_primary) {
          setConcept(proj.concept);
          setConceptReady(true);
        }

        // Fetch conversation messages
        try {
          const conv = await api.getConversation(id);
          if (conv.messages && conv.messages.length > 0) {
            setMessages(conv.messages);
          }
        } catch {
          // Conversation might not exist yet for new projects
        }

        // Fetch latest research report if status is past draft
        if (proj.status !== 'draft') {
          try {
            const reportData = await api.getReport(id);
            setReport({ report: reportData.report, confidence: reportData.confidence });
            setReportVersion(reportData.version);
            setTotalVersions(reportData.version);
          } catch {
            // No report yet
          }
        }

        // Load index page data (non-blocking)
        api.getChecklistSummary(id).then(setChecklistSummary).catch(() => {});
        api.getPrompts(id).then(() => setHasPrompts(true)).catch(() => {});
        api.getLyricSessions(id).then(res => setLyricSessionCount(res.sessions.length)).catch(() => {});
        api.getShareProjects(id).then(res => setShareCount(res.projects.length)).catch(() => {});
        api.getMoodboardThumbnails(id).then(setMoodboardImages).catch(() => {});
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadProject();
  }, [isAuthenticated, id]);

  // Send message to concept conversation via API
  const handleSendMessage = useCallback(async (content: string) => {
    if (!id) return;

    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const res = await api.sendConceptMessage(id, content);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
      }]);

      if (res.conceptReady && res.concept) {
        setConceptReady(true);
        setConcept(res.concept);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Run market research via API
  const handleRunResearch = useCallback(async () => {
    if (!id) return;

    setResearchRunning(true);

    try {
      const reportData = await api.runResearch(id);
      setReport({ report: reportData.report, confidence: reportData.confidence });
      setReportVersion(reportData.version);
      setTotalVersions(reportData.version);
    } catch (err) {
      console.error('Failed to run research:', err);
    } finally {
      setResearchRunning(false);
    }
  }, [id]);

  // Auto-run research when switching to Research tab with concept ready but no report
  useEffect(() => {
    if (
      activeTab === 'report' &&
      conceptReady &&
      !report &&
      !researchRunning &&
      !pageLoading &&
      !autoResearchTriggered.current &&
      id
    ) {
      autoResearchTriggered.current = true;
      handleRunResearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, conceptReady, report, researchRunning, pageLoading, id]);

  // Load a specific report version
  const handleVersionChange = useCallback(async (version: number) => {
    if (!id) return;

    try {
      const reportData = await api.getReportVersion(id, version);
      setReport({ report: reportData.report, confidence: reportData.confidence });
      setReportVersion(version);
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  }, [id]);

  const artistName = project?.artist_name || 'Untitled';

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
        <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // PROJECT INDEX / HOME VIEW
  // ──────────────────────────────────────────
  if (activeTab === 'home') {
    const statusLabel = project?.status === 'draft' ? 'In Development' : project?.status === 'complete' ? 'Complete' : 'In Progress';
    const createdDate = project ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    // Build instrument cards for the grid
    const instruments = [
      {
        number: '00',
        name: 'Checklist',
        description: 'Launch readiness tracker. Milestones, deliverables, and dependencies.',
        href: `/projects/${id}/checklist`,
        status: checklistSummary ? `${checklistSummary.checked}/${checklistSummary.total}` : '—',
        statusLabel: checklistSummary && checklistSummary.checked === checklistSummary.total && checklistSummary.total > 0 ? 'Complete' : 'Active',
        color: 'green' as const,
      },
      {
        number: '01',
        name: 'Concept',
        description: 'Artist identity interview and visual moodboard. The creative foundation.',
        href: `/projects/${id}?tab=concept`,
        status: conceptReady ? 'Defined' : 'Pending',
        statusLabel: conceptReady ? 'Complete' : 'Start Interview',
        color: conceptReady ? 'green' as const : 'yellow' as const,
      },
      {
        number: '02',
        name: 'Research',
        description: 'Market intelligence, comparable artists, audience profile, and sonic blueprint.',
        href: `/projects/${id}?tab=research`,
        status: report ? `v${reportVersion}` : 'Pending',
        statusLabel: report ? 'Complete' : conceptReady ? 'Ready' : 'Needs Concept',
        color: report ? 'green' as const : conceptReady ? 'yellow' as const : 'neutral' as const,
      },
      {
        number: '03',
        name: 'Sonic Engine',
        description: 'AI-generated Suno & Udio prompts tuned to your style profile and market data.',
        href: `/projects/${id}/prompts`,
        status: hasPrompts ? 'Generated' : 'Pending',
        statusLabel: hasPrompts ? 'Complete' : 'Needs Research',
        color: hasPrompts ? 'green' as const : 'neutral' as const,
      },
      {
        number: '04',
        name: 'LyriCol',
        description: 'Collaborative lyric advisor. Paste lyrics, talk through ideas, find the right words.',
        href: `/projects/${id}/lyrics`,
        status: lyricSessionCount > 0 ? `${lyricSessionCount} sessions` : '—',
        statusLabel: lyricSessionCount > 0 ? 'Active' : 'Start',
        color: lyricSessionCount > 0 ? 'green' as const : 'neutral' as const,
      },
      {
        number: '05',
        name: 'Share',
        description: 'Private listening rooms with Dropbox-linked audio, analytics, and password protection.',
        href: `/projects/${id}/share`,
        status: shareCount > 0 ? `${shareCount} shares` : '—',
        statusLabel: shareCount > 0 ? 'Active' : 'Create',
        color: shareCount > 0 ? 'green' as const : 'neutral' as const,
      },
    ];

    return (
      <div className="animate-fade-in h-full flex flex-col">
        {/* Minimal top bar */}
        <div className="border-b border-neutral-200">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center">
            <a
              href="/"
              className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2"
            >
              <span className="text-body">&#8592;</span>
              IMC
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hero section */}
          <div className="max-w-[1400px] mx-auto px-10">
            <div className="grid grid-cols-12 gap-x-8 pt-16 pb-12 border-b border-neutral-200">
              {/* Left: Artist info */}
              <div className="col-span-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-2 rounded-full ${project?.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                    {statusLabel}
                  </span>
                </div>

                <h1 className="text-[96px] leading-[0.88] font-bold tracking-tight text-black">
                  {artistName}
                </h1>

                {/* Meta row */}
                <div className="flex items-center gap-6 mt-8">
                  {concept?.genre_primary && (
                    <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                      {concept.genre_primary}
                    </span>
                  )}
                  {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
                    <span className="text-micro uppercase tracking-widest text-neutral-300">
                      {concept.mood_keywords.slice(0, 3).join(' / ')}
                    </span>
                  )}
                  <span className="text-micro font-mono text-neutral-300">
                    {createdDate}
                  </span>
                </div>
              </div>

              {/* Right: Artist image or moodboard hero */}
              <div className="col-span-5 flex justify-end">
                {project?.image_url ? (
                  <div className="w-full max-w-[400px] aspect-square overflow-hidden rounded-sm">
                    <img
                      src={project.image_url}
                      alt={artistName}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : moodboardImages.length > 0 && moodboardImages[0].image_data ? (
                  <div className="w-full max-w-[400px] aspect-square overflow-hidden rounded-sm">
                    <img
                      src={moodboardImages[0].image_data}
                      alt={`${artistName} moodboard`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[400px] aspect-square bg-neutral-50 rounded-sm flex items-center justify-center">
                    <span className="text-[120px] font-bold text-neutral-100">
                      {artistName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Concept excerpt bar */}
            {concept && (
              <div className="grid grid-cols-12 gap-x-8 py-10 border-b border-neutral-200">
                <div className="col-span-4">
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-4">
                    Artist Concept
                  </p>
                  <blockquote className="text-[28px] leading-[1.15] font-bold text-black tracking-tight">
                    &ldquo;{(() => {
                      const dir = concept.creative_direction.length > 100
                        ? concept.creative_direction.slice(0, 100) + '...'
                        : concept.creative_direction;
                      return dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase();
                    })()}&rdquo;
                  </blockquote>
                </div>
                <div className="col-span-4">
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-4">
                    Influences
                  </p>
                  <div className="space-y-2">
                    {concept.reference_artists.slice(0, 4).map((artist, i) => (
                      <a
                        key={i}
                        href={`https://open.spotify.com/search/${encodeURIComponent(artist)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-body font-bold text-black hover:text-green-600 transition-colors duration-fast"
                      >
                        {artist}
                        <span className="text-neutral-300 ml-1.5 text-caption">&#8599;</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="col-span-4">
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-4">
                    Tracks
                  </p>
                  <p className="text-[64px] leading-none font-bold text-black">
                    {String(concept.track_count).padStart(2, '0')}
                  </p>
                  <p className="text-body-sm text-neutral-400 mt-1">planned</p>
                </div>
              </div>
            )}

            {/* Moodboard grid */}
            {moodboardImages.length > 0 && (
              <div className="py-12 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                    Visual Moodboard
                  </p>
                  <a
                    href={`/projects/${id}?tab=moodboard`}
                    className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                  >
                    Edit
                  </a>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {moodboardImages.slice(0, 6).map((img, i) => (
                    <div
                      key={img.id}
                      className="overflow-hidden rounded-sm aspect-square"
                    >
                      {img.image_data && (
                        <img
                          src={img.image_data}
                          alt={`Moodboard ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instruments grid */}
            <div className="py-12">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
                Instruments
              </p>
              <div className="grid grid-cols-3 gap-4">
                {instruments.map((inst) => (
                  <a
                    key={inst.number}
                    href={inst.href}
                    className="group border border-neutral-200 rounded-sm p-6 hover:border-black transition-all duration-200 relative overflow-hidden"
                  >
                    {/* Number watermark */}
                    <span className="absolute top-3 right-4 text-[48px] font-bold text-neutral-100 leading-none group-hover:text-neutral-200 transition-colors">
                      {inst.number}
                    </span>

                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          inst.color === 'green' ? 'bg-green-500' :
                          inst.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-neutral-300'
                        }`} />
                        <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                          {inst.statusLabel}
                        </span>
                      </div>

                      <h3 className="text-heading-sm font-bold text-black group-hover:text-black mb-2">
                        {inst.name}
                      </h3>
                      <p className="text-body-sm text-neutral-500 leading-relaxed">
                        {inst.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer spacer */}
            <div className="h-12" />
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // CONCEPT / RESEARCH VIEWS
  // ──────────────────────────────────────────
  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav
        projectId={id}
        artistName={artistName}
        imageUrl={project?.image_url}
        activePage={activeTab === 'report' ? 'research' : 'concept'}
        onNavigate={(page) => setActiveTab(page === 'research' ? 'report' : 'concept')}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'concept' && (
            <>
              {/* Concept sub-tabs: Interview / Moodboard */}
              <div className="max-w-[1400px] mx-auto w-full px-10">
                <Tabs
                  tabs={[
                    { id: 'interview', label: 'Interview' },
                    { id: 'moodboard', label: 'Moodboard' },
                  ]}
                  activeTab={conceptSubTab}
                  onTabChange={(tabId) => setConceptSubTab(tabId as ConceptSubTab)}
                />
              </div>

              {conceptSubTab === 'interview' && (
                <ConceptChat
                  messages={messages}
                  onSend={handleSendMessage}
                  loading={loading}
                  conceptReady={conceptReady}
                  concept={concept}
                />
              )}

              {conceptSubTab === 'moodboard' && (
                <VisualMoodboard projectId={id} />
              )}
            </>
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

              {!researchRunning && !report && !conceptReady && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
                  <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
                    No Concept Yet
                  </p>
                  <p className="text-body-lg text-black mt-5 max-w-sm">
                    Complete the concept interview first. Market research will run
                    automatically when you return here.
                  </p>
                </div>
              )}

              {!researchRunning && report && (
                <>
                  {/* Re-run button at top */}
                  <div className="px-8 pt-6 pb-0 flex items-center justify-between max-w-[1400px]">
                    <div />
                    <button
                      onClick={() => {
                        autoResearchTriggered.current = false;
                        handleRunResearch();
                      }}
                      className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                    >
                      Re-run Research
                    </button>
                  </div>
                  <ResearchReport
                    report={report.report}
                    confidence={report.confidence}
                    version={reportVersion}
                    totalVersions={totalVersions}
                    artistName={artistName}
                    createdAt={new Date().toISOString()}
                    onVersionChange={handleVersionChange}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
