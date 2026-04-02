'use client';

import { useState, useRef, useEffect } from 'react';
import { Signal, Badge, ButtonV2 } from './ui';
import type { ConversationMessage, ProjectConcept } from '../lib/api';

interface ConceptChatProps {
  messages: ConversationMessage[];
  onSend: (message: string) => Promise<void>;
  loading?: boolean;
  conceptReady?: boolean;
  concept?: ProjectConcept | null;
}

export default function ConceptChat({
  messages,
  onSend,
  loading = false,
  conceptReady = false,
  concept,
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
      {/* Editorial header */}
      <div className="px-8 pt-10 pb-6 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-2">
              Creative Brief
            </p>
            <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">
              Concept
            </p>
            <p className="text-body-lg text-neutral-500 mt-4 max-w-lg">
              Let&apos;s figure out who you are as an artist. Talk about your sound, your references, the feeling you&apos;re chasing.
            </p>
          </div>
          {conceptReady ? (
            <Badge variant="green">Concept Extracted</Badge>
          ) : (
            <Signal color="violet" label="Active" pulse={loading} />
          )}
        </div>
      </div>

      {/* Messages — editorial style, not bubbles */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 && !loading && (
          <div className="py-4 max-w-2xl" />
        )}

        <div className="space-y-8 max-w-2xl">
          {messages.map((msg, i) => (
            <MessageBlock key={i} message={msg} index={i} />
          ))}

          {loading && (
            <div className="flex items-start gap-4">
              <div className="w-1 h-6 bg-signal-violet rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <p className="text-caption text-signal-violet font-semibold uppercase tracking-wide">
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
      <form onSubmit={handleSubmit} className="px-8 py-5 shrink-0 border-t border-neutral-100">
        <div className="max-w-2xl bg-neutral-50 rounded-md px-5 py-4 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={conceptReady ? "Keep going — anything you add here refines your concept..." : "What kind of music are you making? What should it feel like?"}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-body text-black placeholder-neutral-400 resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none py-1"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <ButtonV2 type="submit" disabled={!input.trim() || loading} size="sm" className="shrink-0">
            Send
          </ButtonV2>
        </div>
      </form>

      {/* Concept extracted card */}
      {conceptReady && concept && (
        <div className="border-t-2 border-black px-8 py-8 bg-white shrink-0">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Your Concept
                </p>
              </div>
              <Badge variant="green">Locked In</Badge>
            </div>

            {concept.creative_direction && (
              <p className="text-body-lg text-black leading-relaxed mb-6">
                {concept.creative_direction}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <ConceptField label="Primary Genre" value={concept.genre_primary} />
              <ConceptField label="Secondary" value={concept.genre_secondary?.join(', ')} />
              <ConceptField label="References" value={concept.reference_artists?.join(', ')} />
              <ConceptField label="Audience" value={concept.target_audience} />
              <ConceptField label="Mood" value={concept.mood_keywords?.join(', ')} />
              <ConceptField label="Tracks" value={String(concept.track_count)} />
            </div>
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
        <p className={`text-caption font-semibold uppercase tracking-wide ${isUser ? 'text-[#8A8A8A]' : 'text-signal-violet'}`}>
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
    <div className="flex items-baseline justify-between border-b border-[#E8E8E8] pb-2">
      <span className="text-caption text-[#8A8A8A]">{label}</span>
      <span className="text-body-sm text-black font-bold text-right">{value}</span>
    </div>
  );
}
