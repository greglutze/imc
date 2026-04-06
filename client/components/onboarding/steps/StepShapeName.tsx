'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ButtonV2 } from '../../ui';
import { api } from '../../../lib/api';
import type { OnboardingData, ProjectShape } from '../OnboardingFlow';

interface Props {
  shape: ProjectShape | null;
  customTrackCount?: number;
  projectName: string;
  onboardingData: OnboardingData;
  onChangeShape: (shape: ProjectShape, customCount?: number) => void;
  onChangeName: (name: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const SHAPES: { id: ProjectShape; title: string; description: string; trackCount: string }[] = [
  {
    id: 'single',
    title: 'Single',
    description: 'One track, fully realized.',
    trackCount: '1 track',
  },
  {
    id: 'ep',
    title: 'EP',
    description: 'A tight collection. 4–6 tracks.',
    trackCount: '5 tracks',
  },
  {
    id: 'album',
    title: 'Album',
    description: 'The full vision. 8–14 tracks.',
    trackCount: '10 tracks',
  },
];

export default function StepShapeName({
  shape,
  customTrackCount,
  projectName,
  onboardingData,
  onChangeShape,
  onChangeName,
  onContinue,
  onSkip,
}: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customCount, setCustomCount] = useState(customTrackCount || 8);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [isCustomName, setIsCustomName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);
  const nameSectionRef = useRef<HTMLDivElement>(null);

  // Once shape is selected, fetch name suggestions
  useEffect(() => {
    if (!shape || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoadingNames(true);

    const fetchNames = async () => {
      try {
        const result = await api.generateProjectNames({
          genres: onboardingData.genres,
          vision: onboardingData.visionText,
          moods: onboardingData.moodChips,
          artists: onboardingData.referenceArtists,
          shape: shape || undefined,
        });
        setSuggestions(result.names || []);
      } catch (err) {
        console.warn('[StepShapeName] Failed to generate names:', err);
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
        setLoadingNames(false);
      }
    };

    fetchNames();
  }, [shape, onboardingData]);

  // Scroll to name section when shape is selected
  useEffect(() => {
    if (shape && nameSectionRef.current) {
      setTimeout(() => {
        nameSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [shape]);

  const handleSelectShape = (s: ProjectShape) => {
    setShowCustom(false);
    onChangeShape(s);
  };

  const handleSelectSuggestion = useCallback((name: string) => {
    setSelectedSuggestion(name);
    setIsCustomName(false);
    onChangeName(name);
  }, [onChangeName]);

  const handleCustomNameClick = useCallback(() => {
    setSelectedSuggestion(null);
    setIsCustomName(true);
    onChangeName('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onChangeName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && projectName.trim()) {
      onContinue();
    }
  };

  const canContinue = !!shape && projectName.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full">
        {/* Shape selection */}
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Project scope
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-10">
          How big is this project?
        </h2>

        <div className="space-y-3 max-w-xl mx-auto">
          {SHAPES.map((s) => {
            const isSelected = shape === s.id && !showCustom;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectShape(s.id)}
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
                      {s.title}
                    </p>
                    <p className={`text-[14px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#8A8A8A]'}`}>
                      {s.description}
                    </p>
                  </div>
                  <span className={`text-[13px] font-medium ${isSelected ? 'text-white/50' : 'text-[#C4C4C4]'}`}>
                    {s.trackCount}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom option — available to all users */}
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
            <div className="flex justify-center pt-2">
              <button
                onClick={() => onChangeShape('album', customCount)}
                className="text-[14px] font-medium px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-black transition-all duration-200"
              >
                Continue with {customCount} tracks &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Name section — appears after shape is selected */}
        {shape && (
          <div ref={nameSectionRef} className="mt-16 pt-12 border-t border-[#E8E8E8] animate-fade-in">
            <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
              Last step
            </p>
            <h2 className="text-[28px] md:text-[32px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-3">
              Name your project
            </h2>
            <p className="text-[15px] text-[#8A8A8A] text-center mb-10">
              Pick a name that fits the vibe, or write your own.
            </p>

            {/* AI suggestions grid */}
            {loadingNames ? (
              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[52px] bg-[#F7F7F5] animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
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
            ) : null}

            {/* Custom name input */}
            <div className="mb-8">
              {isCustomName ? (
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={selectedSuggestion ? '' : projectName}
                    onChange={(e) => {
                      setSelectedSuggestion(null);
                      onChangeName(e.target.value);
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
                  onClick={handleCustomNameClick}
                  className="w-full text-center text-[14px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 py-2"
                >
                  Or type your own name &rarr;
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
                Build My Project
              </ButtonV2>

              <button
                onClick={onSkip}
                className="text-[13px] text-[#8A8A8A] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors duration-150"
              >
                Skip &mdash; we&apos;ll name it later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
