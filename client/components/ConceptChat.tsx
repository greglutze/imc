'use client';

import { useState, useRef, useEffect } from 'react';
import { Signal, Badge } from './ui';
import type { ConversationMessage, ProjectConcept } from '../lib/api';

interface ConceptChatProps {
  messages: ConversationMessage[];
  onSend: (message: string) => Promise<void>;
  loading?: boolean;
  conceptReady?: boolean;
  concept?: ProjectConcept | null;
  onRunResearch?: () => void;
}

export default function ConceptChat({
  messages,
  onSend,
  loading = false,
  conceptReady = false,
  concept,
  onRunResearch,
}: ConceptChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    await onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-neutral-200 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
            Instrument 01
          </p>
          <p className="text-heading-sm font-bold text-black mt-1">
            Concept Interview
          </p>
        </div>
        <div className="flex items-center gap-3">
          {conceptReady ? (
            <Badge variant="green">Concept Extracted</Badge>
          ) : (
            <Signal color="violet" label="AI Creative Director" pulse={loading} />
          )}
        </div>
      </div>

      {/* Messages — editorial style, not bubbles */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 && !loading && (
          <div className="py-16 max-w-2xl">
            <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
            <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
              Define Your Artist
            </p>
            <p className="text-body-lg text-black mt-5 max-w-sm">
              Start a conversation with the AI creative director.
              Genre, influences, mood, vision.
            </p>
          </div>
        )}

        <div className="space-y-8 max-w-2xl">
          {messages.map((msg, i) => (
            <MessageBlock key={i} message={msg} index={i} />
          ))}

          {loading && (
            <div className="flex items-start gap-4">
              <div className="w-1 h-6 bg-signal-violet rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <p className="text-caption text-signal-violet font-bold uppercase tracking-widest">
                  IMC
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — always visible so the artist can refine the concept */}
      <form onSubmit={handleSubmit} className="px-8 py-5">
        <div className="max-w-2xl bg-neutral-50 rounded-sm px-5 py-4 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={conceptReady ? "Refine your concept — changes will update the extracted concept..." : "Describe your artist concept..."}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-body text-black placeholder-neutral-400 resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none py-1"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`
              text-label font-bold uppercase tracking-widest px-5 h-9 rounded-sm
              transition-colors duration-fast shrink-0
              ${input.trim() && !loading
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
              }
            `}
          >
            Send
          </button>
        </div>
      </form>

      {/* Concept extracted card */}
      {conceptReady && concept && (
        <div className="border-t border-neutral-200 px-8 py-6 bg-neutral-50">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Signal color="green" />
              <p className="text-label font-bold uppercase tracking-widest text-black">
                Concept Extracted
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <ConceptField label="Primary Genre" value={concept.genre_primary} />
              <ConceptField label="Secondary" value={concept.genre_secondary?.join(', ')} />
              <ConceptField label="References" value={concept.reference_artists?.join(', ')} />
              <ConceptField label="Audience" value={concept.target_audience} />
              <ConceptField label="Mood" value={concept.mood_keywords?.join(', ')} />
              <ConceptField label="Tracks" value={String(concept.track_count)} />
            </div>

            <p className="text-body-sm text-neutral-500 mt-4 mb-5">{concept.creative_direction}</p>

            <button
              onClick={onRunResearch}
              className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-6 rounded-sm hover:bg-neutral-800 transition-colors duration-fast"
            >
              Run Market Research
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ———————— Sub-components ———————— */

/** Strip CONCEPT_READY markers and raw JSON from display text */
function cleanMessageContent(content: string): string {
  return content
    .replace(/CONCEPT_READY/gi, '')
    .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '')
    .replace(/\{[\s\S]*?"genre_primary"[\s\S]*?\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function MessageBlock({ message, index }: { message: ConversationMessage; index: number }) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : cleanMessageContent(message.content);

  // Don't render if the cleaned content is empty
  if (!displayContent) return null;

  return (
    <div className="flex items-start gap-4">
      {/* Accent bar */}
      <div className={`w-1 min-h-[24px] rounded-full shrink-0 ${isUser ? 'bg-black' : 'bg-signal-violet'}`} />

      <div className="flex-1 space-y-1.5">
        <p className={`text-caption font-bold uppercase tracking-widest ${isUser ? 'text-neutral-400' : 'text-signal-violet'}`}>
          {isUser ? 'You' : 'IMC'}
        </p>
        <div className="text-body text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
      </div>

      {/* Turn number */}
      <span className="text-micro font-mono text-neutral-200 shrink-0 pt-1">
        {String(Math.floor(index / 2) + 1).padStart(2, '0')}
      </span>
    </div>
  );
}

function ConceptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
      <span className="text-caption text-neutral-400">{label}</span>
      <span className="text-body-sm text-black font-bold text-right">{value}</span>
    </div>
  );
}
