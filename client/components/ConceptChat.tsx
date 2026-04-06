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
      <div className="px-10 pt-10 pb-6 shrink-0 border-b border-[#E8E8E8]">
        <div className="flex items-start justify-between max-w-[1400px] mx-auto">
          <div>
            <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-2">
              Creative Brief
            </p>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Concept
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
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

      {/* Two-column layout: conversation left, concept right on lg+ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:gap-8 h-full">
          {/* Left column: conversation + input */}
          <div className="lg:max-w-[560px] flex-1 min-w-0 flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-10 lg:pr-0 py-8">
              {messages.length === 0 && !loading && (
                <div className="py-4 max-w-lg" />
              )}

              <div className="space-y-8 max-w-lg">
                {messages.map((msg, i) => (
                  <MessageBlock key={i} message={msg} index={i} />
                ))}

                {loading && (
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-6 bg-signal-violet rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <p className="text-[11px] text-signal-violet font-medium uppercase tracking-wide">
                        IMC
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
            <form onSubmit={handleSubmit} className="px-10 lg:pr-0 py-5 shrink-0 border-t border-[#E8E8E8]">
              <div className="max-w-lg bg-[#F7F7F5] px-5 py-4 flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={conceptReady ? "Keep going — anything you add here refines your concept..." : "What kind of music are you making? What should it feel like?"}
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] text-[#1A1A1A] placeholder-[#C4C4C4] resize-none border-none outline-none focus:outline-none focus:ring-0 shadow-none py-1"
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                />
                <ButtonV2 type="submit" disabled={!input.trim() || loading} size="sm" className="shrink-0">
                  Send
                </ButtonV2>
              </div>
            </form>
          </div>

          {/* Right column: concept card — sticky on lg+ */}
          {conceptReady && concept && (
            <div className="lg:w-[480px] shrink-0 px-10 lg:px-0 lg:pr-10 py-8 lg:pt-8 border-t lg:border-t-0 border-[#E8E8E8]">
              <div className="lg:sticky lg:top-8">
                <div className="bg-[#F7F7F5] px-7 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide">
                        Your Concept
                      </p>
                    </div>
                    <Badge variant="green">Locked In</Badge>
                  </div>

                  {concept.creative_direction && (
                    <p className="text-[14px] text-[#1A1A1A] leading-relaxed mb-6">
                      {concept.creative_direction}
                    </p>
                  )}

                  <div className="space-y-3">
                    <ConceptField label="Primary Genre" value={concept.genre_primary} />
                    <ConceptField label="Secondary" value={concept.genre_secondary?.join(', ')} />
                    <ConceptField label="References" value={concept.reference_artists?.join(', ')} />
                    <ConceptField label="Audience" value={concept.target_audience} />
                    <ConceptField label="Mood" value={concept.mood_keywords?.join(', ')} />
                    <ConceptField label="Tracks" value={String(concept.track_count)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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
      <div className={`w-1 min-h-[24px] rounded-full shrink-0 ${isUser ? 'bg-[#1A1A1A]' : 'bg-signal-violet'}`} />

      <div className="flex-1 space-y-1.5">
        <p className={`text-[11px] font-medium uppercase tracking-wide ${isUser ? 'text-[#8A8A8A]' : 'text-signal-violet'}`}>
          {isUser ? 'You' : 'IMC'}
        </p>
        <div className="text-[14px] text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
      </div>

      {/* Turn number */}
      <span className="text-[13px] font-medium text-[#C4C4C4] shrink-0 pt-1">
        {String(Math.floor(index / 2) + 1).padStart(2, '0')}
      </span>
    </div>
  );
}

function ConceptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[#E8E8E8] pb-2">
      <span className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-[#1A1A1A] font-medium text-right">{value}</span>
    </div>
  );
}
