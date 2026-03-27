'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Tabs } from '../../../../components/ui';
import StyleProfile from '../../../../components/StyleProfile';
import TrackPrompts from '../../../../components/TrackPrompts';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { I2StyleProfile, I2VocalistPersona, I2Track, Project } from '../../../../lib/api';

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
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
  const hasPrompts = styleProfile && tracks.length > 0;

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">02</p>
        <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  // No prompts yet — show generate CTA
  if (!hasPrompts && !generating) {
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
              <a href={`/projects/${id}`} className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast">
                {artistName}
              </a>
              <span className="text-neutral-200">/</span>
              <span className="text-micro font-bold uppercase tracking-widest text-black">
                Prompts
              </span>
            </div>
            <span className="text-micro font-mono text-neutral-300">Instrument 02</span>
          </div>
        </div>

        <div className="max-w-[1400px] px-10 py-16">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">02</p>
          <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
            Generate Prompts
          </p>
          <p className="text-body-lg text-black mt-5 max-w-md">
            Create Suno and Udio prompts based on your concept and market research.
            Style profiles, vocalist personas, and track-by-track prompt sheets.
          </p>
          <button
            onClick={handleGenerate}
            className="mt-8 bg-black text-white text-label font-bold uppercase tracking-widest h-12 px-8 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
          >
            Generate Prompts
          </button>
        </div>
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <div className="border-b border-neutral-200">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2">
                <span className="text-body">&#8592;</span>
                IMC
              </a>
              <span className="text-neutral-200">/</span>
              <span className="text-micro font-bold uppercase tracking-widest text-black">
                {artistName}
              </span>
              <span className="text-neutral-200">/</span>
              <span className="text-micro font-bold uppercase tracking-widest text-black">
                Prompts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="blue">Generating</Badge>
              <span className="text-micro font-mono text-neutral-300">Instrument 02</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 py-16">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">02</p>
          <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
            Generating Prompts
          </p>
          <p className="text-body-lg text-black mt-5 max-w-sm">
            Creating style profiles, vocalist personas, and per-track
            Suno &amp; Udio prompts from your concept and market research.
          </p>
          <div className="mt-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-signal-blue rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-signal-blue rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-signal-blue rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'style', label: 'Style Profile' },
    { id: 'tracks', label: 'Tracks', count: tracks.length },
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
            <a href={`/projects/${id}`} className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast">
              {artistName}
            </a>
            <span className="text-neutral-200">/</span>
            <span className="text-micro font-bold uppercase tracking-widest text-black">
              Prompts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="blue">Complete</Badge>
            <span className="text-micro font-mono text-neutral-300">
              Instrument 02
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as I2View)} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'style' && styleProfile && vocalistPersona && (
            <StyleProfile
              styleProfile={styleProfile}
              vocalistPersona={vocalistPersona}
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
      </div>
    </div>
  );
}
