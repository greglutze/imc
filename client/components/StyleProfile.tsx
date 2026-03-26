'use client';

import { Badge } from './ui';
import type { I2StyleProfile, I2VocalistPersona } from '../lib/api';

interface StyleProfileProps {
  styleProfile: I2StyleProfile;
  vocalistPersona: I2VocalistPersona;
}

export default function StyleProfile({ styleProfile, vocalistPersona }: StyleProfileProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
          Instrument 02
        </p>
        <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
          Style Profile
        </h2>
      </div>

      {/* Production Aesthetic — full width editorial */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
            <SectionLabel>Production Aesthetic</SectionLabel>
            <p className="text-body-lg text-neutral-700 leading-relaxed mt-4">
              {styleProfile.production_aesthetic}
            </p>

            <div className="mt-8">
              <SectionLabel>Sonic Signatures</SectionLabel>
              <div className="mt-3 space-y-3">
                {styleProfile.sonic_signatures.map((sig, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-5 bg-signal-blue rounded-full shrink-0 mt-0.5" />
                    <p className="text-body text-neutral-700">{sig}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-5 px-8 py-10">
            <div className="space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <SectionLabel>Tempo Range</SectionLabel>
                <p className="text-heading-sm font-bold text-black mt-2">{styleProfile.tempo_range}</p>
              </div>

              <div>
                <SectionLabel>Key Preferences</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {styleProfile.key_preferences.map((k, i) => (
                    <span key={i} className="text-body-sm font-mono text-black bg-neutral-50 px-2 py-1 rounded-sm border border-neutral-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vocalist Persona */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-5 px-8 py-10 border-r border-neutral-200">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-heading font-bold font-mono text-neutral-200">V</span>
              <h3 className="text-heading font-bold text-black">Vocalist Persona</h3>
            </div>

            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <SectionLabel>Character</SectionLabel>
                <p className="text-body text-black font-bold mt-1">{vocalistPersona.vocal_character}</p>
              </div>
              <div className="border-b border-neutral-100 pb-3">
                <SectionLabel>Delivery</SectionLabel>
                <p className="text-body text-black font-bold mt-1">{vocalistPersona.delivery_style}</p>
              </div>
            </div>
          </div>

          <div className="col-span-7 px-8 py-10">
            <div className="mb-8">
              <SectionLabel>Reference Vocalists</SectionLabel>
              <div className="mt-3 space-y-2">
                {vocalistPersona.reference_vocalists.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-micro font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-body font-bold text-black">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
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
