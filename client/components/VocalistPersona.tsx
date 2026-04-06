'use client';

import { useState } from 'react';
import { Badge } from './ui';
import type { I2VocalistPersona } from '../lib/api';

/**
 * Build a Suno-formatted vocal prompt.
 * IMPORTANT: Never include person or band names in the prompt —
 * Suno prompts must be descriptive only.
 */
function buildVocalPrompt(persona: I2VocalistPersona): string {
  const parts: string[] = [];
  if (persona.vocal_character) {
    parts.push(`[Vocal Style: ${persona.vocal_character}]`);
  }
  if (persona.delivery_style) {
    parts.push(`[Vocal Delivery: ${persona.delivery_style}]`);
  }
  // Reference vocalists are shown in the UI for context but
  // EXCLUDED from the copiable Suno prompt — Suno should never
  // reference real people or bands.
  if (persona.tone_keywords.length > 0) {
    parts.push(`[Vocal Tone: ${persona.tone_keywords.join(', ')}]`);
  }
  return parts.join('\n');
}

interface VocalistPersonaProps {
  vocalistPersona: I2VocalistPersona;
}

export default function VocalistPersona({ vocalistPersona }: VocalistPersonaProps) {
  return (
    <div className="animate-fade-in px-10 py-10 max-w-[1400px] mx-auto">
      {/* Header — matches TrackCard pattern: number + title + subtitle */}
      <div className="flex items-start gap-4 mb-6">
        <div>
          <p className="text-[22px] leading-tight font-medium text-[#1A1A1A]">Vocal Character</p>
          <p className="text-[13px] text-[#8A8A8A] mt-1">{vocalistPersona.vocal_character}</p>
        </div>
      </div>

      {/* Two-column prompt cards — matches Suno/Lyrics layout */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Delivery Style card */}
        <div className="bg-[#F7F7F5] rounded-lg p-5">
          <div className="mb-3">
            <Badge variant="blue">Delivery</Badge>
          </div>
          <p className="text-[13px] text-[#1A1A1A] leading-relaxed">
            {vocalistPersona.delivery_style}
          </p>
        </div>

        {/* Suno Vocal Prompt card */}
        <VocalPromptCard vocalistPersona={vocalistPersona} />
      </div>

      {/* Reference Vocalists + Tone — border-b section like track notes */}
      <div className="border-t border-[#E8E8E8] pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Reference Vocalists</SectionLabel>
            <p className="text-[11px] text-[#C4C4C4] mt-1 mb-4">For creative context only — not included in prompts</p>
            <div className="space-y-3">
              {vocalistPersona.reference_vocalists.map((v, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-[13px] font-medium text-[#C4C4C4] w-6 text-right shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] font-medium text-[#1A1A1A]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Tone Keywords</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-4">
              {vocalistPersona.tone_keywords.map((kw, i) => (
                <Badge key={i} variant="blue">{kw}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VocalPromptCard({ vocalistPersona }: { vocalistPersona: I2VocalistPersona }) {
  const [copied, setCopied] = useState(false);
  const prompt = buildVocalPrompt(vocalistPersona);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#F7F7F5] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="orange">Suno Vocal Prompt</Badge>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 border border-[#E8E8E8] rounded-full px-3 py-1 hover:border-[#1A1A1A]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-[13px] font-mono text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
        {prompt}
      </pre>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide">
      {children}
    </p>
  );
}
