'use client';

import type { ExperienceLevel } from '../OnboardingFlow';

interface Props {
  value: ExperienceLevel | null;
  onChange: (level: ExperienceLevel) => void;
}

const OPTIONS: { id: ExperienceLevel; title: string; description: string; icon: string }[] = [
  {
    id: 'explorer',
    title: 'Just exploring',
    description: 'No pressure, no plan. I want to see what\u2019s possible.',
    icon: '\u2728', // sparkles
  },
  {
    id: 'vibe',
    title: 'I have a vibe',
    description: 'I know what I like, just need help locking it in.',
    icon: '\u{1F3B5}', // music note
  },
  {
    id: 'professional',
    title: 'I know my sound',
    description: 'I can describe my project in detail right now.',
    icon: '\u{1F3A7}', // headphones
  },
];

export default function StepExperience({ value, onChange }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 1
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-10">
          How would you describe<br />where you are?
        </h2>

        <div className="space-y-3">
          {OPTIONS.map((opt) => {
            const isSelected = value === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange(opt.id)}
                className={`
                  w-full text-left px-7 py-6 transition-all duration-200 group
                  ${isSelected
                    ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A]'
                    : 'bg-[#F7F7F5] hover:bg-[#F0F0ED] text-[#1A1A1A]'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[24px]">{opt.icon}</span>
                  <div>
                    <p className={`text-[18px] font-medium ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                      {opt.title}
                    </p>
                    <p className={`text-[14px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#8A8A8A]'}`}>
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
