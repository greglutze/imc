'use client';

import { useState } from 'react';
import { Badge, ButtonV2 } from './ui';
import type { I2Track } from '../lib/api';

interface TrackPromptsProps {
  tracks: I2Track[];
  onRegenerateTrack?: (trackNumber: number) => void;
  regenerating?: number | null;
}

export default function TrackPrompts({ tracks, onRegenerateTrack, regenerating }: TrackPromptsProps) {
  return (
    <div className="animate-fade-in">
      {/* Track cards */}
      <div className="divide-y divide-[#E8E8E8]">
        {tracks.map((track) => (
          <TrackCard
            key={track.track_number}
            track={track}
            onRegenerate={onRegenerateTrack}
            isRegenerating={regenerating === track.track_number}
          />
        ))}
      </div>
    </div>
  );
}

function TrackCard({
  track,
  onRegenerate,
  isRegenerating,
}: {
  track: I2Track;
  onRegenerate?: (trackNumber: number) => void;
  isRegenerating: boolean;
}) {
  const [copiedField, setCopiedField] = useState<'suno' | 'udio' | null>(null);
  const sunoCharCount = track.suno_prompt.length;

  const handleCopy = async (text: string, field: 'suno' | 'udio') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`px-8 py-8 ${isRegenerating ? 'opacity-50' : ''}`}>
      {/* Track header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <span className="text-[40px] leading-none font-bold font-mono text-neutral-200">
            {String(track.track_number).padStart(2, '0')}
          </span>
          <div>
            <p className="text-heading-sm font-semibold text-black">{track.title}</p>
            <p className="text-caption text-neutral-400 font-mono mt-1">{track.structure}</p>
          </div>
        </div>
        {onRegenerate && (
          <ButtonV2 onClick={() => onRegenerate(track.track_number)} loading={isRegenerating} variant="ghost" size="sm">
            Regenerate
          </ButtonV2>
        )}
      </div>

      {/* Prompts — two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Suno prompt */}
        <div className="border border-[#E8E8E8] rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="orange">Suno</Badge>
              <span className={`text-caption font-mono ${sunoCharCount > 1000 ? 'text-signal-red' : 'text-neutral-300'}`}>
                {sunoCharCount}/1000 chars
              </span>
            </div>
            <button
              onClick={() => handleCopy(track.suno_prompt, 'suno')}
              className="text-label font-semibold uppercase tracking-wide text-neutral-300 hover:text-black transition-colors duration-150"
            >
              {copiedField === 'suno' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-body-sm text-neutral-700 font-mono leading-relaxed">
            {track.suno_prompt}
          </p>
        </div>

        {/* Udio prompt */}
        <div className="border border-[#E8E8E8] rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="violet">Udio</Badge>
            <button
              onClick={() => handleCopy(track.udio_prompt, 'udio')}
              className="text-label font-semibold uppercase tracking-wide text-neutral-300 hover:text-black transition-colors duration-150"
            >
              {copiedField === 'udio' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-body-sm text-neutral-700 leading-relaxed">
            {track.udio_prompt}
          </p>
        </div>
      </div>

      {/* Notes */}
      {track.notes && (
        <div className="mt-4 bg-[#F7F7F5] rounded-md px-4 py-3">
          <p className="text-caption text-[#8A8A8A] uppercase tracking-wide font-semibold mb-1">Notes</p>
          <p className="text-body-sm text-neutral-600">{track.notes}</p>
        </div>
      )}
    </div>
  );
}
