'use client';

import { useState, useEffect, useMemo } from 'react';
import { CURATED_IMAGES } from '../curatedImages';

/* eslint-disable @next/next/no-img-element */

interface Props {
  stage: number;
  progress: number;
  selectedImageIds: string[];
  projectId?: string | null;
}

const STAGES = [
  { label: 'Preparing your workspace\u2026', sublabel: '', icon: '' },
  { label: 'Creating your project\u2026', sublabel: 'Setting up the foundation', icon: '\u2728' },
  { label: 'Extracting your concept\u2026', sublabel: 'Understanding your vision, influences, and creative direction', icon: '\u{1F3A8}' },
  { label: 'Building your moodboard\u2026', sublabel: 'Curating your visual world and generating a sonic brief', icon: '\u{1F5BC}\uFE0F' },
  { label: 'Researching your market\u2026', sublabel: 'Analyzing comparable artists, audiences, and sonic positioning', icon: '\u{1F50D}' },
  { label: 'Designing your sonic engine\u2026', sublabel: 'Building style profiles, vocal direction, and per-track prompts', icon: '\u{1F3B9}' },
  { label: 'Starting your first lyrics\u2026', sublabel: 'Seeding a writing session with hooks and verse ideas', icon: '\u270F\uFE0F' },
  { label: 'Setting up your checklist\u2026', sublabel: 'Preparing your launch readiness tracker', icon: '\u2705' },
  { label: 'Your project is ready.', sublabel: 'Every instrument is populated and waiting for you.', icon: '\u{1F680}' },
];

// Completed stage checkmarks for the progress list
function StageList({ currentStage }: { currentStage: number }) {
  // Only show stages 1-7 (skip 0=preparing and 8=done)
  const visibleStages = STAGES.slice(1, 8);

  return (
    <div className="flex flex-col gap-2.5 mt-10 w-full max-w-xs mx-auto">
      {visibleStages.map((s, i) => {
        const stageNum = i + 1;
        const isComplete = currentStage > stageNum;
        const isActive = currentStage === stageNum;
        const isPending = currentStage < stageNum;

        return (
          <div
            key={stageNum}
            className={`
              flex items-center gap-3 text-left transition-all duration-500
              ${isComplete ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-20'}
            `}
          >
            {/* Status indicator */}
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {isComplete ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-400">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : isActive ? (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse-subtle" />
              ) : (
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
              )}
            </div>

            {/* Label */}
            <span className={`text-[13px] ${isActive ? 'text-white font-medium' : 'text-white/60'}`}>
              {s.label.replace('\u2026', '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function StepBuilding({ stage, progress, selectedImageIds, projectId }: Props) {
  const [bgIndex, setBgIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(0);
  const [showGoButton, setShowGoButton] = useState(false);

  // Get selected images for background crossfade
  const bgImages = useMemo(() => {
    if (selectedImageIds.length === 0) return [];
    return CURATED_IMAGES.filter((img) => selectedImageIds.includes(img.id));
  }, [selectedImageIds]);

  // Crossfade background images
  useEffect(() => {
    if (bgImages.length === 0) return;

    // Fade in initial image
    setTimeout(() => setBgOpacity(1), 300);

    const interval = setInterval(() => {
      setBgOpacity(0);
      setTimeout(() => {
        setBgIndex((i) => (i + 1) % bgImages.length);
        setBgOpacity(1);
      }, 800);
    }, 4000);

    return () => clearInterval(interval);
  }, [bgImages.length]);

  // Show a "go to project" escape hatch after 20s so user is never stranded
  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(() => setShowGoButton(true), 20_000);
    return () => clearTimeout(timer);
  }, [projectId]);

  const currentStage = STAGES[Math.min(stage, STAGES.length - 1)];
  const isComplete = stage >= 8;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
      {/* Background images with crossfade */}
      {bgImages.length > 0 && (
        <div className="absolute inset-0">
          <img
            src={bgImages[bgIndex % bgImages.length]?.src}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: bgOpacity * 0.2 }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/50" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg px-6">
        {/* Stage headline */}
        <div className="min-h-[100px] flex flex-col items-center justify-center">
          {currentStage.icon && (
            <span
              key={`icon-${stage}`}
              className="text-[32px] mb-4 animate-fade-in block"
            >
              {currentStage.icon}
            </span>
          )}

          <h2
            key={stage}
            className={`text-[28px] md:text-[36px] leading-[1.1] font-medium tracking-tight text-white animate-fade-in ${
              isComplete ? 'animate-float' : ''
            }`}
          >
            {currentStage.label}
          </h2>

          {currentStage.sublabel && (
            <p
              key={`sub-${stage}`}
              className="text-[14px] text-white/40 mt-3 animate-fade-in max-w-sm"
            >
              {currentStage.sublabel}
            </p>
          )}
        </div>

        {/* Stage progress list — shows what's done and what's next */}
        {!isComplete && stage > 0 && (
          <StageList currentStage={stage} />
        )}

        {/* Progress bar */}
        <div className="mt-10 w-full max-w-xs mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-white/20 font-mono">
              {Math.round(progress)}%
            </p>
            {!isComplete && (
              <p className="text-[11px] text-white/20">
                Building your world
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Go to project button — appears after 20s as escape hatch */}
      {showGoButton && projectId && !isComplete && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 animate-fade-in">
          <a
            href={`/projects/${projectId}`}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
          >
            Taking a while? Go to your project &rarr;
          </a>
        </div>
      )}

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
