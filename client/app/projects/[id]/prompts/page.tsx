'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TrackPrompts from '../../../../components/TrackPrompts';
import ProjectNav from '../../../../components/ProjectNav';
import NextStepBanner from '../../../../components/NextStepBanner';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { I2StyleProfile, I2VocalistPersona, I2Track, Project } from '../../../../lib/api';
import { Badge, ButtonV2 } from '../../../../components/ui';

function VocalDirectionSection({ vocalistPersona }: { vocalistPersona: I2VocalistPersona }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build a concise, copyable Suno vocal prompt from the persona data
  const sunoVocalPrompt = `[Vocal Style: ${vocalistPersona.vocal_character.split('.')[0].trim()}. ${vocalistPersona.delivery_style.split('.')[0].trim()}. Tone: ${vocalistPersona.tone_keywords.slice(0, 5).join(', ')}]`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sunoVocalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="py-10 border-b border-[#E8E8E8]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
        Vocal Direction
      </p>

      {/* Suno Vocal Prompt — prominent, copyable */}
      <div className="bg-[#F7F7F5] p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
            Suno Vocal Prompt
          </p>
          <Badge variant="action" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </Badge>
        </div>
        <p className="text-[13px] text-[#1A1A1A] font-mono leading-relaxed">
          {sunoVocalPrompt}
        </p>
      </div>

      {/* Tone keywords always visible */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {vocalistPersona.tone_keywords.map((kw, i) => (
          <span key={i} className="text-[11px] font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
            {kw}
          </span>
        ))}
      </div>

      {/* Collapsible detail for Character & Delivery */}
      <button
        type="button"
        className="flex items-center gap-2 text-[11px] font-medium text-[#C4C4C4] hover:text-[#8A8A8A] uppercase tracking-wide transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide' : 'Show'} full character & delivery
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[11px] text-[#C4C4C4] uppercase tracking-wide mb-2">Character</p>
            <p className="text-[14px] text-[#1A1A1A] leading-relaxed">{vocalistPersona.vocal_character}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#C4C4C4] uppercase tracking-wide mb-2">Delivery</p>
            <p className="text-[14px] text-[#1A1A1A] leading-relaxed">{vocalistPersona.delivery_style}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromptsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [styleProfile, setStyleProfile] = useState<I2StyleProfile | null>(null);
  const [vocalistPersona, setVocalistPersona] = useState<I2VocalistPersona | null>(null);
  const [tracks, setTracks] = useState<I2Track[]>([]);
  const [promptsId, setPromptsId] = useState<string | null>(null);
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
        <div className="max-w-[1400px] mx-auto w-full px-10 pt-10 pb-6">
          <div className="h-3 w-32 skel mb-4" />
          <div className="h-10 w-64 skel skel-delay-1 mb-4" />
          <div className="h-4 w-96 skel skel-delay-2" />
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
              Sounds
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
              Translating your concept and market data into production-ready style profiles, vocal direction, and per-track prompts.
            </p>
          </div>

        </div>

        {/* Skeleton tracks */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-10 py-10">
            {concept?.track_count && (
              <div className="space-y-8">
                {Array.from({ length: concept.track_count }, (_, i) => (
                  <div key={i} className="border-b border-[#E8E8E8] pb-8 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[13px] font-mono text-[#C4C4C4]">{String(i + 1).padStart(2, '0')}</span>
                      <div className="h-6 bg-[#F7F7F5]" style={{ width: `${140 + Math.random() * 120}px` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#F7F7F5] h-32" />
                      <div className="bg-[#F7F7F5] h-32" />
                    </div>
                  </div>
                ))}
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
            Sounds
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
              Generate Sounds
            </ButtonV2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-reveal h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10">

          {/* Editorial header — compact */}
          <div className="pt-10 pb-8 border-b border-[#E8E8E8]">
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Sounds
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-3 max-w-lg leading-relaxed">
              Production-ready prompts and lyrics for each track, built from your concept and research.
            </p>
          </div>

          {/* ———— TRACKS — primary content ———— */}
          <TrackPrompts
            tracks={tracks}
            onRegenerateTrack={handleRegenerate}
            regenerating={regenerating}
          />

          {/* ———— SOUND PROFILE — condensed context below tracks ———— */}
          {styleProfile && (
            <div className="border-t border-[#E8E8E8]">
              {/* Production Aesthetic */}
              <div className="py-10 border-b border-[#E8E8E8]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                  Production Aesthetic
                </p>
                <blockquote className="text-[20px] leading-[1.4] font-medium text-[#1A1A1A] max-w-3xl tracking-tight">
                  &ldquo;{styleProfile.production_aesthetic}&rdquo;
                </blockquote>
              </div>

              {/* Sonic Signatures — inline pills instead of card grid */}
              {styleProfile.sonic_signatures.length > 0 && (
                <div className="py-10 border-b border-[#E8E8E8]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                    Sonic Signatures
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.sonic_signatures.map((sig, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full"
                      >
                        {sig.split(' — ')[0].split(': ').pop()?.trim() || sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocal Direction — Suno prompt + collapsible detail */}
              {vocalistPersona && (
                <VocalDirectionSection vocalistPersona={vocalistPersona} />
              )}

              {/* Tempo & Key — single compact row */}
              <div className="py-10 border-b border-[#E8E8E8]">
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3">
                      Tempo Range
                    </p>
                    <p className="text-[22px] font-medium text-[#1A1A1A] tracking-tight">
                      {styleProfile.tempo_range}
                    </p>
                  </div>
                  <div className="col-span-8">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3">
                      Key Preferences
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {styleProfile.key_preferences.map((k, i) => (
                        <span key={i} className="text-[11px] font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                          {k.split(' — ')[0].split(': ').pop()?.trim() || k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
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
