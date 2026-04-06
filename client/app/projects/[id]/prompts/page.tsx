'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StyleProfile from '../../../../components/StyleProfile';
import TrackPrompts from '../../../../components/TrackPrompts';
import ProjectNav from '../../../../components/ProjectNav';
import NextStepBanner from '../../../../components/NextStepBanner';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { I2StyleProfile, I2VocalistPersona, I2Track, Project, I1Report } from '../../../../lib/api';
import { ButtonV2 } from '../../../../components/ui';

type I2View = 'style' | 'tracks';

export default function PromptsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<I2View>('style');
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [styleProfile, setStyleProfile] = useState<I2StyleProfile | null>(null);
  const [vocalistPersona, setVocalistPersona] = useState<I2VocalistPersona | null>(null);
  const [tracks, setTracks] = useState<I2Track[]>([]);
  const [promptsId, setPromptsId] = useState<string | null>(null);
  const [report, setReport] = useState<I1Report | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const autoGenerateTriggered = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load prompts data on mount
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadData = async () => {
      try {
        const proj = await api.getProject(id);
        setProject(proj);

        // Try to load existing prompts
        try {
          const prompts = await api.getPrompts(id);
          setStyleProfile(prompts.style_profile);
          setVocalistPersona(prompts.vocalist_persona);
          setTracks(prompts.tracks);
          setPromptsId(prompts.id);
        } catch {
          // No prompts yet — will show generate button
        }

        // Try to load research report for style profile enrichment
        try {
          const reportData = await api.getReport(id);
          setReport(reportData.report);
        } catch {
          // No report yet — style profile will render without market data
        }
      } catch (err) {
        console.error('Failed to load prompts data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id]);

  // Generate prompts via API
  const handleGenerate = useCallback(async () => {
    if (!id) return;

    setGenerating(true);
    try {
      const prompts = await api.generatePrompts(id);
      setStyleProfile(prompts.style_profile);
      setVocalistPersona(prompts.vocalist_persona);
      setTracks(prompts.tracks);
      setPromptsId(prompts.id);
    } catch (err) {
      console.error('Failed to generate prompts:', err);
    } finally {
      setGenerating(false);
    }
  }, [id]);

  // Regenerate a single track
  const handleRegenerate = useCallback(async (trackNumber: number) => {
    if (!promptsId) return;

    setRegenerating(trackNumber);
    try {
      const updated = await api.regenerateTrack(promptsId, trackNumber);
      setTracks(updated.tracks);
    } catch (err) {
      console.error('Failed to regenerate track:', err);
    } finally {
      setRegenerating(null);
    }
  }, [promptsId]);

  const artistName = project?.artist_name || 'Untitled';
  const conceptExists = !!project?.concept?.genre_primary;
  const hasPrompts = !!(styleProfile && tracks.length > 0);

  // Auto-generate prompts on first visit if concept exists but no prompts
  useEffect(() => {
    if (
      !pageLoading &&
      !generating &&
      !hasPrompts &&
      conceptExists &&
      !autoGenerateTriggered.current &&
      id
    ) {
      autoGenerateTriggered.current = true;
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading, generating, hasPrompts, conceptExists, id]);

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 bg-neutral-100 animate-pulse" />
              <span className="text-neutral-200">/</span>
              <div className="h-3 w-24 bg-neutral-100 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 w-14 bg-neutral-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto w-full px-10 pt-10 pb-6">
          <div className="h-3 w-32 bg-neutral-100 animate-pulse mb-4" />
          <div className="h-10 w-64 bg-neutral-100 animate-pulse mb-4" />
          <div className="h-4 w-96 bg-neutral-50 animate-pulse" />
        </div>
      </div>
    );
  }

  // Generating state (first time or regenerate all) — show page structure with skeleton
  if (generating) {
    // Build concept-derived preview content so user sees something meaningful
    const concept = project?.concept;
    const previewAesthetic = concept
      ? `A ${concept.genre_primary}-rooted project${concept.mood_keywords?.length ? ` with ${concept.mood_keywords.slice(0, 3).join(', ')} sensibilities` : ''}. ${concept.creative_direction ? concept.creative_direction.slice(0, 300) : 'Building your sonic identity...'}`
      : 'Building your sonic identity...';
    const previewSignatures = concept?.mood_keywords?.length
      ? concept.mood_keywords.slice(0, 6).map((m: string) => `${m} textures`)
      : ['Loading sonic signatures...'];

    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

        <div className="max-w-[1400px] mx-auto w-full px-10">
          <div className="pt-10 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[13px] font-medium text-[#C4C4C4]">
                Production Intelligence
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-signal-blue rounded-full animate-pulse" />
                <span className="text-[11px] text-[#8A8A8A]">Generating...</span>
              </div>
            </div>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Sonic Engine
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
              Translating your concept and market data into production-ready style profiles, vocal direction, and per-track prompts.
            </p>
          </div>

          {/* Skeleton tabs */}
          <div className="flex items-center gap-6 border-b border-[#E8E8E8] pb-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide pb-3 text-black border-b-2 border-black -mb-px">
              Style Profile
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide pb-3 text-[#8A8A8A]">
              Demo Prompts
            </span>
          </div>
        </div>

        {/* Skeleton style profile preview using concept data */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-10 py-10">
            <div className="mb-10">
              <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                Production Aesthetic
              </p>
              <blockquote className="text-[22px] leading-[1.4] text-[#1A1A1A]/60 max-w-3xl animate-pulse">
                {previewAesthetic}
              </blockquote>
            </div>

            <div className="mb-8">
              <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                Sonic Signatures
              </p>
              <div className="flex flex-wrap gap-2">
                {previewSignatures.map((sig: string, i: number) => (
                  <span key={i} className="text-[13px] text-[#8A8A8A] bg-[#F7F7F5] px-4 py-2 rounded-full border border-[#E8E8E8] animate-pulse">
                    {sig}
                  </span>
                ))}
              </div>
            </div>

            {/* Track count skeleton */}
            {concept?.track_count && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                  Tracks
                </p>
                <div className="space-y-3">
                  {Array.from({ length: concept.track_count }, (_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <span className="text-[13px] font-mono text-[#C4C4C4] w-6">{String(i + 1).padStart(2, '0')}</span>
                      <div className="h-4 bg-neutral-100" style={{ width: `${120 + Math.random() * 100}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No concept yet — can't generate
  if (!hasPrompts && !conceptExists) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

        <div className="max-w-[1400px] px-10 py-16">
          <p className="text-[13px] font-medium text-[#C4C4C4] mb-3">02</p>
          <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] mt-4 tracking-tight">
            Start With Your Concept
          </p>
          <p className="text-[14px] text-[#8A8A8A] mt-5 max-w-md leading-relaxed">
            Head to the Concept tab and describe your vision first. Once that&apos;s locked in, your prompts will generate automatically.
          </p>
        </div>
      </div>
    );
  }

  // Concept exists but prompts failed or haven't generated — show manual trigger
  if (!hasPrompts && conceptExists && !generating) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

        <div className="max-w-[1400px] mx-auto px-10 py-16">
          <p className="text-[13px] font-medium text-[#C4C4C4] mb-3">02</p>
          <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] mt-4 tracking-tight">
            Sonic Engine
          </p>
          <p className="text-[14px] text-[#8A8A8A] mt-5 max-w-md leading-relaxed">
            Your concept is ready. Generate your style profiles, vocal direction, and per-track prompts.
          </p>
          <div className="mt-8">
            <ButtonV2
              onClick={() => {
                autoGenerateTriggered.current = false;
                handleGenerate();
              }}
              size="lg"
              arrow
            >
              Generate Sonic Engine
            </ButtonV2>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'style', label: 'Style Profile' },
    { id: 'tracks', label: 'Demo Prompts', count: tracks.length },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

      {/* Editorial header */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <div className="pt-10 pb-6 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#C4C4C4] mb-2">
              Production Intelligence
            </p>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Sonic Engine
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
              Your concept and market data, translated into production-ready style profiles, vocal direction, and per-track prompts.
            </p>
          </div>
          {hasPrompts && (
            <ButtonV2
              onClick={() => {
                autoGenerateTriggered.current = false;
                handleGenerate();
              }}
              className="shrink-0 mt-6"
            >
              Regenerate All
            </ButtonV2>
          )}
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-6 border-b border-[#E8E8E8] pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as I2View)}
                className={`
                  text-[11px] font-semibold uppercase tracking-wide pb-3 transition-colors duration-150
                  ${isActive
                    ? 'text-black border-b-2 border-black -mb-px'
                    : 'text-[#8A8A8A] hover:text-black'
                  }
                `}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-neutral-300">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'style' && styleProfile && (
            <StyleProfile
              styleProfile={styleProfile}
              concept={project?.concept || undefined}
              sonicBlueprint={report?.sonic_blueprint || undefined}
              vocalistPersona={vocalistPersona || undefined}
            />
          )}

          {activeTab === 'tracks' && (
            <TrackPrompts
              tracks={tracks}
              onRegenerateTrack={handleRegenerate}
              regenerating={regenerating}
            />
          )}
        </div>

        {/* Wayfinding — next steps */}
        <NextStepBanner
          completedLabel="Production intelligence ready"
          primary={{ label: 'Start Writing Lyrics', href: `/projects/${id}/lyrics` }}
          secondary={{ label: 'Back to overview', href: `/projects/${id}` }}
        />
      </div>
    </div>
  );
}
