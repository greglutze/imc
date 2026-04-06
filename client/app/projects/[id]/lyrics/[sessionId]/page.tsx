'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../../components/ProjectNav';
import { Signal } from '../../../../../components/ui';
import { useAuth } from '../../../../../lib/auth-context';
import { api } from '../../../../../lib/api';
import type { LyricSession, LyricSessionMessage, Project } from '../../../../../lib/api';

export default function LyricSessionPage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [session, setSession] = useState<LyricSession | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [messages, setMessages] = useState<LyricSessionMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lyricsRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load session data
  useEffect(() => {
    if (!isAuthenticated || !id || !sessionId) return;

    const loadData = async () => {
      try {
        const [proj, sess] = await Promise.all([
          api.getProject(id),
          api.getLyricSession(id, sessionId),
        ]);
        setProject(proj);
        setSession(sess);
        setLyrics(sess.lyrics || '');
        setMessages(sess.messages || []);
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id, sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-save lyrics with 500ms debounce
  const saveLyrics = useCallback(async (text: string) => {
    if (!id || !sessionId) return;
    setSaveStatus('saving');
    try {
      const result = await api.saveLyrics(id, sessionId, text);
      setSaveStatus('saved');
      if (result.title && session && !session.title) {
        setSession(prev => prev ? { ...prev, title: result.title } : prev);
      }
    } catch (err) {
      console.error('Failed to save lyrics:', err);
      setSaveStatus('unsaved');
    }
  }, [id, sessionId, session]);

  const handleLyricsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLyrics(text);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLyrics(text);
    }, 500);
  }, [saveLyrics]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Send message
  const handleSend = useCallback(async (content: string, type: string = 'chat') => {
    if (!id || !sessionId || !content.trim() || sending) return;

    setSending(true);
    const userMsg: LyricSessionMessage = {
      role: 'user',
      content: content.trim(),
      type: type as LyricSessionMessage['type'],
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const result = await api.sendAdvisorMessage(id, sessionId, content.trim(), type);
      setMessages(prev => [...prev.slice(0, -1), result.userMessage, result.advisorMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [id, sessionId, sending]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  }, [input, handleSend]);

  // Auto-send opening prompt when session has vibe_context (from theme selection) and no messages yet
  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (!session || hasAutoSent.current || messages.length > 0 || sending) return;
    if (session.entry_mode === 'vibe' && session.vibe_context) {
      hasAutoSent.current = true;
      handleSend(session.vibe_context, 'chat');
    }
  }, [session, messages.length, sending, handleSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }, [input, handleSend]);

  // Quick actions
  const handleQuickAction = useCallback((type: string) => {
    const selectedText = lyricsRef.current
      ? lyricsRef.current.value.substring(
          lyricsRef.current.selectionStart,
          lyricsRef.current.selectionEnd
        )
      : '';

    const prompts: Record<string, string> = {
      rhyme: selectedText
        ? `Find rhymes for: "${selectedText}"`
        : 'What words or end-sounds should I find rhymes for?',
      synonym: selectedText
        ? `Find synonyms for: "${selectedText}"`
        : 'Which word do you want alternatives for?',
      structure: 'Analyze the structure of my current lyrics.',
      coherence: 'Check the thematic coherence of my lyrics.',
    };

    handleSend(prompts[type] || prompts.structure, type);
  }, [handleSend]);

  // Dismiss message
  const handleDismiss = useCallback(async (index: number) => {
    if (!id || !sessionId) return;
    try {
      await api.dismissAdvisorMessage(id, sessionId, index);
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, dismissed: true } : m));
    } catch (err) {
      console.error('Failed to dismiss message:', err);
    }
  }, [id, sessionId]);

  // Title editing
  const handleTitleSubmit = useCallback(async () => {
    if (!id || !sessionId || !titleInput.trim()) {
      setEditingTitle(false);
      return;
    }
    try {
      await api.updateLyricSessionTitle(id, sessionId, titleInput.trim());
      setSession(prev => prev ? { ...prev, title: titleInput.trim() } : prev);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
    setEditingTitle(false);
  }, [id, sessionId, titleInput]);

  const artistName = project?.artist_name || 'Untitled';
  const sessionTitle = session?.title || 'Untitled Session';

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-[#E8E8E8] -ml-1">LA</p>
        <p className="text-[40px] leading-[1.1] font-medium text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-screen flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="lyrics" />

      {/* Session header */}
      <div className="border-b border-[#E8E8E8] px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/projects/${id}/lyrics`}
            className="text-[11px] text-[#C4C4C4] hover:text-black transition-colors duration-150"
          >
            &#8592; Sessions
          </a>
          <span className="text-[#E8E8E8]">/</span>
          {editingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="text-[14px] font-semibold text-black bg-transparent border-b border-black outline-none px-0 py-0"
            />
          ) : (
            <button
              onClick={() => { setTitleInput(sessionTitle); setEditingTitle(true); }}
              className="text-[14px] font-semibold text-black hover:text-[#666] transition-colors duration-150"
            >
              {sessionTitle}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#C4C4C4] italic">
            Everything you write is yours.
          </span>
          <span className={`text-[11px] ${saveStatus === 'saved' ? 'text-[#C4C4C4]' : saveStatus === 'saving' ? 'text-signal-violet' : 'text-signal-amber'}`}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>
      </div>

      {/* Split pane workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Lyrics editor */}
        <div className="w-1/2 flex flex-col border-r border-[#E8E8E8]">
          <div className="px-6 py-3 border-b border-[#E8E8E8] flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A]">Lyrics</p>
            <LyricsStats lyrics={lyrics} />
          </div>
          <textarea
            ref={lyricsRef}
            value={lyrics}
            onChange={handleLyricsChange}
            placeholder={
              session?.entry_mode === 'paste'
                ? 'Paste your lyrics here...'
                : 'Start writing your lyrics...'
            }
            className="flex-1 resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none px-6 py-5 text-[14px] text-black leading-relaxed font-mono bg-white placeholder-[#C4C4C4]"
            spellCheck={false}
          />
          {/* Wayfinding — show when lyrics have substance */}
          {lyrics.trim().split(/\s+/).length > 20 && (
            <div className="border-t border-[#E8E8E8] px-6 py-2.5 flex items-center justify-between bg-[#FAFAF8]">
              <span className="text-[11px] text-[#C4C4C4]">Looking good.</span>
              <div className="flex items-center gap-4">
                <a
                  href={`/projects/${id}/lyrics`}
                  className="text-[11px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150"
                >
                  All sessions
                </a>
                <a
                  href={`/projects/${id}/share`}
                  className="text-[11px] font-medium text-[#1A1A1A] hover:text-black transition-colors duration-150"
                >
                  Publish &rarr;
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right: Advisor panel */}
        <div className="w-1/2 flex flex-col bg-[#F7F7F5]">
          <div className="px-6 py-3 border-b border-[#E8E8E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A]">Advisor</p>
              {sending && <Signal color="violet" label="" pulse />}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {messages.length === 0 && !sending && (
              <div className="py-8">
                <p className="text-[14px] text-[#C4C4C4]">
                  {session?.entry_mode === 'paste'
                    ? 'Paste your lyrics on the left, then ask for feedback here.'
                    : session?.entry_mode === 'vibe'
                    ? 'What\'s the atmosphere, emotional tone, or world this song lives in?'
                    : 'Tell me about the song — what\'s it about, or where are you with it?'}
                </p>
              </div>
            )}

            <div className="space-y-5">
              {messages.map((msg, i) => {
                if (msg.dismissed) return null;
                const isUser = msg.role === 'user';

                return (
                  <div key={i} className="group">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 min-h-[20px] rounded-full shrink-0 mt-1 ${isUser ? 'bg-black' : 'bg-signal-violet'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isUser ? 'text-[#8A8A8A]' : 'text-signal-violet'}`}>
                          {isUser ? 'You' : 'Advisor'}
                        </p>
                        <div className="text-[13px] text-[#333] leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                      {!isUser && (
                        <button
                          onClick={() => handleDismiss(i)}
                          className="opacity-0 group-hover:opacity-100 text-[11px] text-[#C4C4C4] hover:text-[#8A8A8A] transition-all duration-150 shrink-0 mt-1"
                          title="Dismiss"
                        >
                          &#x2715;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="w-1 min-h-[20px] rounded-full shrink-0 mt-1 bg-signal-violet animate-pulse" />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-signal-violet mb-1">
                      Advisor
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#C4C4C4] rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-6 py-2 border-t border-[#E8E8E8] flex items-center gap-2">
            {['Rhyme', 'Synonym', 'Structure', 'Coherence'].map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action.toLowerCase())}
                disabled={sending}
                className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-black bg-white border border-[#E8E8E8] px-3 py-1.5  transition-colors duration-150 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-[#E8E8E8]">
            <div className="bg-white  px-4 py-3 flex items-end gap-3 border border-[#E8E8E8]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the Advisor..."
                disabled={sending}
                rows={1}
                className="flex-1 bg-transparent text-[13px] text-black placeholder-[#C4C4C4] resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none py-0.5"
                style={{ minHeight: '24px', maxHeight: '96px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className={`
                  text-[12px] font-semibold uppercase tracking-wide px-4 h-8                   transition-colors duration-150 shrink-0 text-[11px]
                  ${input.trim() && !sending
                    ? 'bg-black text-white hover:bg-[#1A1A1A]'
                    : 'bg-[#F7F7F5] text-[#C4C4C4] cursor-not-allowed'
                  }
                `}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function LyricsStats({ lyrics }: { lyrics: string }) {
  const lines = lyrics.split('\n').filter(l => l.trim()).length;
  const words = lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0;

  if (!words) return null;

  return (
    <span className="text-[11px] text-[#C4C4C4]">
      {words} words &middot; {lines} lines
    </span>
  );
}
