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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
          Instrument 02
        </p>
        <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
          Vocalist Persona
        </h2>
      </div>

      {/* Character + Delivery hero */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
            <SectionLabel>Vocal Character</SectionLabel>
            <p className="text-[24px] leading-[1.4] font-bold text-black mt-4 tracking-tight">
              &ldquo;{vocalistPersona.vocal_character}&rdquo;
            </p>

            <div className="mt-10">
              <SectionLabel>Delivery Style</SectionLabel>
              <p className="text-body-lg text-neutral-700 leading-relaxed mt-3">
                {vocalistPersona.delivery_style}
              </p>
            </div>
          </div>

          <div className="col-span-5 px-8 py-10">
            <div>
              <SectionLabel>Reference Vocalists</SectionLabel>
              <p className="text-caption text-neutral-300 mt-1">For creative context only — not included in prompts</p>
              <div className="mt-5 space-y-3">
                {vocalistPersona.reference_vocalists.map((v, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[28px] leading-none font-bold font-mono text-neutral-200 w-8 text-right shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body font-bold text-black">{v}</span>
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
      </div>

      {/* Suno Vocal Prompt — full width */}
      <div className="px-8 py-10">
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
          className="text-caption font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border border-neutral-200 hover:border-neutral-400 transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 text-body font-mono text-black whitespace-pre-wrap leading-relaxed">
        {prompt}
      </pre>
      <p className="text-caption text-neutral-400 mt-3">
        Paste directly into Suno&apos;s vocal style field. Person and band names are excluded for compatibility.
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption text-neutral-400 uppercase tracking-widest font-bold">
      {children}
    </p>
  );
}
