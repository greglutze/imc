'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import { Badge, ButtonV2 } from '../../../../components/ui';
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
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Lyrics
            </p>
            <p className="text-[20px] leading-[1.4] font-medium text-[#1A1A1A] mt-3 max-w-3xl tracking-tight">
              A creative collaborator that helps you find the right words.
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

          {/* Sessions — user's work + demo tracks combined */}
          {(sessions.length > 0 || demoTracks.length > 0) && (
            <div className="mb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                My Sessions
              </p>
              <div className="space-y-3 stagger-enter">
                {/* User sessions first */}
                {sessions.map((session) => {
                  const isFromDemo = demoTracks.some(t => t.title === session.title);
                  return (
                    <SessionRow
                      key={session.id}
                      title={session.title || 'Untitled Session'}
                      subtitle={session.lyrics_preview}
                      date={session.updated_at}
                      tag={isFromDemo ? 'from sounds' : undefined}
                      href={`/projects/${id}/lyrics/${session.id}`}
                      onDelete={async () => {
                        await api.deleteLyricSession(id, session.id);
                        setSessions(prev => prev.filter(s => s.id !== session.id));
                      }}
                    />
                  );
                })}

                {/* Demo tracks with "from sounds" tag — hide if session already exists for this track */}
                {demoTracks
                  .filter(track => !sessions.some(s => s.title === track.title))
                  .map((track) => (
                  <SessionRow
                    key={`demo-${track.track_number}`}
                    title={track.title}
                    subtitle={(track.lyrics || '').replace(/\\n/g, ' ').slice(0, 100) + '...'}
                    tag="from sounds"
                    onClick={() => handleOpenTrackLyrics(track)}
                    loading={creating === `track-${track.track_number}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Starting Points — theme cards (inspiration, lower priority) */}
          {hasConcept && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Writing Prompts
                </p>
                {themes.length > 0 && !themesLoading && (
                  <Badge variant="action" onClick={() => loadThemes(true)}>
                    Regenerate
                  </Badge>
                )}
              </div>

              {themesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#F7F7F5] h-24 skel" />
                  ))}
                </div>
              ) : themes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 stagger-enter">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      disabled={creating !== null}
                      className="group text-left border border-[#E8E8E8] hover:border-[#C4C4C4] px-5 py-4 transition-all duration-150 relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-medium text-[#1A1A1A] leading-tight">
                            {theme.title}
                          </h3>
                          <p className="text-[12px] text-[#8A8A8A] mt-1.5 line-clamp-2 leading-relaxed">
                            {theme.subtitle}
                          </p>
                        </div>
                        {creating === theme.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                        ) : (
                          <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150 shrink-0 mt-0.5">&rarr;</span>
                        )}
                      </div>
                      {theme.mood && (
                        <span className="inline-block text-[10px] font-medium text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full mt-3">
                          {theme.mood.toLowerCase()}
                        </span>
                      )}
                    </button>
                  ))}
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

        </div>
      </div>
    </div>
  );
}

/** Unified session row with ⋯ menu for delete */
function SessionRow({
  title,
  subtitle,
  date,
  tag,
  href,
  onClick,
  loading,
  onDelete,
}: {
  title: string;
  subtitle?: string | null;
  date?: string;
  tag?: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  onDelete?: () => Promise<void>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setDeleting(false);
      setMenuOpen(false);
      setConfirmingDelete(false);
    }
  };

  const Wrapper = href ? 'a' : 'button';
  const wrapperProps = href
    ? { href }
    : { onClick, disabled: loading, type: 'button' as const };

  return (
    <div className="relative group flex items-center bg-[#F7F7F5] hover:bg-[#F0F0ED] card-hover">
      <Wrapper
        {...(wrapperProps as any)}
        className="flex-1 flex items-center gap-6 px-7 py-5 text-left min-w-0"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin shrink-0" />
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="text-[16px] font-medium text-[#1A1A1A]">
              {title}
            </p>
            {tag && (
              <span className="text-[10px] font-medium text-[#8A8A8A] border border-[#E8E8E8] px-2 py-0.5 rounded-full">
                {tag}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[13px] text-[#8A8A8A] mt-1 truncate max-w-lg">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {date && (
            <span className="text-[11px] font-medium text-[#C4C4C4]">
              {new Date(date).toLocaleDateString()}
            </span>
          )}
          <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
        </div>
      </Wrapper>

      {/* ⋯ menu */}
      {onDelete && (
        <div className="relative shrink-0 pr-5" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }}
            className="text-[20px] text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 px-2 py-1"
            aria-label={`Options for ${title}`}
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-[#E8E8E8] z-50 min-w-[200px]">
              {confirmingDelete ? (
                <div className="px-4 py-3">
                  <p className="text-[13px] font-medium text-[#1A1A1A] mb-1">
                    Delete &ldquo;{title}&rdquo;?
                  </p>
                  <p className="text-[11px] text-[#8A8A8A] mb-3">This can&apos;t be undone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      disabled={deleting}
                      className="text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); setMenuOpen(false); }}
                      className="text-[12px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                  className="w-full text-left px-4 py-3 text-[13px] text-red-600 hover:bg-[#F7F7F5] transition-colors"
                >
                  Delete Session
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
