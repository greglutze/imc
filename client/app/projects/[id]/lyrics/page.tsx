'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type {
  LyricSessionListItem,
  LyricTheme,
  Project,
  MoodboardBrief,
} from '../../../../lib/api';

const MOOD_COLORS: Record<string, string> = {
  intense: '#FF3B30',
  raw: '#FF6B35',
  aggressive: '#FF453A',
  explosive: '#FF2D55',
  defiant: '#FF375F',
  reflective: '#5856D6',
  melancholic: '#7B61FF',
  vulnerable: '#AF52DE',
  haunted: '#8944AB',
  nostalgic: '#5E5CE6',
  conflicted: '#FF9500',
  anxious: '#FFCC00',
  restless: '#FF9F0A',
  urgent: '#FF6B00',
  desperate: '#FF5722',
  hopeful: '#34C759',
  euphoric: '#30D158',
  transcendent: '#00C7BE',
  liberating: '#32D74B',
  empowered: '#00C853',
};

function getMoodColor(mood: string): string {
  const lower = mood.toLowerCase();
  return MOOD_COLORS[lower] || '#000000';
}

export default function LyricAdvisorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<LyricSessionListItem[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [themes, setThemes] = useState<LyricTheme[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardBrief | null>(null);
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
        const [proj, sessionsData] = await Promise.all([
          api.getProject(id),
          api.getLyricSessions(id),
        ]);
        setProject(proj);
        setSessions(sessionsData.sessions);
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
  useEffect(() => {
    if (!project?.concept || !id) return;

    const loadThemes = async () => {
      setThemesLoading(true);
      try {
        const result = await api.getLyricThemes(id);
        setThemes(result.themes);
      } catch (err) {
        console.error('Failed to load themes:', err);
      } finally {
        setThemesLoading(false);
      }
    };

    loadThemes();
  }, [project, id]);

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

  const artistName = project?.artist_name || 'Untitled';

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">LA</p>
        <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
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
          {/* Header with sonic brief context */}
          <div className="mb-10">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
              LyriCol
            </p>
            <p className="text-[40px] leading-[1.1] font-bold text-black tracking-tight">
              Write Better Lyrics
            </p>
            {moodboard?.prose && (
              <p className="text-body text-neutral-500 mt-4 max-w-2xl leading-relaxed italic">
                &ldquo;{moodboard.prose}&rdquo;
              </p>
            )}
            {moodboard && !moodboard.prose && (
              <p className="text-body-lg text-neutral-500 mt-3 max-w-md">
                A creative collaborator that helps you find the right words — without writing them for you.
              </p>
            )}
          </div>

          {/* Sonic brief chips */}
          {moodboard && (
            <div className="flex flex-wrap gap-2 mb-10">
              {moodboard.atmosphere && (
                <span className="px-3 py-1.5 bg-neutral-100 rounded-sm text-caption text-neutral-600 uppercase tracking-wider font-medium">
                  {moodboard.atmosphere}
                </span>
              )}
              {moodboard.texture && (
                <span className="px-3 py-1.5 bg-neutral-100 rounded-sm text-caption text-neutral-600 uppercase tracking-wider font-medium">
                  {moodboard.texture}
                </span>
              )}
              {moodboard.emotional_register && (
                <span className="px-3 py-1.5 bg-neutral-100 rounded-sm text-caption text-neutral-600 uppercase tracking-wider font-medium">
                  {moodboard.emotional_register}
                </span>
              )}
              {moodboard.tempo_feel && (
                <span className="px-3 py-1.5 bg-neutral-100 rounded-sm text-caption text-neutral-600 uppercase tracking-wider font-medium">
                  {moodboard.tempo_feel}
                </span>
              )}
            </div>
          )}

          {/* Theme cards */}
          {hasConcept && (
            <div className="mb-12">
              <p className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Starting Points
              </p>

              {themesLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-neutral-100 rounded-sm p-6 animate-pulse">
                      <div className="h-3 w-16 bg-neutral-100 rounded mb-3" />
                      <div className="h-5 w-3/4 bg-neutral-100 rounded mb-2" />
                      <div className="h-4 w-full bg-neutral-50 rounded" />
                    </div>
                  ))}
                </div>
              ) : themes.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      disabled={creating !== null}
                      className="text-left border border-neutral-200 rounded-sm p-6 hover:border-black transition-all duration-fast group relative overflow-hidden"
                    >
                      {/* Mood indicator */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getMoodColor(theme.mood) }}
                        />
                        <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                          {theme.mood}
                        </span>
                      </div>

                      <p className="text-heading-sm font-bold text-black group-hover:text-black mb-1">
                        {theme.title}
                      </p>
                      <p className="text-body-sm text-neutral-500 leading-snug">
                        {theme.subtitle}
                      </p>

                      {/* Loading state */}
                      {creating === theme.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Quick start options (always available) */}
          <div className="mb-12">
            <p className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-4">
              {hasConcept && themes.length > 0 ? 'Or start from scratch' : 'New Session'}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleNewBlankSession('paste')}
                disabled={creating !== null}
                className="text-left border border-neutral-200 rounded-sm p-6 hover:border-black transition-colors duration-fast group"
              >
                <p className="text-heading-sm font-bold text-black group-hover:text-black">
                  Paste Lyrics
                </p>
                <p className="text-body-sm text-neutral-500 mt-2">
                  Have a draft? Paste it in and get feedback.
                </p>
              </button>

              <button
                onClick={() => handleNewBlankSession('conversation')}
                disabled={creating !== null}
                className="text-left border border-neutral-200 rounded-sm p-6 hover:border-black transition-colors duration-fast group"
              >
                <p className="text-heading-sm font-bold text-black group-hover:text-black">
                  Start a Conversation
                </p>
                <p className="text-body-sm text-neutral-500 mt-2">
                  Talk about the song — concept, mood, or where you're stuck.
                </p>
              </button>

              <button
                onClick={() => handleNewBlankSession('vibe')}
                disabled={creating !== null}
                className="text-left border border-neutral-200 rounded-sm p-6 hover:border-black transition-colors duration-fast group"
              >
                <p className="text-heading-sm font-bold text-black group-hover:text-black">
                  Describe the Vibe
                </p>
                <p className="text-body-sm text-neutral-500 mt-2">
                  Set the atmosphere and emotional tone before writing.
                </p>
              </button>
            </div>
          </div>

          {/* Previous sessions */}
          {sessions.length > 0 && (
            <div>
              <p className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Sessions
              </p>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <a
                    key={session.id}
                    href={`/projects/${id}/lyrics/${session.id}`}
                    className="block border border-neutral-200 rounded-sm p-5 hover:border-black transition-colors duration-fast group"
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

          {/* Empty state: no concept yet */}
          {!hasConcept && (
            <div className="border border-dashed border-neutral-300 rounded-sm p-8 text-center mt-4">
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
