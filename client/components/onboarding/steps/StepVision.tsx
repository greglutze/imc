'use client';

import { useEffect, useRef } from 'react';
import { ButtonV2 } from '../../ui';
import type { ExperienceLevel } from '../OnboardingFlow';

interface Props {
  experienceLevel: ExperienceLevel;
  visionText: string;
  moodChips: string[];
  onChangeText: (text: string) => void;
  onChangeChips: (chips: string[]) => void;
  onContinue: () => void;
}

const MOOD_CHIPS = [
  'Dreamy', 'Aggressive', 'Melancholic', 'Euphoric',
  'Cinematic', 'Intimate', 'Chaotic', 'Serene',
  'Dark', 'Playful', 'Nostalgic', 'Futuristic',
];

const QUESTION_TEXT: Record<ExperienceLevel, string> = {
  explorer: 'Describe the feeling you want\nyour music to have.',
  vibe: 'Tell us about your sound.\nDrop names, moods, anything.',
  professional: 'Describe your project.',
};

const PLACEHOLDER_TEXT: Record<ExperienceLevel, string> = {
  explorer: 'Late-night drive through a neon city\u2026 Sunday morning coffee with someone you love\u2026 the adrenaline right before a show\u2026',
  vibe: 'If Radiohead and Frank Ocean had a baby raised by Eno\u2026',
  professional: 'Genre, influences, mood, tempo, anything relevant.',
};

export default function StepVision({
  experienceLevel,
  visionText,
  moodChips,
  onChangeText,
  onChangeChips,
  onContinue,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 400);
  }, []);

  const toggleChip = (chip: string) => {
    if (moodChips.includes(chip)) {
      onChangeChips(moodChips.filter((c) => c !== chip));
    } else {
      onChangeChips([...moodChips, chip]);
    }
  };

  const hasContent = visionText.trim().length > 10 || moodChips.length >= 2;
  const showChips = experienceLevel !== 'professional';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 3
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-10 whitespace-pre-line">
          {QUESTION_TEXT[experienceLevel]}
        </h2>

        <textarea
          ref={textareaRef}
          value={visionText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={PLACEHOLDER_TEXT[experienceLevel]}
          rows={experienceLevel === 'professional' ? 6 : 4}
          className="w-full bg-[#F7F7F5] rounded-lg px-6 py-5 text-[16px] md:text-[18px] text-[#1A1A1A] placeholder:text-[#C4C4C4] outline-none resize-none leading-relaxed focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all duration-200"
        />

        {/* Mood chips — not shown for professionals */}
        {showChips && (
          <div className="mt-5">
            <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-3">
              Or tap a few moods
            </p>
            <div className="flex flex-wrap gap-2">
              {MOOD_CHIPS.map((chip) => {
                const isActive = moodChips.includes(chip);
                return (
                  <button
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    className={`
                      text-[13px] font-medium px-4 py-2 rounded-full transition-all duration-200
                      ${isActive
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white border border-[#E8E8E8] text-[#8A8A8A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                      }
                    `}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-10">
          <ButtonV2
            onClick={onContinue}
            disabled={!hasContent}
            size="lg"
            arrow
          >
            Continue
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
