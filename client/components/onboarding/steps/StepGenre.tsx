'use client';

import { ButtonV2 } from '../../ui';

interface Props {
  selected: string[];
  onChange: (genres: string[]) => void;
  onContinue: () => void;
}

const GENRES = [
  { id: 'pop', label: 'Pop', color: '#FF6B9D' },
  { id: 'rnb', label: 'R&B', color: '#9B59B6' },
  { id: 'hip-hop', label: 'Hip-Hop', color: '#E67E22' },
  { id: 'electronic', label: 'Electronic', color: '#3498DB' },
  { id: 'rock', label: 'Rock', color: '#E74C3C' },
  { id: 'indie', label: 'Indie', color: '#1ABC9C' },
  { id: 'country', label: 'Country', color: '#D4A574' },
  { id: 'latin', label: 'Latin', color: '#F39C12' },
  { id: 'afrobeats', label: 'Afrobeats', color: '#27AE60' },
  { id: 'jazz', label: 'Jazz', color: '#8E44AD' },
  { id: 'classical', label: 'Classical', color: '#BDC3C7' },
  { id: 'ambient', label: 'Ambient', color: '#5DADE2' },
  { id: 'punk', label: 'Punk', color: '#FF4757' },
  { id: 'metal', label: 'Metal', color: '#2C3E50' },
  { id: 'folk', label: 'Folk', color: '#A0826D' },
  { id: 'reggaeton', label: 'Reggaeton', color: '#FFC312' },
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
      <div className="max-w-2xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 2a
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-3">
          What sounds are you drawn to?
        </h2>
        <p className="text-[14px] text-[#8A8A8A] text-center mb-10">
          Pick up to 3 genres
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
