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
  I2Track,
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
  const [demoTracks, setDemoTracks] = useState<I2Track[]>([]);
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
        // Fetch demo tracks for auto-seeded lyrics
        try {
          const prompts = await api.getPrompts(id);
          if (prompts.tracks && prompts.tracks.length > 0) {
            setDemoTracks(prompts.tracks.filter((t: I2Track) => t.lyrics));
          }
        } catch {}
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

  const handleOpenTrackLyrics = useCallback(async (track: I2Track) => {
    if (!id || creating) return;
    setCreating(`track-${track.track_number}`);
    try {
      const lyrics = (track.lyrics || '').replace(/\\n/g, '\n');
      const session = await api.createLyricSession(id, {
        entry_mode: 'paste',
        title: track.title,
        lyrics,
      });
      router.push(`/projects/${id}/lyrics/${session.id}`);
    } catch (err) {
      console.error('Failed to create session from track:', err);
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
      <div className="animate-fade-in px-10 py-16 max-w-2xl">
        <div className="h-3 w-12 skel mb-4" />
        <div className="h-10 w-48 skel skel-delay-1 mb-6" />
        <div className="h-4 w-80 skel skel-delay-2 mb-3" />
        <div className="h-4 w-60 skel skel-delay-3" />
      </div>
    );
  }

  const hasConcept = !!project?.concept;

  return (
    <div className="content-reveal h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="lyrics" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[13px] font-medium text-[#C4C4C4] mb-2">
              Writing Collaborator
            </p>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Lyrics
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-md leading-relaxed">
              A creative collaborator that helps you find the right words — without writing them for you.
            </p>
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

          {/* Sessions — user's work comes first */}
          {sessions.length > 0 && (
            <div className="mb-12">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4] mb-4">
                Sessions
              </p>
              <div className="space-y-3 stagger-enter">
                {sessions.map((session) => (
                  <a
                    key={session.id}
                    href={`/projects/${id}/lyrics/${session.id}`}
                    className="group bg-[#F7F7F5] hover:bg-[#F0F0ED] card-hover flex items-center gap-6 px-7 py-5 block"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-[#1A1A1A]">
                        {session.title || 'Untitled Session'}
                      </p>
                      {session.lyrics_preview && (
                        <p className="text-[13px] text-[#8A8A8A] mt-1 truncate max-w-lg">
                          {session.lyrics_preview}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[11px] font-medium text-[#C4C4C4]">
                        {session.message_count} messages
                      </span>
                      <span className="text-[11px] font-medium text-[#C4C4C4]">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </span>
                      <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Demo Track Drafts — auto-seeded from Sounds */}
          {demoTracks.length > 0 && (
            <div className="mb-12">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4] mb-1">
                From Sounds
              </p>
              <p className="text-[13px] text-[#8A8A8A] mb-4">
                Demo lyrics generated with your tracks — click to start refining.
              </p>
              <div className="space-y-3 stagger-enter">
                {demoTracks.map((track) => (
                  <button
                    key={track.track_number}
                    onClick={() => handleOpenTrackLyrics(track)}
                    disabled={creating !== null}
                    className="group w-full text-left bg-[#F7F7F5] hover:bg-[#F0F0ED] card-hover flex items-center gap-6 px-7 py-5"
                  >
                    <span className="text-[11px] font-mono text-[#C4C4C4] shrink-0">
                      {String(track.track_number).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-[#1A1A1A]">
                        {track.title}
                      </p>
                      <p className="text-[13px] text-[#8A8A8A] mt-1 truncate max-w-lg">
                        {(track.lyrics || '').replace(/\\n/g, ' ').slice(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {creating === `track-${track.track_number}` ? (
                        <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-full px-4 py-1.5 group-hover:border-[#1A1A1A] transition-colors duration-150">
                          Refine <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Starting Points — theme cards (inspiration, lower priority) */}
          {hasConcept && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4]">
                  Need Inspiration?
                </p>
                {themes.length > 0 && !themesLoading && (
                  <ButtonV2 onClick={() => loadThemes(true)} variant="ghost" size="sm">
                    Regenerate
                  </ButtonV2>
                )}
              </div>

              {themesLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#F7F7F5] p-7 min-h-[200px] skel" />
                  ))}
                </div>
              ) : themes.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((theme, index) => {
                    const imageUrl = getImageForTheme(index);
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeSelect(theme)}
                        disabled={creating !== null}
                        className="text-left bg-[#F7F7F5] overflow-hidden hover:bg-[#F0F0ED] card-hover flex flex-col group relative"
                      >
                        {/* Image strip */}
                        {imageUrl && (
                          <div className="aspect-[3/1] w-full overflow-hidden bg-[#EEEDEB]">
                            <img
                              src={imageUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6 pb-5 flex flex-col flex-1 justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-medium text-[#C4C4C4]">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {theme.mood && (
                                <span className="text-[11px] font-medium text-[#8A8A8A]">
                                  {theme.mood}
                                </span>
                              )}
                            </div>
                            <h3 className="text-[18px] leading-tight font-medium text-[#1A1A1A]">
                              {theme.title}
                            </h3>
                            <p className="text-[13px] text-[#8A8A8A] mt-2 leading-relaxed">
                              {theme.subtitle}
                            </p>
                          </div>

                          <div className="mt-5">
                            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-full px-4 py-1.5 group-hover:border-[#1A1A1A] transition-colors duration-150">
                              Start Writing <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                            </span>
                          </div>
                        </div>

                        {/* Loading state */}
                        {creating === theme.id && (
                          <div className="absolute inset-0 bg-[#F7F7F5]/80 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {!hasConcept && sessions.length === 0 && demoTracks.length === 0 && (
            <div className="bg-[#F7F7F5] p-8 text-center mt-4">
              <p className="text-[14px] text-[#8A8A8A]">
                Define your artist concept first to unlock AI-generated writing themes based on your sonic moodboard.
              </p>
            </div>
          )}

          <p className="text-[11px] text-[#C4C4C4] mt-10 italic">
            Everything you write is yours.
          </p>
        </div>
      </div>
    </div>
  );
}

