'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ButtonV2 } from '../../ui';
import { api } from '../../../lib/api';
import type { OnboardingData } from '../OnboardingFlow';

interface Props {
  value: string;
  onboardingData: OnboardingData;
  onChange: (name: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export default function StepName({ value, onboardingData, onChange, onContinue, onSkip }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);

  // Fetch AI-generated names on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchNames = async () => {
      try {
        const result = await api.generateProjectNames({
          genres: onboardingData.genres,
          vision: onboardingData.visionText,
          moods: onboardingData.moodChips,
          artists: onboardingData.referenceArtists,
          shape: onboardingData.projectShape || undefined,
        });
        setSuggestions(result.names || []);
      } catch (err) {
        console.warn('[StepName] Failed to generate names:', err);
        // Fall back to curated defaults
        setSuggestions([
          'Midnight Architecture',
          'Soft Machines',
          'The Color of Distance',
          'Velvet Engine',
          'Glass Hours',
          'Neon Pastoral',
          'Thin Air',
          'Ghost Frequency',
          'After the Gold',
          'Silver Thread',
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [onboardingData]);

  const handleSelectSuggestion = useCallback((name: string) => {
    setSelectedSuggestion(name);
    setIsCustom(false);
    onChange(name);
  }, [onChange]);

  const handleCustomClick = useCallback(() => {
    setSelectedSuggestion(null);
    setIsCustom(true);
    onChange('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onContinue();
    }
  };

  const canContinue = value.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Last step
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-3">
          Name your project
        </h2>
        <p className="text-[15px] text-[#8A8A8A] text-center mb-10">
          Pick a name that fits the vibe, or write your own.
        </p>

        {/* AI suggestions grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 mb-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[52px] bg-[#F7F7F5] animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 mb-8">
            {suggestions.map((name) => {
              const isSelected = selectedSuggestion === name;
              return (
                <button
                  key={name}
                  onClick={() => handleSelectSuggestion(name)}
                  className={`
                    text-left px-5 py-3.5 transition-all duration-200
                    ${isSelected
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A] scale-[1.01]'
                      : 'bg-[#F7F7F5] hover:bg-[#F0F0ED] text-[#1A1A1A]'
                    }
                  `}
                >
                  <span className={`text-[15px] font-medium ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom name input */}
        <div className="mb-8">
          {isCustom ? (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={selectedSuggestion ? '' : value}
                onChange={(e) => {
                  setSelectedSuggestion(null);
                  onChange(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your project name..."
                className="w-full text-center text-[22px] md:text-[28px] font-medium text-[#1A1A1A] bg-transparent border-none outline-none placeholder:text-[#E8E8E8] transition-all duration-300 py-3"
                autoComplete="off"
              />
              <div className="w-full h-px bg-[#E8E8E8]" />
            </div>
          ) : (
            <button
              onClick={handleCustomClick}
              className="w-full text-center text-[14px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 py-2"
            >
              Or type your own name →
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <ButtonV2
            onClick={onContinue}
            disabled={!canContinue}
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
