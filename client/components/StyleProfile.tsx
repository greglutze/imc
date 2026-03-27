'use client';

import type { I2StyleProfile } from '../lib/api';

interface StyleProfileProps {
  styleProfile: I2StyleProfile;
}

export default function StyleProfile({ styleProfile }: StyleProfileProps) {
  // Extract BPM numbers for the visual meter
  const bpmMatch = styleProfile.tempo_range.match(/(\d+)/);
  const bpmValue = bpmMatch ? parseInt(bpmMatch[1]) : 120;
  const bpmPercent = Math.min(100, Math.max(0, ((bpmValue - 60) / (200 - 60)) * 100));

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

      {/* Production Aesthetic — hero block */}
      <div className="border-b border-neutral-200 px-8 py-12">
        <SectionLabel>Production Aesthetic</SectionLabel>
        <p className="text-[24px] leading-[1.4] font-bold text-black mt-4 max-w-3xl tracking-tight">
          &ldquo;{styleProfile.production_aesthetic}&rdquo;
        </p>
      </div>

      {/* Sonic Signatures + Tempo/Key grid */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
            <SectionLabel>Sonic Signatures</SectionLabel>
            <div className="mt-5 space-y-4">
              {styleProfile.sonic_signatures.map((sig, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[32px] leading-none font-bold font-mono text-neutral-200 shrink-0 w-10 text-right">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-lg text-neutral-700 leading-relaxed pt-1">{sig}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 px-8 py-10 flex flex-col justify-between">
            {/* Tempo — visual meter */}
            <div>
              <SectionLabel>Tempo</SectionLabel>
              <p className="text-[48px] leading-none font-bold text-black font-mono mt-3">
                {styleProfile.tempo_range}
              </p>
              <div className="mt-4 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-500"
                  style={{ width: `${bpmPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-micro font-mono text-neutral-300">60</span>
                <span className="text-micro font-mono text-neutral-300">200</span>
              </div>
            </div>

            {/* Key Preferences */}
            <div className="mt-8">
              <SectionLabel>Key Preferences</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-3">
                {styleProfile.key_preferences.map((k, i) => (
                  <span key={i} className="text-body font-mono font-bold text-black bg-neutral-50 px-3 py-2 rounded-sm border border-neutral-200">
                    {k}
                  </span>
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
