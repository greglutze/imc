'use client';

import { ButtonV2 } from '../../ui';

interface Props {
  selected: string[];
  onChange: (genres: string[]) => void;
  onContinue: () => void;
}

const GENRES = [
  // Row 1 — mainstream
  { id: 'pop', label: 'Pop', color: '#FF6B9D' },
  { id: 'rnb', label: 'R&B', color: '#9B59B6' },
  { id: 'hip-hop', label: 'Hip-Hop', color: '#E67E22' },
  { id: 'rap', label: 'Rap', color: '#D35400' },
  // Row 2 — electronic family
  { id: 'electronic', label: 'Electronic', color: '#3498DB' },
  { id: 'house', label: 'House', color: '#2980B9' },
  { id: 'techno', label: 'Techno', color: '#1F618D' },
  { id: 'drum-and-bass', label: 'Drum & Bass', color: '#154360' },
  // Row 3 — guitar-driven
  { id: 'rock', label: 'Rock', color: '#E74C3C' },
  { id: 'indie', label: 'Indie', color: '#1ABC9C' },
  { id: 'punk', label: 'Punk', color: '#FF4757' },
  { id: 'metal', label: 'Metal', color: '#2C3E50' },
  // Row 4 — global
  { id: 'latin', label: 'Latin', color: '#F39C12' },
  { id: 'reggaeton', label: 'Reggaeton', color: '#FFC312' },
  { id: 'afrobeats', label: 'Afrobeats', color: '#27AE60' },
  { id: 'k-pop', label: 'K-Pop', color: '#FF85C0' },
  // Row 5 — soulful / acoustic
  { id: 'soul', label: 'Soul', color: '#AF7AC5' },
  { id: 'gospel', label: 'Gospel', color: '#D4AC0D' },
  { id: 'folk', label: 'Folk', color: '#A0826D' },
  { id: 'country', label: 'Country', color: '#D4A574' },
  // Row 6 — jazz / classical / experimental
  { id: 'jazz', label: 'Jazz', color: '#8E44AD' },
  { id: 'classical', label: 'Classical', color: '#BDC3C7' },
  { id: 'ambient', label: 'Ambient', color: '#5DADE2' },
  { id: 'experimental', label: 'Experimental', color: '#95A5A6' },
  // Row 7 — caribbean / dancehall / world
  { id: 'reggae', label: 'Reggae', color: '#229954' },
  { id: 'dancehall', label: 'Dancehall', color: '#F5B041' },
  { id: 'afro-fusion', label: 'Afro-Fusion', color: '#58D68D' },
  { id: 'world', label: 'World', color: '#76D7C4' },
  // Row 8 — alt / niche
  { id: 'alt-rnb', label: 'Alt R&B', color: '#C39BD3' },
  { id: 'lo-fi', label: 'Lo-Fi', color: '#AED6F1' },
  { id: 'trap', label: 'Trap', color: '#E59866' },
  { id: 'singer-songwriter', label: 'Singer-Songwriter', color: '#EDBB99' },
  // Row 9 — more
  { id: 'blues', label: 'Blues', color: '#5B7DB1' },
  { id: 'funk', label: 'Funk', color: '#E056A0' },
  { id: 'disco', label: 'Disco', color: '#F7DC6F' },
  { id: 'neo-soul', label: 'Neo-Soul', color: '#BB8FCE' },
  // Row 10 — production-forward
  { id: 'synthwave', label: 'Synthwave', color: '#E74CFF' },
  { id: 'drill', label: 'Drill', color: '#B03A2E' },
  { id: 'phonk', label: 'Phonk', color: '#7B241C' },
  { id: 'hyperpop', label: 'Hyperpop', color: '#FF69B4' },
];

export default function StepGenre({ selected, onChange, onContinue }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id));
    } else if (selected.length < 3) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 2a
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-3">
          What sounds are you drawn to?
        </h2>
        <p className="text-[14px] text-[#8A8A8A] text-center mb-10">
          Pick up to 3 genres
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.map((genre) => {
            const isSelected = selected.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => toggle(genre.id)}
                className={`
                  relative px-5 py-4 rounded-lg text-left transition-all duration-200
                  ${isSelected
                    ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A] scale-[1.02]'
                    : 'bg-[#F7F7F5] hover:bg-[#F0F0ED] text-[#1A1A1A]'
                  }
                `}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-3 transition-all duration-200 ${isSelected ? 'scale-125' : ''}`}
                  style={{ backgroundColor: genre.color }}
                />
                <p className={`text-[15px] font-medium ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                  {genre.label}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center mt-10">
          <ButtonV2
            onClick={onContinue}
            disabled={selected.length === 0}
            size="lg"
            arrow
          >
            Continue{selected.length > 0 ? ` with ${selected.length}` : ''}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
