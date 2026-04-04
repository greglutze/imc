'use client';

import { useState, useEffect, useMemo } from 'react';
import { CURATED_IMAGES } from '../curatedImages';

/* eslint-disable @next/next/no-img-element */

interface Props {
  stage: number;
  progress: number;
  selectedImageIds: string[];
}

const STAGES = [
  { label: 'Preparing your workspace\u2026', sublabel: '' },
  { label: 'Creating your project\u2026', sublabel: 'Setting up the foundation' },
  { label: 'Extracting your concept\u2026', sublabel: 'Analyzing your vision and influences' },
  { label: 'Building your moodboard\u2026', sublabel: 'Curating your visual world' },
  { label: 'Researching your market\u2026', sublabel: 'Mapping comparable artists and audiences' },
  { label: 'Designing your sonic engine\u2026', sublabel: 'Generating style profiles and track prompts' },
  { label: 'Your project is ready.', sublabel: '' },
];

export default function StepBuilding({ stage, progress, selectedImageIds }: Props) {
  const [bgIndex, setBgIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(0);

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

  const currentStage = STAGES[Math.min(stage, STAGES.length - 1)];
  const isComplete = stage >= 6;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
      {/* Background images with crossfade */}
      {bgImages.length > 0 && (
        <div className="absolute inset-0">
          <img
            src={bgImages[bgIndex % bgImages.length]?.src}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: bgOpacity * 0.25 }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/40" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg px-6">
        {/* Stage headline */}
        <div className="min-h-[120px] flex flex-col items-center justify-center">
          <h2
            key={stage}
            className={`text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-white animate-fade-in ${
              isComplete ? 'animate-float' : ''
            }`}
          >
            {currentStage.label}
          </h2>

          {currentStage.sublabel && (
            <p
              key={`sub-${stage}`}
              className="text-[14px] text-white/50 mt-3 animate-fade-in"
            >
              {currentStage.sublabel}
            </p>
          )}
        </div>

        {/* Animated dots — only while building */}
        {!isComplete && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse-subtle" />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse-subtle" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse-subtle" style={{ animationDelay: '400ms' }} />
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-12 w-full max-w-xs mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/30 mt-3 font-mono">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
