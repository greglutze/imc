'use client';

import { useState, useRef, useEffect } from 'react';
import { ButtonV2 } from '../../ui';
import type { ExperienceLevel } from '../OnboardingFlow';

interface Props {
  selected: string[];
  onChange: (artists: string[]) => void;
  onContinue: () => void;
  experienceLevel: ExperienceLevel;
  genres: string[];
}

// Suggested artists by genre for Explorer path
const GENRE_SUGGESTIONS: Record<string, string[]> = {
  'pop': ['Taylor Swift', 'Dua Lipa', 'The Weeknd', 'Billie Eilish', 'Harry Styles', 'Olivia Rodrigo'],
  'rnb': ['SZA', 'Frank Ocean', 'Daniel Caesar', 'Jhene Aiko', 'Summer Walker', 'Brent Faiyaz'],
  'hip-hop': ['Kendrick Lamar', 'Tyler, The Creator', 'J. Cole', 'Travis Scott', 'Drake', 'Baby Keem'],
  'electronic': ['Fred Again', 'Disclosure', 'Bonobo', 'Jamie xx', 'Four Tet', 'Caribou'],
  'rock': ['Arctic Monkeys', 'Tame Impala', 'Radiohead', 'The Strokes', 'Queens of the Stone Age', 'Fontaines D.C.'],
  'indie': ['Bon Iver', 'Phoebe Bridgers', 'Mac DeMarco', 'Clairo', 'Alvvays', 'Japanese Breakfast'],
  'country': ['Zach Bryan', 'Tyler Childers', 'Kacey Musgraves', 'Chris Stapleton', 'Sturgill Simpson', 'Sierra Ferrell'],
  'latin': ['Bad Bunny', 'Rosalia', 'J Balvin', 'Karol G', 'Rauw Alejandro', 'Peso Pluma'],
  'afrobeats': ['Burna Boy', 'Wizkid', 'Tems', 'Rema', 'Ayra Starr', 'Asake'],
  'jazz': ['Kamasi Washington', 'Robert Glasper', 'Nubya Garcia', 'Thundercat', 'Esperanza Spalding', 'GoGo Penguin'],
  'classical': ['Max Richter', 'Olafur Arnalds', 'Nils Frahm', 'Ludovico Einaudi', 'Hildur Gudnadottir', 'Nico Muhly'],
  'ambient': ['Brian Eno', 'Aphex Twin', 'Nils Frahm', 'Tim Hecker', 'Stars of the Lid', 'Grouper'],
  'punk': ['IDLES', 'Turnstile', 'Amyl and the Sniffers', 'Fontaines D.C.', 'Black Midi', 'Shame'],
  'metal': ['Gojira', 'Mastodon', 'Deafheaven', 'Sleep Token', 'Spiritbox', 'Knocked Loose'],
  'folk': ['Fleet Foxes', 'Iron & Wine', 'Adrianne Lenker', 'Nick Drake', 'Elliott Smith', 'Vashti Bunyan'],
  'reggaeton': ['Bad Bunny', 'Daddy Yankee', 'J Balvin', 'Ozuna', 'Rauw Alejandro', 'Karol G'],
};

export default function StepArtists({ selected, onChange, onContinue, experienceLevel, genres }: Props) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Get suggestions based on selected genres
  const suggestions = genres.flatMap((g) => GENRE_SUGGESTIONS[g] || [])
    .filter((a, i, arr) => arr.indexOf(a) === i) // dedupe
    .filter((a) => !selected.includes(a))
    .slice(0, 8);

  const addArtist = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !selected.includes(trimmed) && selected.length < 5) {
      onChange([...selected, trimmed]);
      setInputValue('');
    }
  };

  const removeArtist = (name: string) => {
    onChange(selected.filter((a) => a !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addArtist(inputValue);
    }
  };

  const handleSurpriseMe = () => {
    // Pick 3 random from suggestions
    const available = suggestions.filter((a) => !selected.includes(a));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(3, 5 - selected.length));
    onChange([...selected, ...picks]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full">
        <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-4 text-center">
          Step 5
        </p>
        <h2 className="text-[32px] md:text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A] text-center mb-3">
          Name a few artists that<br />inspire this project.
        </h2>
        <p className="text-[14px] text-[#8A8A8A] text-center mb-10">
          Up to 5 &mdash; or skip this step entirely
        </p>

        {/* Selected artists as pills */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {selected.map((artist) => (
              <span
                key={artist}
                className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1A1A1A] bg-[#F7F7F5] px-4 py-2 rounded-full"
              >
                {artist}
                <button
                  onClick={() => removeArtist(artist)}
                  className="text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        {selected.length < 5 && (
          <div className="relative mb-6">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type an artist name and press Enter"
              className="w-full bg-[#F7F7F5] rounded-lg px-6 py-4 text-[16px] text-[#1A1A1A] placeholder:text-[#C4C4C4] outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all duration-200"
              autoComplete="off"
            />
          </div>
        )}

        {/* Suggestions — visible for Explorer path */}
        {experienceLevel === 'explorer' && suggestions.length > 0 && selected.length < 5 && (
          <div className="mb-8">
            <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-3">
              Popular in your genres
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((artist) => (
                <button
                  key={artist}
                  onClick={() => addArtist(artist)}
                  className="text-[13px] font-medium px-4 py-2 rounded-full bg-white border border-[#E8E8E8] text-[#8A8A8A] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all duration-200"
                >
                  + {artist}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Surprise me button */}
        {selected.length < 3 && suggestions.length >= 3 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleSurpriseMe}
              className="text-[13px] font-medium text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 flex items-center gap-2"
            >
              <span className="text-[16px]">&#x2728;</span> Surprise me
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <ButtonV2
            onClick={onContinue}
            size="lg"
            arrow
          >
            {selected.length === 0 ? 'Skip this step' : 'Continue'}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
