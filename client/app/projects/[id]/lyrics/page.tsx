'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { LyricSessionListItem, LyricEntryMode, Project } from '../../../../lib/api';

export default function LyricAdvisorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<LyricSessionListItem[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
      } catch (err) {
        console.error('Failed to load lyric advisor data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id]);

  const handleNewSession = useCallback(async (entryMode: LyricEntryMode) => {
    if (!id || creating) return;
    setCreating(true);
    try {
      const session = await api.createLyricSession(id, { entry_mode: entryMode });
      router.push(`/projects/${id}/lyrics/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setCreating(false);
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

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="lyrics" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
                LyriCol
              </p>
              <p className="text-[40px] leading-[1.1] font-bold text-black tracking-tight">
                Write Better Lyrics
              </p>
              <p className="text-body-lg text-neutral-500 mt-3 max-w-md">
                A creative collaborator that helps you find the right words — without writing them for you.
              </p>
              <p className="text-caption text-neutral-400 mt-2 italic">
                Everything you write is yours.
              </p>
            </div>
          </div>

          {/* Entry modes — new session */}
          <div className="mb-12">
            <p className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-4">
              New Session
            </p>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleNewSession('paste')}
                disabled={creating}
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
                onClick={() => handleNewSession('conversation')}
                disabled={creating}
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
                onClick={() => handleNewSession('vibe')}
                disabled={creating}
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
        </div>
      </div>
    </div>
  );
}
