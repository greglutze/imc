'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StyleProfile from '../../../../components/StyleProfile';
import TrackPrompts from '../../../../components/TrackPrompts';
import VocalistPersona from '../../../../components/VocalistPersona';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { I2StyleProfile, I2VocalistPersona, I2Track, Project, I1Report } from '../../../../lib/api';

type I2View = 'style' | 'tracks' | 'vocalist';

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
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">02</p>
        <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  // Generating state (first time or regenerate all)
  if (generating) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

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

  // No concept yet — can't generate
  if (!hasPrompts && !project?.concept?.genre_primary) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

        <div className="max-w-[1400px] px-10 py-16">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">02</p>
          <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
            No Concept Yet
          </p>
          <p className="text-body-lg text-black mt-5 max-w-md">
            Complete the concept interview first. Prompts will generate
            automatically when you return here.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'style', label: 'Style Profile' },
    { id: 'tracks', label: 'Demo Prompts', count: tracks.length },
    { id: 'vocalist', label: 'Vocalist Persona' },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="prompts" />

      {/* Editorial header */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <div className="pt-10 pb-6 flex items-start justify-between">
          <div>
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
              AI-Generated Suno &amp; Udio Prompts
            </p>
            <p className="text-[40px] leading-[1.1] font-bold text-black tracking-tight">
              Sonic Engine
            </p>
            <p className="text-body-lg text-neutral-500 mt-4 max-w-lg">
              Style profiles, vocalist personas, and per-track prompts tuned to your concept and market data.
            </p>
          </div>
          {hasPrompts && (
            <button
              onClick={() => {
                autoGenerateTriggered.current = false;
                handleGenerate();
              }}
              className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:bg-neutral-800 transition-colors duration-fast shrink-0 mt-6"
            >
              Regenerate All
            </button>
          )}
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-200 pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as I2View)}
                className={`
                  text-label font-bold uppercase tracking-widest pb-3 transition-colors duration-fast
                  ${isActive
                    ? 'text-black border-b-2 border-black -mb-px'
                    : 'text-neutral-400 hover:text-black'
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
            />
          )}

          {activeTab === 'tracks' && (
            <TrackPrompts
              tracks={tracks}
              onRegenerateTrack={handleRegenerate}
              regenerating={regenerating}
            />
          )}

          {activeTab === 'vocalist' && vocalistPersona && (
            <VocalistPersona vocalistPersona={vocalistPersona} />
          )}
        </div>
      </div>
    </div>
  );
}
