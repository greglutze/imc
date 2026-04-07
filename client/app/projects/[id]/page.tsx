'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../components/ProjectNav';
import { useAuth } from '../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../lib/api';
import type { ProjectConcept, I1Report, I1Confidence, Project, MoodboardImage, ShareProject, ShareTrack, I2Track, MoodboardBrief } from '../../../lib/api';
import { extractPaletteFromImages, type ExtractedColor } from '../../../lib/colorExtract';
import { ButtonV2, Badge } from '../../../components/ui';

/* eslint-disable @next/next/no-img-element */

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [conceptReady, setConceptReady] = useState(false);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [report, setReport] = useState<{ report: I1Report; confidence: I1Confidence } | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [reportVersion, setReportVersion] = useState(1);

  // Index page data
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

        // Fetch latest research report if status is past draft
        if (proj.status !== 'draft') {
          try {
            const reportData = await api.getReport(id);
            setReport({ report: reportData.report, confidence: reportData.confidence });
            setReportVersion(reportData.version);
          } catch {
            // No report yet
          }
        }

        // Load index page data (non-blocking)
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
              <div className="h-3 w-8 skel" />
              <span className="text-[#E8E8E8]">/</span>
              <div className="h-3 w-24 skel skel-delay-1" />
            </div>
            <div className="flex items-center gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-3 w-14 skel skel-delay-${Math.min(i + 1, 5)}`} />
              ))}
            </div>
          </div>
        </div>
        {/* Hero skeleton */}
        <div className="max-w-[1400px] mx-auto px-10 w-full">
          <div className="grid grid-cols-12 gap-x-8 pt-16 pb-12">
            <div className="col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full skel" />
                <div className="h-3 w-20 skel skel-delay-1" />
              </div>
              <div className="h-20 w-80 skel skel-delay-2 mb-6" />
              <div className="h-3 w-48 skel skel-delay-3" />
            </div>
            <div className="col-span-5 flex justify-end">
              <div className="w-full max-w-[400px] aspect-square skel skel-delay-2" />
            </div>
          </div>
          {/* Instrument cards skeleton */}
          <div className="grid grid-cols-3 gap-4 pt-12 stagger-enter">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#F7F7F5] p-7 h-[220px]">
                <div className="h-3 w-16 skel mb-5" />
                <div className="h-6 w-28 skel skel-delay-1 mb-3" />
                <div className="h-3 w-full skel skel-delay-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // PROJECT OVERVIEW
  // ──────────────────────────────────────────
  const statusLabel = project?.status === 'draft' ? 'In Development' : project?.status === 'complete' ? 'Complete' : 'In Progress';
    // Build instrument cards for the grid
    const instruments = [
      {
        number: '01',
        name: 'Sounds',
        subtitle: 'Production Prompts',
        description: hasPrompts
          ? `${demoTracks.length} track prompts generated from your concept and research.`
          : 'Style profiles, vocal direction, and per-track prompts — built from your brief.',
        href: `/projects/${id}/prompts`,
        statusLabel: hasPrompts ? `${demoTracks.length} Tracks` : 'Needs Research',
        color: hasPrompts ? 'green' as const : 'neutral' as const,
      },
      {
        number: '02',
        name: 'Lyrics',
        subtitle: 'Writing Collaborator',
        description: lyricSessionCount > 0
          ? `${lyricSessionCount} session${lyricSessionCount !== 1 ? 's' : ''} — keep writing, keep refining.`
          : 'Talk through lyrics, find the right words, shape your narrative.',
        href: `/projects/${id}/lyrics`,
        statusLabel: lyricSessionCount > 0 ? `${lyricSessionCount} Sessions` : 'Not Started',
        color: lyricSessionCount > 0 ? 'green' as const : 'neutral' as const,
      },
      // Visual Engine (2.0) — page exists at /projects/[id]/visuals but hidden from nav
      {
        number: '03',
        name: 'Share',
        subtitle: 'Private Listening',
        description: shareCount > 0
          ? `${shareCount} share link${shareCount !== 1 ? 's' : ''} — private listening, on your terms.`
          : 'Share your music with collaborators, labels, or press before release.',
        href: `/projects/${id}/share`,
        statusLabel: shareCount > 0 ? `${shareCount} Links` : 'Not Started',
        color: shareCount > 0 ? 'green' as const : 'neutral' as const,
      },
      {
        number: '04',
        name: 'Research',
        subtitle: 'Market Intelligence',
        description: report
          ? 'Market intelligence, audience profile, and sonic positioning — ready to review.'
          : conceptReady
            ? 'Your concept is locked in. Research is ready to run.'
            : 'Research builds on your concept, which is defined during project creation.',
        href: `/projects/${id}/research`,
        statusLabel: report ? `v${reportVersion}` : conceptReady ? 'Ready' : 'Needs Concept',
        color: report ? 'green' as const : conceptReady ? 'yellow' as const : 'neutral' as const,
      },
    ];

    return (
      <div className="content-reveal h-full flex flex-col">
        <ProjectNav
          projectId={id}
          artistName={artistName}
          imageUrl={project?.image_url}
          activePage="home"
        />

        <div className="flex-1 overflow-y-auto">
          {/* Hero section */}
          <div className="max-w-[1400px] mx-auto px-10">
            <div className="grid grid-cols-12 gap-x-8 pt-16 pb-12 border-b border-[#E8E8E8]">
              {/* Left: Artist info */}
              <div className="col-span-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-2 rounded-full ${project?.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    {statusLabel}
                  </span>
                </div>

                <h1 className="text-[96px] leading-[0.88] font-bold tracking-tight text-black">
                  {artistName}
                </h1>

                {/* Mood pills */}
                {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8 max-w-[85%]">
                    {concept.mood_keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="text-[11px] font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full"
                      >
                        {keyword.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Artist image — click to upload/replace */}
              <div className="col-span-5 flex justify-end">
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full max-w-[400px] aspect-square overflow-hidden cursor-pointer relative group"
                >
                {project?.image_url ? (
                  <>
                    <img
                      src={resolveArtworkUrl(project.image_url) || ''}
                      alt={artistName}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-center pb-4">
                      <span className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wide px-4 py-1.5 rounded-full shadow-sm">
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
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-center pb-4">
                      <span className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wide px-4 py-1.5 rounded-full shadow-sm">
                        {uploadingImage ? 'Uploading...' : 'Add Image'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-[#F7F7F5] flex flex-col items-center justify-center border-2 border-dashed border-[#E8E8E8] group-hover:border-[#C4C4C4] transition-colors duration-150">
                    <span className="text-[120px] font-medium text-[#E8E8E8]">
                      {artistName.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <svg className="w-4 h-4 text-[#C4C4C4] group-hover:text-[#8A8A8A] transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] text-[#C4C4C4] group-hover:text-[#8A8A8A] uppercase tracking-wide font-semibold transition-colors duration-150">
                        {uploadingImage ? 'Uploading...' : 'Add Artist Image'}
                      </span>
                    </div>
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

            {/* Smart Progress — near the top */}
            <div className="py-10 border-b border-[#E8E8E8]">
              <SmartProgress
                projectId={id}
                conceptReady={conceptReady}
                hasResearch={!!report}
                hasPrompts={hasPrompts}
                trackCount={demoTracks.length}
                lyricSessionCount={lyricSessionCount}
                shareCount={shareCount}
              />
            </div>

            {/* Concept-failed banner — shows when project exists but concept extraction failed */}
            {!conceptReady && project?.status === 'draft' && !pageLoading && (
              <div className="border-b border-[#E8E8E8] py-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Setup Incomplete
                  </p>
                </div>
                <p className="text-[16px] text-[#1A1A1A] mb-2">
                  Your creative concept didn't finish extracting during setup.
                </p>
                <p className="text-[13px] text-[#8A8A8A] mb-6">
                  This means research, sound profiles, and other sections can't generate yet. You can retry the extraction or define your concept manually.
                </p>
                <div className="flex items-center gap-3">
                  <ButtonV2 size="sm" onClick={async () => {
                    try {
                      const result = await api.sendConceptMessage(id, 'Please extract and finalize my concept now based on everything discussed.', true);
                      if (result.conceptReady && result.concept) {
                        setConcept(result.concept);
                        setConceptReady(true);
                      }
                    } catch {}
                  }}>
                    Retry Extraction
                  </ButtonV2>
                  <a href={`/projects/${id}/research`}>
                    <ButtonV2 variant="ghost" size="sm">Go to Research →</ButtonV2>
                  </a>
                </div>
              </div>
            )}

            {/* Living brief */}
            {concept && (
              <div className="border-b border-[#E8E8E8]">
                {/* Creative direction as hero quote */}
                <div className="py-10 border-b border-[#E8E8E8]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      Creative Brief
                    </p>
                  </div>
                  <blockquote className="text-[24px] leading-[1.35] text-black max-w-3xl">
                    {concept.creative_direction}
                  </blockquote>
                </div>

                {/* Three-column data strip */}
                <div className="flex items-center justify-end pt-8 pb-4">
                  <a href={`/projects/${id}/prompts`}>
                    <Badge variant="action">View Sounds</Badge>
                  </a>
                </div>
                <div className="grid grid-cols-12 gap-x-8 pb-8">
                  <div className="col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                      Sound
                    </p>
                    <div className="space-y-2">
                      <p className="text-[14px] font-semibold text-black">{toTitleCase(concept.genre_primary)}</p>
                      {concept.genre_secondary && concept.genre_secondary.length > 0 && (
                        <p className="text-[13px] text-[#8A8A8A]">{concept.genre_secondary.map(g => toTitleCase(g)).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                      Influences
                    </p>
                    <div className="space-y-2">
                      {concept.reference_artists.slice(0, 4).map((artist, i) => (
                        <a
                          key={i}
                          href={`https://open.spotify.com/search/${encodeURIComponent(artist)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[14px] font-bold text-black hover:text-[#1A1A1A] transition-colors duration-150"
                        >
                          {artist}
                          <span className="text-[#C4C4C4] ml-1.5 text-[11px]">&#8599;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
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
                            <span className="text-[11px] font-mono text-[#C4C4C4]">
                              {String(t.track_number).padStart(2, '0')}
                            </span>
                            <span className="text-[14px] font-bold text-black transition-colors duration-150 truncate">
                              {t.title}
                            </span>
                          </a>
                        ))}
                        {demoTracks.length > 4 && (
                          <a
                            href={`/projects/${id}/prompts`}
                            className="text-[11px] text-[#8A8A8A] hover:text-black transition-colors duration-150 mt-1 block"
                          >
                            View all {demoTracks.length} tracks
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#8A8A8A]">
                        {concept.track_count} tracks planned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Market Snapshot — 3 key insights from research */}
            {report && (
              <MarketSnapshot report={report} projectId={id} />
            )}

            {/* Visual World — thumbnail strip */}
            {moodboardImages.length > 0 && (
              <div className="py-10 border-b border-[#E8E8E8]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      Visual World
                    </p>
                    <span className="text-[11px] text-[#C4C4C4]">{moodboardImages.length} images</span>
                  </div>
                  <a href={`/projects/${id}/moodboard`}>
                    <Badge variant="action">View Moodboard</Badge>
                  </a>
                </div>

                {/* Full-width thumbnail row */}
                <div className="flex gap-0 overflow-hidden">
                  {moodboardImages.map((img) => (
                    <div key={img.id} className="flex-1 min-w-0 overflow-hidden h-24">
                      <img
                        src={img.image_data}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest track player */}
            {latestTrack && latestShareProject && (
              <div className="py-12 border-b border-[#E8E8E8]">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Latest Track
                  </p>
                  <a
                    href={`/projects/${id}/share/${latestShareProject.id}`}
                    className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-black transition-colors duration-150"
                  >
                    View All Tracks
                  </a>
                </div>
                <DashboardPlayer track={latestTrack} shareTitle={latestShareProject.title} artworkUrl={latestShareProject.artwork_url} />
              </div>
            )}

            {/* Instruments grid — 4 across */}
            <div className="py-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                Your Instruments
              </p>
              <div className="grid grid-cols-4 gap-4 stagger-enter">
                {instruments.map((inst) => (
                  <a
                    key={inst.number}
                    href={inst.href}
                    className="group bg-[#F7F7F5] p-7 pb-6 card-hover hover:bg-[#F0F0ED] transition-all duration-200 flex flex-col justify-between min-h-[220px]"
                  >
                    <div>
                      {/* Number + status row */}
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-[13px] font-medium text-[#C4C4C4]">
                          {inst.number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            inst.color === 'green' ? 'bg-green-500' :
                            inst.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-[#C4C4C4]'
                          }`} />
                          <span className="text-[11px] font-medium text-[#8A8A8A]">
                            {inst.statusLabel}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-[22px] leading-tight font-medium text-[#1A1A1A] mb-1">
                        {inst.name}
                      </h3>
                      {'subtitle' in inst && inst.subtitle && (
                        <p className="text-[11px] font-medium text-[#C4C4C4] mb-2">{inst.subtitle}</p>
                      )}
                      <p className="text-[13px] leading-relaxed text-[#8A8A8A]">
                        {inst.description}
                      </p>
                    </div>

                    {/* CTA button */}
                    <div className="mt-5">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-full px-4 py-1.5 group-hover:border-[#1A1A1A] transition-colors duration-150">
                        Open {inst.name}
                        <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                      </span>
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
      <div className="w-16 h-16 overflow-hidden bg-[#F7F7F5] shrink-0 flex items-center justify-center">
        {artworkUrl ? (
          <img src={resolveArtworkUrl(artworkUrl) || ''} alt={shareTitle} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[24px] font-bold text-[#C4C4C4]">&#9835;</span>
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
          <p className="text-[14px] font-bold text-black truncate">{track.title}</p>
          <span className="text-[11px] text-[#8A8A8A] shrink-0">{shareTitle}</span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 bg-[#F7F7F5] rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-black rounded-full transition-all duration-100 group-hover:bg-[#333]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] font-mono text-[#8A8A8A]">{formatTime(currentTime)}</span>
          <span className="text-[11px] font-mono text-[#8A8A8A]">{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}


/* ———————— Smart Progress ———————— */

function SmartProgress({
  projectId,
  conceptReady,
  hasResearch,
  hasPrompts,
  trackCount,
  lyricSessionCount,
  shareCount,
}: {
  projectId: string;
  conceptReady: boolean;
  hasResearch: boolean;
  hasPrompts: boolean;
  trackCount: number;
  lyricSessionCount: number;
  shareCount: number;
}) {
  const steps = [
    { label: 'Concept defined', done: conceptReady, href: undefined },
    { label: 'Research complete', done: hasResearch, href: `/projects/${projectId}/research` },
    { label: 'Sounds ready', done: hasPrompts, href: `/projects/${projectId}/prompts` },
    { label: lyricSessionCount > 0 ? `${lyricSessionCount} lyric session${lyricSessionCount !== 1 ? 's' : ''}` : 'Lyrics started', done: lyricSessionCount > 0, href: `/projects/${projectId}/lyrics` },
    { label: shareCount > 0 ? `${shareCount} track${shareCount !== 1 ? 's' : ''} shared` : 'Music shared', done: shareCount > 0, href: `/projects/${projectId}/share` },
  ];

  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  const progressCopy = () => {
    if (completed === 0) return "Let\u2019s get started";
    if (percent >= 100) return 'Launch-ready';
    if (percent >= 80) return 'Almost there';
    if (percent >= 60) return 'Good momentum';
    return `${completed} of ${steps.length} milestones`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
          Progress
        </p>
        <p className="text-[12px] font-medium text-[#8A8A8A]">
          {progressCopy()}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Track */}
        <div className="h-1 bg-[#F7F7F5] rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full progress-spring"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Milestone nodes + labels positioned along the bar */}
        <div className="relative mt-0">
          {steps.map((step, i) => {
            // Position each milestone evenly: first at 0%, last at 100%
            const position = steps.length > 1 ? (i / (steps.length - 1)) * 100 : 0;
            const isFilled = i < completed; // filled if before current progress
            const isCurrent = i === completed; // the next milestone to hit

            // First item: left-aligned, last: right-aligned, middle: centered
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            const alignment = isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center';
            const translateX = isFirst ? '0%' : isLast ? '-100%' : '-50%';

            const node = (
              <div
                key={i}
                className={`absolute flex flex-col ${alignment}`}
                style={{ left: `${position}%`, transform: `translateX(${translateX})` }}
              >
                {/* Dot on the bar */}
                <div className={`w-3 h-3 rounded-full border-2 -mt-2 ${
                  step.done
                    ? 'bg-black border-black'
                    : isCurrent
                      ? 'bg-white border-black'
                      : 'bg-white border-[#E8E8E8]'
                }`} style={isFirst ? { marginLeft: 0 } : isLast ? { marginRight: 0 } : {}}>
                  {step.done && (
                    <svg className="w-full h-full text-white p-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Label below */}
                <span className={`text-[11px] mt-2 whitespace-nowrap transition-colors duration-150 ${
                  step.done
                    ? 'font-medium text-[#1A1A1A]'
                    : isCurrent
                      ? 'font-medium text-[#8A8A8A]'
                      : 'text-[#C4C4C4]'
                } ${step.href ? 'hover:text-black' : ''}`}>
                  {step.label}
                </span>
              </div>
            );

            return step.href ? (
              <a key={i} href={step.href} className="contents">{node}</a>
            ) : (
              <span key={i} className="contents">{node}</span>
            );
          })}
        </div>

        {/* Spacer for labels below the bar */}
        <div className="h-10" />
      </div>
    </div>
  );
}

/* ———————— Market Snapshot ———————— */

function formatListeners(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function MarketSnapshot({ report, projectId }: { report: { report: I1Report; confidence: I1Confidence }; projectId: string }) {
  const { comparable_artists, audience_profile, opportunities } = report.report;
  const topComps = (comparable_artists || []).slice(0, 3);
  const topOpp = (opportunities || [])[0];
  const topMarkets = (audience_profile?.top_markets || []).slice(0, 3);

  return (
    <div className="py-10 border-b border-[#E8E8E8]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
            Market Snapshot
          </p>
        </div>
        <a href={`/projects/${projectId}/research`}>
          <Badge variant="action">View Research</Badge>
        </a>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Comparable Artists */}
        <div className="col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
            Comparable Artists
          </p>
          {topComps.length > 0 ? (
            <div className="space-y-3">
              {topComps.map((artist, i) => (
                <a
                  key={i}
                  href={`https://open.spotify.com/search/${encodeURIComponent(artist.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <p className="text-[14px] font-bold text-black group-hover:text-[#1A1A1A] transition-colors duration-150">
                    {artist.name}
                    <span className="text-[#C4C4C4] ml-1.5 text-[11px]">&#8599;</span>
                  </p>
                  <p className="text-[12px] text-[#8A8A8A]">
                    {formatListeners(artist.monthly_listeners)} listeners
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#C4C4C4]">Run research to discover comps</p>
          )}
        </div>

        {/* Audience Profile */}
        <div className="col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
            Audience
          </p>
          {audience_profile ? (
            <div className="space-y-3">
              {audience_profile.primary_age_range && (
                <div>
                  <p className="text-[12px] text-[#8A8A8A]">Age</p>
                  <p className="text-[14px] font-bold text-black">{audience_profile.primary_age_range}</p>
                </div>
              )}
              {audience_profile.gender_split && (
                <div>
                  <p className="text-[12px] text-[#8A8A8A]">Gender</p>
                  <p className="text-[14px] font-bold text-black">{audience_profile.gender_split}</p>
                </div>
              )}
              {topMarkets.length > 0 && (
                <div>
                  <p className="text-[12px] text-[#8A8A8A]">Top Markets</p>
                  <p className="text-[14px] font-bold text-black">{topMarkets.join(', ')}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#C4C4C4]">Run research to profile your audience</p>
          )}
        </div>

        {/* Key Opportunity */}
        <div className="col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
            Opportunity
          </p>
          {topOpp ? (
            <div>
              <p className="text-[14px] font-bold text-black leading-snug">{topOpp.gap}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-[#8A8A8A]">
                  Market score: {topOpp.market_score}
                </span>
                <span className="text-[11px] text-[#8A8A8A]">
                  Success: {topOpp.success_probability}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#C4C4C4]">Run research to find your gap</p>
          )}
        </div>
      </div>
    </div>
  );
}

