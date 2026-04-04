'use client';

import { useState, useMemo } from 'react';
import { CURATED_IMAGES } from '../curatedImages';

/* eslint-disable @next/next/no-img-element */

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onContinue: () => void;
  onSkip?: () => void; // Only shown for professionals
}

const CATEGORIES = [
  'All',
  'Urban / Night',
  'Nature / Organic',
  'Texture / Abstract',
  'People / Movement',
  'Architecture / Space',
  'Vintage / Film',
  'Color Fields',
  'Dark / Moody',
];

export default function StepImages({ selectedIds, onChange, onContinue, onSkip }: Props) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const filteredImages = useMemo(() => {
    if (activeCategory === 'All') return CURATED_IMAGES;
    return CURATED_IMAGES.filter((img) => img.category === activeCategory);
  }, [activeCategory]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — fixed */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E8E8E8] pt-8 pb-4 px-6 md:px-10">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-3">
            Step 4
          </p>
          <h2 className="text-[28px] md:text-[36px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] mb-5">
            Tap the images that feel like your sound.
          </h2>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  text-[12px] font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-200
                  ${activeCategory === cat
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#F7F7F5] text-[#8A8A8A] hover:text-[#1A1A1A]'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Image grid */}
      <div className="flex-1 px-6 md:px-10 py-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredImages.map((image) => {
              const isSelected = selectedIds.includes(image.id);
              const isLoaded = loadedImages.has(image.id);

              return (
                <button
                  key={image.id}
                  onClick={() => toggle(image.id)}
                  className="group relative aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:ring-offset-2"
                >
                  {/* Placeholder */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-[#F7F7F5] animate-pulse" />
                  )}

                  {/* Image */}
                  <img
                    src={image.thumbnail_src}
                    alt={image.mood_tags.join(', ')}
                    loading="lazy"
                    onLoad={() => handleImageLoad(image.id)}
                    className={`
                      w-full h-full object-cover transition-all duration-300
                      ${isLoaded ? 'opacity-100' : 'opacity-0'}
                      ${isSelected ? 'scale-[0.92] rounded-lg' : 'group-hover:scale-[0.97]'}
                    `}
                  />

                  {/* Selection overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 ring-[3px] ring-inset ring-[#1A1A1A] rounded-lg">
                      {/* Checkmark */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Hover overlay with mood tags */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-3">
                      <div className="flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {image.mood_tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating bottom bar */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#E8E8E8] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-[#1A1A1A]">
              {selectedIds.length} selected
            </span>
            {selectedIds.length < 3 && (
              <span className="text-[13px] text-[#C4C4C4]">
                (pick at least 3)
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-[13px] text-[#8A8A8A] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors duration-150"
              >
                Skip visual selection
              </button>
            )}
            <button
              onClick={onContinue}
              disabled={selectedIds.length < 3}
              className={`
                text-[14px] font-medium px-6 py-2.5 rounded-full transition-all duration-200
                ${selectedIds.length >= 3
                  ? 'bg-[#1A1A1A] text-white hover:bg-black'
                  : 'bg-[#E8E8E8] text-[#C4C4C4] cursor-not-allowed'
                }
              `}
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
