'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../../components/ProjectNav';
import { Badge, Signal } from '../../../../../components/ui';
import { useAuth } from '../../../../../lib/auth-context';
import { api } from '../../../../../lib/api';
import type { LyricSession, LyricSessionMessage, Project } from '../../../../../lib/api';

// ─── Inline Selection Popup (Grammarly-style) ───────────────────────────────

interface SelectionPopupProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onAction: (type: string, text: string) => void;
  visible: boolean;
}

function SelectionPopup({ position, selectedText, onAction, visible }: SelectionPopupProps) {
  if (!visible || !position || !selectedText) return null;

  const actions = [
    { key: 'rhyme', label: 'Rhyme' },
    { key: 'synonym', label: 'Synonym' },
    { key: 'syllable', label: 'Syllable' },
    { key: 'rewrite', label: 'AI Rewrite' },
  ];

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 bg-[#1A1A1A] shadow-lg py-1.5 px-1.5 animate-fade-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%) translateY(-100%)',
        marginTop: '-8px',
      }}
    >
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAction(action.key, selectedText);
          }}
          className="text-[11px] font-semibold uppercase tracking-wide text-[#999] hover:text-white px-2.5 py-1 transition-colors duration-100 whitespace-nowrap"
        >
          {action.label}
        </button>
      ))}
      {/* Arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
        style={{
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #1A1A1A',
        }}
      />
    </div>
  );
}

// ─── Floating Advisor Panel ─────────────────────────────────────────────────

interface AdvisorPanelProps {
  messages: LyricSessionMessage[];
  sending: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSend: (content: string, type?: string) => void;
  onDismiss: (index: number) => void;
  onClose: () => void;
  entryMode?: string;
}

function AdvisorPanel({ messages, sending, input, onInputChange, onSend, onDismiss, onClose, entryMode }: AdvisorPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) onSend(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[400px] h-[540px] bg-white border border-[#E8E8E8] shadow-xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#E8E8E8] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A]">Advisor</p>
          {sending && <Signal color="violet" label="" pulse />}
        </div>
        <button
          onClick={onClose}
          className="text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 text-[16px] leading-none"
        >
          &#x2715;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !sending && (
          <div className="py-6">
            <p className="text-[13px] text-[#C4C4C4] leading-relaxed">
              {entryMode === 'paste'
                ? 'Your writing advisor. Ask for feedback, ideas, or help with your lyrics.'
                : entryMode === 'vibe'
                ? 'What\'s the atmosphere, emotional tone, or world this song lives in?'
                : 'Tell me about the song — what\'s it about, or where are you with it?'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => {
            if (msg.dismissed) return null;
            const isUser = msg.role === 'user';

            return (
              <div key={i} className="group">
                <div className="flex items-start gap-2.5">
                  <div className={`w-1 min-h-[16px] rounded-full shrink-0 mt-1 ${isUser ? 'bg-black' : 'bg-signal-violet'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${isUser ? 'text-[#8A8A8A]' : 'text-signal-violet'}`}>
                      {isUser ? 'You' : 'Advisor'}
                    </p>
                    <div className="text-[13px] text-[#333] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                  {!isUser && (
                    <button
                      onClick={() => onDismiss(i)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-[#C4C4C4] hover:text-[#8A8A8A] transition-all duration-150 shrink-0 mt-1"
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
            <div className="flex items-start gap-2.5">
              <div className="w-1 min-h-[16px] rounded-full shrink-0 mt-1 bg-signal-violet animate-pulse" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-signal-violet mb-0.5">
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-5 py-3 border-t border-[#E8E8E8] shrink-0">
        <div className="bg-[#F7F7F5] px-3 py-2.5 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Advisor..."
            disabled={sending}
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-black placeholder-[#C4C4C4] resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none py-0.5"
            style={{ minHeight: '22px', maxHeight: '80px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={`
              text-[11px] font-semibold uppercase tracking-wide px-3 h-7 transition-colors duration-150 shrink-0
              ${input.trim() && !sending
                ? 'bg-black text-white hover:bg-[#1A1A1A]'
                : 'bg-[#E8E8E8] text-[#C4C4C4] cursor-not-allowed'
              }
            `}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Editor Page ───────────────────────────────────────────────────────

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
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [fontSize, setFontSize] = useState<14 | 16 | 18 | 20>(16);

  // Selection popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    visible: boolean;
    position: { x: number; y: number } | null;
    text: string;
  }>({ visible: false, position: null, text: '' });

  const lyricsRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

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

  // ─── Insert text at cursor ─────────────────────────────────────────────

  const insertAtCursor = useCallback((text: string) => {
    if (!lyricsRef.current) return;
    const textarea = lyricsRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = lyrics.substring(0, start);
    const after = lyrics.substring(end);

    // If inserting a section tag, ensure it's on its own line
    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
    const prefix = needsNewlineBefore ? '\n' : '';

    const newText = before + prefix + text + '\n' + after;
    setLyrics(newText);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveLyrics(newText), 500);

    // Move cursor after inserted text
    setTimeout(() => {
      const newPos = start + prefix.length + text.length + 1;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [lyrics, saveLyrics]);

  const wrapSelection = useCallback((before: string, after: string) => {
    if (!lyricsRef.current) return;
    const textarea = lyricsRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = lyrics.substring(start, end);

    const newText = lyrics.substring(0, start) + before + selected + after + lyrics.substring(end);
    setLyrics(newText);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveLyrics(newText), 500);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, [lyrics, saveLyrics]);

  // ─── Text Selection → Inline Popup ──────────────────────────────────────

  const handleSelectionChange = useCallback(() => {
    if (!lyricsRef.current) return;

    const textarea = lyricsRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end).trim();

    if (!selectedText || selectedText.length < 1) {
      setSelectionPopup({ visible: false, position: null, text: '' });
      return;
    }

    // Calculate position relative to viewport
    // We use a hidden mirror div approach — but for simplicity, position near the textarea
    const rect = textarea.getBoundingClientRect();
    // Approximate position: use textarea rect + rough line/character math
    const textBefore = textarea.value.substring(0, start);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const lineHeight = 22; // approximate
    const charWidth = 8.4; // approximate mono char width
    const lastLine = lines[lineIndex] || '';

    const x = rect.left + Math.min(lastLine.length * charWidth + (end - start) * charWidth / 2, rect.width - 40);
    const y = rect.top + (lineIndex * lineHeight) - textarea.scrollTop + 48; // offset for header

    setSelectionPopup({
      visible: true,
      position: { x: Math.max(120, Math.min(x, window.innerWidth - 180)), y: Math.max(40, y) },
      text: selectedText,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // Close popup on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // If clicking inside the popup, don't close
      const popup = document.querySelector('[data-selection-popup]');
      if (popup && popup.contains(e.target as Node)) return;

      // Small delay to allow the selection to register first
      setTimeout(() => {
        if (lyricsRef.current) {
          const start = lyricsRef.current.selectionStart;
          const end = lyricsRef.current.selectionEnd;
          if (start === end) {
            setSelectionPopup({ visible: false, position: null, text: '' });
          }
        }
      }, 100);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // ─── Send message ──────────────────────────────────────────────────────

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
    }
  }, [id, sessionId, sending]);

  // Auto-send opening prompt when session has vibe_context
  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (!session || hasAutoSent.current || messages.length > 0 || sending) return;
    if (session.entry_mode === 'vibe' && session.vibe_context) {
      hasAutoSent.current = true;
      handleSend(session.vibe_context, 'chat');
    }
  }, [session, messages.length, sending, handleSend]);

  // ─── Inline popup action → sends to advisor ────────────────────────────

  const handlePopupAction = useCallback((type: string, text: string) => {
    // Open advisor panel and send the action
    setAdvisorOpen(true);

    const prompts: Record<string, string> = {
      rhyme: `Find rhymes for: "${text}"`,
      synonym: `Find synonyms for: "${text}"`,
      syllable: `Count syllables and analyze the meter of: "${text}"`,
      rewrite: `Suggest an AI rewrite for: "${text}"`,
    };

    handleSend(prompts[type] || prompts.rhyme, type);
    setSelectionPopup({ visible: false, position: null, text: '' });
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
      <div className="animate-fade-in px-10 py-16 max-w-2xl">
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
            &#8592; Back
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
              className="text-[14px] font-semibold text-black hover:text-[#8A8A8A] transition-colors duration-150"
            >
              {sessionTitle}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LyricsStats lyrics={lyrics} />
          <Badge variant={saveStatus === 'saved' ? 'green' : saveStatus === 'saving' ? 'violet' : 'orange'}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </Badge>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="border-b border-[#E8E8E8] px-10 py-2 flex items-center gap-1" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <button
          onClick={() => insertAtCursor('[Verse]')}
          className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-2.5 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Insert Verse tag"
        >
          Verse
        </button>
        <button
          onClick={() => insertAtCursor('[Chorus]')}
          className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-2.5 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Insert Chorus tag"
        >
          Chorus
        </button>
        <button
          onClick={() => insertAtCursor('[Bridge]')}
          className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-2.5 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Insert Bridge tag"
        >
          Bridge
        </button>
        <button
          onClick={() => insertAtCursor('[Pre-Chorus]')}
          className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-2.5 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Insert Pre-Chorus tag"
        >
          Pre
        </button>
        <button
          onClick={() => insertAtCursor('[Outro]')}
          className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] px-2.5 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Insert Outro tag"
        >
          Outro
        </button>

        <div className="w-px h-4 bg-[#E8E8E8] mx-1" />

        <button
          onClick={() => wrapSelection('**', '**')}
          className="text-[11px] font-bold text-[#8A8A8A] hover:text-[#1A1A1A] px-2 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Bold (emphasis)"
        >
          B
        </button>
        <button
          onClick={() => wrapSelection('_', '_')}
          className="text-[11px] italic text-[#8A8A8A] hover:text-[#1A1A1A] px-2 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Italic (soft emphasis)"
        >
          I
        </button>
        <button
          onClick={() => wrapSelection('(', ')')}
          className="text-[11px] text-[#8A8A8A] hover:text-[#1A1A1A] px-2 py-1 hover:bg-[#F7F7F5] transition-colors duration-100"
          title="Parenthetical (ad-lib / backing vocal)"
        >
          ( )
        </button>

        <div className="w-px h-4 bg-[#E8E8E8] mx-1" />

        {/* Font size controls */}
        <div className="flex items-center gap-0.5">
          {([14, 16, 18, 20] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`text-[10px] px-1.5 py-1 transition-colors duration-100 ${
                fontSize === size
                  ? 'text-[#1A1A1A] font-semibold bg-[#F7F7F5]'
                  : 'text-[#C4C4C4] hover:text-[#8A8A8A]'
              }`}
              title={`Font size ${size}px`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Full-width writing area */}
      <div ref={editorWrapperRef} className="flex-1 flex flex-col overflow-hidden relative">
        <textarea
          ref={lyricsRef}
          value={lyrics}
          onChange={handleLyricsChange}
          onSelect={handleSelectionChange}
          placeholder={
            session?.entry_mode === 'paste'
              ? 'Paste your lyrics here...'
              : 'Start writing your lyrics...'
          }
          className="flex-1 resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none px-10 py-8 text-black leading-[1.8] font-mono bg-white placeholder-[#C4C4C4]"
          style={{ maxWidth: '720px', margin: '0 auto', width: '100%', display: 'block', fontSize: `${fontSize}px` }}
          spellCheck={false}
        />

        {/* Selection popup */}
        <SelectionPopup
          position={selectionPopup.position}
          selectedText={selectionPopup.text}
          onAction={handlePopupAction}
          visible={selectionPopup.visible}
        />

        {/* Floating Advisor Button */}
        {!advisorOpen && (
          <button
            onClick={() => setAdvisorOpen(true)}
            className="fixed bottom-6 right-6 z-30 w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#333] transition-colors duration-150 group"
            title="Open Advisor"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-signal-violet text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {messages.filter(m => !m.dismissed).length}
              </span>
            )}
          </button>
        )}

        {/* Advisor Panel */}
        {advisorOpen && (
          <AdvisorPanel
            messages={messages}
            sending={sending}
            input={input}
            onInputChange={setInput}
            onSend={(content, type) => handleSend(content, type || 'chat')}
            onDismiss={handleDismiss}
            onClose={() => setAdvisorOpen(false)}
            entryMode={session?.entry_mode}
          />
        )}
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
