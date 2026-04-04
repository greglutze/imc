'use client';

import { ButtonV2 } from '../../ui';

interface Props {
  onContinue: () => void;
}

export default function StepWelcome({ onContinue }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        {/* Subtle decorative element */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse-subtle" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse-subtle" style={{ animationDelay: '400ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse-subtle" style={{ animationDelay: '800ms' }} />
        </div>

        <h1 className="text-[48px] md:text-[64px] leading-[0.95] font-medium tracking-tight text-[#1A1A1A]">
          Let&apos;s build<br />something.
        </h1>

        <p className="text-[16px] md:text-[18px] text-[#8A8A8A] mt-6 leading-relaxed max-w-sm mx-auto">
          We&apos;ll ask a few questions, then build your entire project. Takes about 3 minutes.
        </p>

        <div className="mt-10">
          <ButtonV2 onClick={onContinue} size="lg" arrow>
            Start
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
