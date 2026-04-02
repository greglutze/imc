'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import { ButtonV2 } from '../../../../components/ui';
import type {
  LyricSessionListItem,
  LyricTheme,
  Project,
  MoodboardBrief,
  MoodboardImage,
} from '../../../../lib/api';

export default function LyricAdvisorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<LyricSessionListItem[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [themes, setThemes] = useState<LyricTheme[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardBrief | null>(null);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [themesLoading, setThemesLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadData = async () => {
      try {
        const [proj, sessionsData, thumbnails] = await Promise.all([
          api.getProject(id),
          api.getLyricSessions(id),
          api.getMoodboardThumbnails(id).catch(() => []),
        ]);
        setProject(proj);
        setSessions(sessionsData.sessions);
        setMoodboardImages(thumbnails);
        if (proj.moodboard_brief) {
          setMoodboard(proj.moodboard_brief as MoodboardBrief);
        }
      } catch (err) {
        console.error('Failed to load lyric advisor data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id]);

  // Load themes after project data is available
  const loadThemes = useCallback(async (regenerate = false) => {
    if (!id) return;
    setThemesLoading(true);
    try {
      const result = await api.getLyricThemes(id, regenerate);
      setThemes(result.themes);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setThemesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!project?.concept || !id) return;
    loadThemes();
  }, [project, id, loadThemes]);

  const handleThemeSelect = useCallback(async (theme: LyricTheme) => {
    if (!id || creating) return;
    setCreating(theme.id);
    try {
      const session = await api.createLyricSession(id, {
        entry_mode: 'vibe',
        title: theme.title,
        vibe_context: theme.vibe_context,
      });
      router.push(`/projects/${id}/lyrics/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setCreating(null);
    }
  }, [id, creating, router]);

  const handleNewBlankSession = useCallback(async (mode: 'paste' | 'conversation' | 'vibe') => {
    if (!id || creating) return;
    setCreating(mode);
    try {
      const session = await api.createLyricSession(id, { entry_mode: mode });
      router.push(`/projects/${id}/lyrics/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setCreating(null);
    }
  }, [id, creating, router]);

  // Map moodboard images to themes — one image per theme, cycling if fewer images
  const getImageForTheme = (index: number): string | null => {
    if (moodboardImages.length === 0) return null;
    const img = moodboardImages[index % moodboardImages.length];
    return img?.image_data || null;
  };

  const artistName = project?.artist_name || 'Untitled';

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-medium text-neutral-100 -ml-1">LA</p>
        <p className="text-[40px] leading-[1.1] font-semibold text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  const hasConcept = !!project?.concept;

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="lyrics" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {/* Header */}
          <div className="mb-10">
            <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-2">
              Lyric Collaborator
            </p>
            <p className="text-[40px] leading-[1.1] font-semibold text-black tracking-tight">
              LyriCol
            </p>
            {moodboard?.prose ? (
              <div className="mt-5 max-w-2xl">
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const pills: { label: string; value: string }[] = [];
                    if (moodboard.atmosphere) pills.push({ label: 'Atmosphere', value: moodboard.atmosphere });
                    if (moodboard.texture) pills.push({ label: 'Texture', value: moodboard.texture });
                    if (moodboard.emotional_register) pills.push({ label: 'Emotion', value: moodboard.emotional_register });
                    return pills.map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-transparent text-neutral-600 text-[13px] px-3 py-1.5">
                        <span className="font-semibold text-[#8A8A8A] uppercase tracking-wide text-[10px]">{item.label}</span>
                        <span>{item.value}</span>
                      </span>
                    ));
                  })()}
                </div>
                {moodboard.tempo_feel && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-transparent text-neutral-600 text-[13px] px-3 py-1.5">
                      <span className="font-semibold text-[#8A8A8A] uppercase tracking-wide text-[10px]">Tempo</span>
                      <span>{moodboard.tempo_feel}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-body-lg text-neutral-500 mt-3 max-w-md">
                A creative collaborator that helps you find the right words — without writing them for you.
              </p>
            )}
          </div>

          {/* New Session button */}
          <div className="mb-10">
            <button
              onClick={() => handleNewBlankSession('conversation')}
              disabled={creating !== null}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-[13px] font-medium px-5 py-2.5 rounded-full hover:bg-[#333] transition-colors duration-150 disabled:opacity-50"
            >
              {creating === 'conversation' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-[18px] leading-none">+</span>
              )}
              New Session
            </button>
          </div>

          {/* Theme cards with moodboard images */}
          {hasConcept && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Starting Points
                </p>
                {themes.length > 0 && !themesLoading && (
                  <ButtonV2 onClick={() => loadThemes(true)} variant="ghost" size="sm">
                    Regenerate
                  </ButtonV2>
                )}
              </div>

              {themesLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[4/3] bg-neutral-100 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : themes.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((theme, index) => {
                    const imageUrl = getImageForTheme(index);
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeSelect(theme)}
                        disabled={creating !== null}
                        className="text-left rounded-sm overflow-hidden group relative aspect-[4/3] cursor-pointer"
                        style={{ minHeight: '200px' }}
                      >
                        {/* Background image or dark fallback */}
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-neutral-900" />
                        )}

                        {/* Gradient overlay for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/90 group-hover:via-black/40 transition-all duration-300" />

                        {/* Content */}
                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <p className="text-[22px] leading-tight font-bold text-white drop-shadow-sm">
                            {theme.title}
                          </p>
                          <p className="text-[13px] leading-snug text-white/70 mt-1.5">
                            {theme.subtitle}
                          </p>
                        </div>

                        {/* Hover border */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-sm transition-all duration-300" />

                        {/* Loading state */}
                        {creating === theme.id && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Previous sessions */}
          {sessions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                Sessions
              </p>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <a
                    key={session.id}
                    href={`/projects/${id}/lyrics/${session.id}`}
                    className="block border border-[#E8E8E8] rounded-md p-5 hover:border-black transition-colors duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body font-bold text-black group-hover:text-black">
                          {session.title || 'Untitled Session'}
                        </p>
                        {session.lyrics_preview && (
                          <p className="text-body-sm text-neutral-400 mt-1 truncate max-w-lg">
                            {session.lyrics_preview}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-caption text-neutral-300">
                          {session.message_count} messages
                        </span>
                        <span className="text-caption text-neutral-300">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasConcept && (
            <div className="border border-dashed border-neutral-300 rounded-md p-8 text-center mt-4">
              <p className="text-body text-neutral-500">
                Define your artist concept first to unlock AI-generated writing themes based on your sonic moodboard.
              </p>
            </div>
          )}

          <p className="text-caption text-neutral-300 mt-10 italic">
            Everything you write is yours.
          </p>
        </div>
      </div>
    </div>
  );
}
