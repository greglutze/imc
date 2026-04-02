'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ConceptChat from '../../../components/ConceptChat';
import ResearchReport from '../../../components/ResearchReport';
import VisualMoodboard from '../../../components/VisualMoodboard';
import ProjectNav from '../../../components/ProjectNav';
import { useAuth } from '../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../lib/api';
import type { ConversationMessage, ProjectConcept, I1Report, I1Confidence, Project, MoodboardImage, ShareProject, ShareTrack, I2Track, MoodboardBrief } from '../../../lib/api';
import { extractPaletteFromImages, type ExtractedColor } from '../../../lib/colorExtract';
import { ButtonV2 } from '../../../components/ui';

/* eslint-disable @next/next/no-img-element */

type ViewState = 'home' | 'interview' | 'moodboard' | 'report';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Read ?tab= param to determine initial view
  const tabParam = searchParams.get('tab');
  const tabFromParam = (param: string | null): ViewState => {
    if (param === 'research') return 'report';
    if (param === 'interview' || param === 'concept') return 'interview';
    if (param === 'moodboard') return 'moodboard';
    return 'home';
  };
  const [activeTab, setActiveTab] = useState<ViewState>(tabFromParam(tabParam));

  // Sync tab state when URL params change (e.g. browser refresh, back/forward)
  useEffect(() => {
    setActiveTab(tabFromParam(tabParam));
  }, [tabParam]);
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
  const [latestTrack, setLatestTrack] = useState<ShareTrack | null>(null);
  const [latestShareProject, setLatestShareProject] = useState<ShareProject | null>(null);
  const [demoTracks, setDemoTracks] = useState<I2Track[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [exportingBrief, setExportingBrief] = useState(false);
  const [dashboardPalette, setDashboardPalette] = useState<ExtractedColor[]>([]);
  const [moodboardBriefData, setMoodboardBriefData] = useState<MoodboardBrief | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
        api.getPrompts(id).then(prompts => {
          setHasPrompts(true);
          if (prompts.tracks && prompts.tracks.length > 0) {
            setDemoTracks(prompts.tracks);
          }
        }).catch(() => {});
        api.getLyricSessions(id).then(res => setLyricSessionCount(res.sessions.length)).catch(() => {});
        api.getShareProjects(id).then(res => {
          setShareCount(res.projects.length);
          // Fetch the most recent share project's tracks for the dashboard player
          if (res.projects.length > 0) {
            const mostRecent = res.projects[0];
            setLatestShareProject(mostRecent);
            api.getShareProject(id, mostRecent.id).then(full => {
              if (full.tracks && full.tracks.length > 0) {
                // Get the most recently added track
                const sorted = [...full.tracks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setLatestTrack(sorted[0]);
              }
            }).catch(() => {});
          }
        }).catch(() => {});
        api.getMoodboardThumbnails(id).then((imgs) => {
          setMoodboardImages(imgs);
          // Extract palette for brief export
          const dataUrls = imgs.map(i => i.image_data).filter((d): d is string => !!d);
          if (dataUrls.length > 0) {
            extractPaletteFromImages(dataUrls, 7).then(setDashboardPalette);
          }
        }).catch(() => {});
        api.getMoodboard(id).then((mb) => {
          if (mb.brief) setMoodboardBriefData(mb.brief);
        }).catch(() => {});
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

  const handleExportBrief = useCallback(async () => {
    setExportingBrief(true);
    try {
      const { generateProjectBrief } = await import('../../../lib/generateBrief');
      generateProjectBrief({
        artistName: project?.artist_name || 'Untitled',
        createdDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        concept: concept || null,
        report: report || null,
        palette: dashboardPalette,
        trackNames: demoTracks.map(t => t.title),
        moodboardBrief: moodboardBriefData?.prose || null,
      });
    } catch (err) {
      console.error('Failed to export brief:', err);
    } finally {
      setExportingBrief(false);
    }
  }, [project, concept, report, dashboardPalette, demoTracks, moodboardBriefData]);

  const artistName = project?.artist_name || 'Untitled';

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingImage(true);
    try {
      const result = await api.uploadProjectImage(id, file);
      setProject((prev) => prev ? { ...prev, image_url: result.image_url } : prev);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }, [id]);

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        {/* Nav skeleton */}
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 bg-neutral-100 rounded-md animate-pulse" />
              <span className="text-neutral-200">/</span>
              <div className="h-3 w-24 bg-neutral-100 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 w-14 bg-neutral-100 rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        {/* Hero skeleton */}
        <div className="max-w-[1400px] mx-auto px-10 w-full">
          <div className="grid grid-cols-12 gap-x-8 pt-16 pb-12">
            <div className="col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-neutral-100 animate-pulse" />
                <div className="h-3 w-20 bg-neutral-100 rounded-md animate-pulse" />
              </div>
              <div className="h-20 w-80 bg-neutral-100 rounded-md animate-pulse mb-6" />
              <div className="h-3 w-48 bg-neutral-50 rounded-md animate-pulse" />
            </div>
            <div className="col-span-5 flex justify-end">
              <div className="w-full max-w-[400px] aspect-square bg-neutral-100 rounded-md animate-pulse" />
            </div>
          </div>
          {/* Instrument cards skeleton */}
          <div className="grid grid-cols-3 gap-4 pt-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-[#E8E8E8] rounded-md p-6 h-32">
                <div className="h-3 w-16 bg-neutral-100 rounded-md animate-pulse mb-4" />
                <div className="h-5 w-28 bg-neutral-100 rounded-md animate-pulse mb-3" />
                <div className="h-3 w-full bg-neutral-50 rounded-md animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // PROJECT INDEX / HOME VIEW
  // ──────────────────────────────────────────
  if (activeTab === 'home') {
    const statusLabel = project?.status === 'draft' ? 'In Development' : project?.status === 'complete' ? 'Complete' : 'In Progress';
    // Build instrument cards for the grid
    const instruments = [
      {
        number: '01',
        name: 'Concept',
        description: conceptReady
          ? `${concept?.genre_primary || 'Defined'}${concept?.mood_keywords?.length ? ' · ' + concept.mood_keywords.slice(0, 2).join(', ') : ''}`
          : 'Describe your sound, influences, and creative direction.',
        href: `/projects/${id}?tab=interview`,
        statusLabel: conceptReady ? 'Locked In' : 'Start Here',
        color: conceptReady ? 'green' as const : 'yellow' as const,
      },
      {
        number: '02',
        name: 'Audio Visuals',
        description: moodboardImages.length > 0
          ? `${moodboardImages.length} images shaping your visual world.`
          : 'Drop in photos, textures, and references that feel like your sound.',
        href: `/projects/${id}?tab=moodboard`,
        statusLabel: moodboardImages.length > 0 ? `${moodboardImages.length} Images` : 'Start',
        color: moodboardImages.length > 0 ? 'green' as const : 'neutral' as const,
      },
      {
        number: '03',
        name: 'Research',
        description: report
          ? 'Market intelligence, audience profile, and sonic positioning — ready to review.'
          : conceptReady
            ? 'Your concept is locked in. Research is ready to run.'
            : 'Finish your concept first — research builds on it.',
        href: `/projects/${id}?tab=research`,
        statusLabel: report ? `v${reportVersion}` : conceptReady ? 'Ready to Run' : 'Needs Concept',
        color: report ? 'green' as const : conceptReady ? 'yellow' as const : 'neutral' as const,
      },
      {
        number: '04',
        name: 'Sonic Engine',
        description: hasPrompts
          ? `${demoTracks.length} track prompts generated from your concept and research.`
          : 'Style profiles, vocal direction, and per-track prompts — built from your brief.',
        href: `/projects/${id}/prompts`,
        statusLabel: hasPrompts ? `${demoTracks.length} Tracks` : 'Needs Research',
        color: hasPrompts ? 'green' as const : 'neutral' as const,
      },
      {
        number: '05',
        name: 'LyriCol',
        description: lyricSessionCount > 0
          ? `${lyricSessionCount} session${lyricSessionCount !== 1 ? 's' : ''} — keep writing, keep refining.`
          : 'Talk through lyrics, find the right words, shape your narrative.',
        href: `/projects/${id}/lyrics`,
        statusLabel: lyricSessionCount > 0 ? `${lyricSessionCount} Sessions` : 'Start Writing',
        color: lyricSessionCount > 0 ? 'green' as const : 'neutral' as const,
      },
      {
        number: '06',
        name: 'Tracks',
        description: shareCount > 0
          ? `${shareCount} share link${shareCount !== 1 ? 's' : ''} — private listening, on your terms.`
          : 'Share your music with collaborators, labels, or press before release.',
        href: `/projects/${id}/share`,
        statusLabel: shareCount > 0 ? `${shareCount} Links` : 'Create',
        color: shareCount > 0 ? 'green' as const : 'neutral' as const,
      },
    ];

    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav
          projectId={id}
          artistName={artistName}
          imageUrl={project?.image_url}
          activePage="home"
          onNavigate={(page) => {
            if (page === 'interview') setActiveTab('interview');
            else if (page === 'moodboard') setActiveTab('moodboard');
            else if (page === 'research') setActiveTab('report');
          }}
        />

        <div className="flex-1 overflow-y-auto">
          {/* Hero section */}
          <div className="max-w-[1400px] mx-auto px-10">
            <div className="grid grid-cols-12 gap-x-8 pt-16 pb-12 border-b border-[#E8E8E8]">
              {/* Left: Artist info */}
              <div className="col-span-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-2 rounded-full ${project?.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    {statusLabel}
                  </span>
                  {conceptReady && (
                    <ButtonV2 onClick={handleExportBrief} loading={exportingBrief} variant="secondary" size="sm" className="ml-auto">
                      Export Brief
                    </ButtonV2>
                  )}
                </div>

                <h1 className="text-[96px] leading-[0.88] font-bold tracking-tight text-black">
                  {artistName}
                </h1>

                {/* Mood pills */}
                {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8">
                    {concept.mood_keywords.map((keyword) => (
                      <span key={keyword} className="tag-open">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Artist image — click to upload/replace */}
              <div className="col-span-5 flex justify-end">
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full max-w-[400px] aspect-square overflow-hidden rounded-md cursor-pointer relative group"
                >
                {project?.image_url ? (
                  <>
                    <img
                      src={resolveArtworkUrl(project.image_url) || ''}
                      alt={artistName}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <span className="text-white text-micro font-semibold uppercase tracking-wide">
                        {uploadingImage ? 'Uploading...' : 'Replace Image'}
                      </span>
                    </div>
                  </>
                ) : moodboardImages.length > 0 && moodboardImages[0].image_data ? (
                  <>
                    <img
                      src={moodboardImages[0].image_data}
                      alt={`${artistName} moodboard`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <span className="text-white text-micro font-semibold uppercase tracking-wide">
                        {uploadingImage ? 'Uploading...' : 'Add Image'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-neutral-50 flex flex-col items-center justify-center">
                    <span className="text-[120px] font-medium text-neutral-100">
                      {artistName.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-micro text-neutral-300 uppercase tracking-wide mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {uploadingImage ? 'Uploading...' : 'Add Image'}
                    </span>
                  </div>
                )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Living brief */}
            {concept && (
              <div className="border-b border-[#E8E8E8]">
                {/* Creative direction as hero quote */}
                <div className="py-10 border-b border-neutral-100">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      Creative Brief
                    </p>
                  </div>
                  <blockquote className="text-[24px] leading-[1.35] text-black max-w-3xl">
                    {concept.creative_direction}
                  </blockquote>
                </div>

                {/* Three-column data strip */}
                <div className="grid grid-cols-12 gap-x-8 py-8">
                  <div className="col-span-4">
                    <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                      Influences
                    </p>
                    <div className="space-y-2">
                      {concept.reference_artists.slice(0, 4).map((artist, i) => (
                        <a
                          key={i}
                          href={`https://open.spotify.com/search/${encodeURIComponent(artist)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-body font-bold text-black hover:text-green-600 transition-colors duration-150"
                        >
                          {artist}
                          <span className="text-neutral-300 ml-1.5 text-caption">&#8599;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                      Sound
                    </p>
                    <div className="space-y-2">
                      <p className="text-body font-semibold text-black">{concept.genre_primary}</p>
                      {concept.genre_secondary && concept.genre_secondary.length > 0 && (
                        <p className="text-body-sm text-neutral-500">{concept.genre_secondary.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                      Tracklist
                    </p>
                    {demoTracks.length > 0 ? (
                      <div className="space-y-2">
                        {demoTracks.slice(0, 4).map((t) => (
                          <a
                            key={t.track_number}
                            href={`/projects/${id}/prompts`}
                            className="flex items-baseline gap-2 group"
                          >
                            <span className="text-caption font-mono text-neutral-300">
                              {String(t.track_number).padStart(2, '0')}
                            </span>
                            <span className="text-body font-bold text-black group-hover:text-neutral-600 transition-colors duration-150 truncate">
                              {t.title}
                            </span>
                          </a>
                        ))}
                        {demoTracks.length > 4 && (
                          <a
                            href={`/projects/${id}/prompts`}
                            className="text-caption text-[#8A8A8A] hover:text-black transition-colors duration-150 mt-1 block"
                          >
                            View all {demoTracks.length} tracks
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-body-sm text-[#8A8A8A]">
                        {concept.track_count} tracks planned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Moodboard grid */}
            {moodboardImages.length > 0 && (
              <div className="py-12 border-b border-[#E8E8E8]">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Audio Visuals
                  </p>
                  <a
                    href={`/projects/${id}?tab=moodboard`}
                    className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-black transition-colors duration-150"
                  >
                    Edit
                  </a>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {moodboardImages.slice(0, 6).map((img, i) => (
                    <div
                      key={img.id}
                      className="overflow-hidden rounded-md aspect-square"
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

            {/* Latest track player */}
            {latestTrack && latestShareProject && (
              <div className="py-12 border-b border-[#E8E8E8]">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Latest Track
                  </p>
                  <a
                    href={`/projects/${id}/share/${latestShareProject.id}`}
                    className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-black transition-colors duration-150"
                  >
                    View All Tracks
                  </a>
                </div>
                <DashboardPlayer track={latestTrack} shareTitle={latestShareProject.title} artworkUrl={latestShareProject.artwork_url} />
              </div>
            )}

            {/* Instruments grid */}
            <div className="py-12">
              <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-8">
                Your Toolkit
              </p>
              <div className="grid grid-cols-3 gap-4">
                {instruments.map((inst) => (
                  <a
                    key={inst.number}
                    href={inst.href}
                    className="group border border-[#E8E8E8] rounded-md p-6 hover:border-black transition-all duration-200 relative overflow-hidden"
                  >
                    {/* Number watermark */}
                    <span className="absolute top-3 right-4 text-[48px] font-medium text-neutral-100 leading-none group-hover:text-neutral-200 transition-colors">
                      {inst.number}
                    </span>

                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          inst.color === 'green' ? 'bg-green-500' :
                          inst.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-neutral-300'
                        }`} />
                        <span className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                          {inst.statusLabel}
                        </span>
                      </div>

                      <h3 className="text-heading-sm font-semibold text-black group-hover:text-black mb-2">
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
        activePage={activeTab === 'report' ? 'research' : activeTab === 'moodboard' ? 'moodboard' : 'interview'}
        onNavigate={(page) => setActiveTab(page === 'research' ? 'report' : page === 'moodboard' ? 'moodboard' : 'interview')}
      />

      {/* Content area — key forces remount for crossfade */}
      <div className="flex-1 overflow-hidden">
        <div key={activeTab} className={`animate-fade-in ${activeTab === 'interview' ? 'h-full' : 'h-full overflow-y-auto'}`}>
          <div className="max-w-[1400px] mx-auto h-full">
          {activeTab === 'interview' && (
            <div className="h-full">
              <ConceptChat
                messages={messages}
                onSend={handleSendMessage}
                loading={loading}
                conceptReady={conceptReady}
                concept={concept}
              />
            </div>
          )}

          {activeTab === 'moodboard' && (
            <VisualMoodboard projectId={id} />
          )}

          {activeTab === 'report' && (
            <>
              {researchRunning && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-medium text-neutral-100 -ml-1">03</p>
                  <p className="text-[40px] leading-[1.1] font-medium text-black mt-4 tracking-tight">
                    Researching Your Market
                  </p>
                  <p className="text-body-lg text-neutral-500 mt-5 max-w-sm">
                    Pulling Spotify data, mapping comparable artists, and building your market intelligence report. This usually takes about a minute.
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
                  <p className="text-[120px] leading-[0.85] font-medium text-neutral-100 -ml-1">03</p>
                  <p className="text-[40px] leading-[1.1] font-medium text-black mt-4 tracking-tight">
                    Start With Your Concept
                  </p>
                  <p className="text-body-lg text-neutral-500 mt-5 max-w-sm">
                    Head to the Concept tab and describe your vision first. Once that&apos;s locked in, research will run automatically when you come back here.
                  </p>
                </div>
              )}

              {!researchRunning && report && (
                <>
                  {/* Regenerate button — top-right of section */}
                  <div className="px-8 pt-6 pb-0 flex items-center justify-between max-w-[1400px]">
                    <div />
                    <ButtonV2
                      onClick={() => {
                        autoResearchTriggered.current = false;
                        handleRunResearch();
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Regenerate
                    </ButtonV2>
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
    </div>
  );
}

/* ———————— Dashboard Player ———————— */

function DashboardPlayer({ track, shareTitle, artworkUrl }: {
  track: ShareTrack;
  shareTitle: string;
  artworkUrl: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-5">
      <audio
        ref={audioRef}
        src={track.dropbox_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Artwork */}
      <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center">
        {artworkUrl ? (
          <img src={resolveArtworkUrl(artworkUrl) || ''} alt={shareTitle} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[24px] font-bold text-neutral-300">&#9835;</span>
        )}
      </div>

      {/* Play button */}
      <ButtonV2 onClick={togglePlay} variant="media" size="lg" data-active>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
        )}
      </ButtonV2>

      {/* Track info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-body font-bold text-black truncate">{track.title}</p>
          <span className="text-caption text-[#8A8A8A] shrink-0">{shareTitle}</span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 bg-neutral-100 rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-black rounded-full transition-all duration-100 group-hover:bg-neutral-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between mt-1.5">
          <span className="text-micro font-mono text-[#8A8A8A]">{formatTime(currentTime)}</span>
          <span className="text-micro font-mono text-[#8A8A8A]">{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}
