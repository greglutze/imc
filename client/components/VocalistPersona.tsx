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
    <div className="animate-fade-in px-8 py-6 space-y-3">
      {/* Character + Delivery hero */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 bg-[#F7F7F5] rounded-lg px-7 py-8">
          <SectionLabel>Vocal Character</SectionLabel>
          <p className="text-[22px] leading-[1.4] font-medium text-[#1A1A1A] mt-4 tracking-tight">
            &ldquo;{vocalistPersona.vocal_character}&rdquo;
          </p>

          <div className="mt-10">
            <SectionLabel>Delivery Style</SectionLabel>
            <p className="text-[14px] text-[#8A8A8A] leading-relaxed mt-3">
              {vocalistPersona.delivery_style}
            </p>
          </div>
        </div>

        <div className="col-span-5 bg-[#F7F7F5] rounded-lg px-7 py-8">
          <div>
            <SectionLabel>Reference Vocalists</SectionLabel>
            <p className="text-[11px] text-[#C4C4C4] mt-1">For creative context only — not included in prompts</p>
            <div className="mt-5 space-y-3">
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

          <div className="mt-8">
            <SectionLabel>Tone Keywords</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-3">
              {vocalistPersona.tone_keywords.map((kw, i) => (
                <Badge key={i} variant="blue">{kw}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suno Vocal Prompt — full width card */}
      <div className="bg-[#F7F7F5] rounded-lg px-7 py-8">
        <VocalPromptBlock vocalistPersona={vocalistPersona} />
      </div>
    </div>
  );
}

function VocalPromptBlock({ vocalistPersona }: { vocalistPersona: I2VocalistPersona }) {
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Suno Vocal Prompt</SectionLabel>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 border border-[#E8E8E8] rounded-full px-3 py-1 hover:border-[#1A1A1A]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-white border border-[#E8E8E8] rounded-lg p-6 text-[13px] font-mono text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
        {prompt}
      </pre>
      <p className="text-[11px] text-[#C4C4C4] mt-3">
        Paste directly into Suno&apos;s vocal style field. Person and band names are excluded for compatibility.
      </p>
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
