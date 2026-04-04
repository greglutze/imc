'use client';

import { useState, useEffect, useRef } from 'react';
import { ButtonV2 } from '../../ui';

interface Props {
  value: string;
  onChange: (name: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const PLACEHOLDERS = [
  'Midnight Sessions',
  'Untitled Masterpiece',
  'Something Beautiful',
  'Neon Dreams',
  'Side A',
  'The Quiet Album',
  'Golden Hour',
  'Deep Water',
];

export default function StepName({ value, onChange, onContinue, onSkip }: Props) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Autofocus the input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onContinue();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 2
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-10">
          What should we call<br />this project?
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          className="w-full text-center text-[24px] md:text-[32px] font-medium text-[#1A1A1A] bg-transparent border-none outline-none placeholder:text-[#E8E8E8] transition-all duration-300 py-4"
          autoComplete="off"
        />

        <div className="w-full h-px bg-[#E8E8E8] mb-10" />

        <div className="flex flex-col items-center gap-4">
          <ButtonV2
            onClick={onContinue}
            disabled={!value.trim()}
            size="lg"
            arrow
          >
            Continue
          </ButtonV2>

          <button
            onClick={onSkip}
            className="text-[13px] text-[#8A8A8A] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors duration-150"
          >
            Skip &mdash; we&apos;ll name it later
          </button>
        </div>
      </div>
    </div>
  );
}
