'use client';

import { useState } from 'react';
import type { ExperienceLevel, ProjectShape } from '../OnboardingFlow';

interface Props {
  value: ProjectShape | null;
  experienceLevel: ExperienceLevel;
  customTrackCount?: number;
  onChange: (shape: ProjectShape, customCount?: number) => void;
}

const SHAPES: { id: ProjectShape; title: string; description: string; trackCount: string; icon: string }[] = [
  {
    id: 'single',
    title: 'Single',
    description: 'One track, fully realized.',
    trackCount: '1 track',
    icon: '\u25CF', // filled circle
  },
  {
    id: 'ep',
    title: 'EP',
    description: 'A tight collection. 4\u20136 tracks.',
    trackCount: '5 tracks',
    icon: '\u25CF\u25CF\u25CF', // three circles
  },
  {
    id: 'album',
    title: 'Album',
    description: 'The full vision. 8\u201314 tracks.',
    trackCount: '10 tracks',
    icon: '\u25CF\u25CF\u25CF\u25CF\u25CF', // five circles
  },
];

export default function StepShape({ value, experienceLevel, customTrackCount, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customCount, setCustomCount] = useState(customTrackCount || 8);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Project scope
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-10">
          How big is this project?
        </h2>

        <div className="space-y-3">
          {SHAPES.map((shape) => {
            const isSelected = value === shape.id && !showCustom;
            return (
              <button
                key={shape.id}
                onClick={() => {
                  setShowCustom(false);
                  onChange(shape.id);
                }}
                className={`
                  w-full text-left px-7 py-6 transition-all duration-200 group
                  ${isSelected
                    ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A] scale-[1.01]'
                    : 'bg-[#F7F7F5] hover:bg-[#F0F0ED] text-[#1A1A1A]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[18px] font-medium ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                      {shape.title}
                    </p>
                    <p className={`text-[14px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#8A8A8A]'}`}>
                      {shape.description}
                    </p>
                  </div>
                  <span className={`text-[13px] font-medium ${isSelected ? 'text-white/50' : 'text-[#C4C4C4]'}`}>
                    {shape.trackCount}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom option — Professional only */}
          {experienceLevel === 'professional' && (
            <>
              <button
                onClick={() => setShowCustom(true)}
                className={`
                  w-full text-left px-7 py-6 transition-all duration-200
                  ${showCustom
                    ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A]'
                    : 'bg-[#F7F7F5] hover:bg-[#F0F0ED] text-[#1A1A1A]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[18px] font-medium ${showCustom ? 'text-white' : 'text-[#1A1A1A]'}`}>
                      Custom
                    </p>
                    <p className={`text-[14px] mt-1 ${showCustom ? 'text-white/70' : 'text-[#8A8A8A]'}`}>
                      I know exactly how many tracks I need.
                    </p>
                  </div>
                  {showCustom && (
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center bg-white/20 border border-white/30 px-2 py-1.5 text-[16px] font-medium text-white outline-none"
                      />
                      <span className="text-[13px] text-white/50">tracks</span>
                    </div>
                  )}
                </div>
              </button>

              {showCustom && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => onChange('album', customCount)}
                    className="text-[14px] font-medium px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-black transition-all duration-200"
                  >
                    Continue with {customCount} tracks &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
