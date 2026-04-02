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
    <div className="animate-fade-in px-10 py-10 max-w-[1400px] mx-auto">
      <div className="space-y-4">
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
    <div className={`border-b border-[#E8E8E8] pb-8 mb-4 last:border-b-0 ${isRegenerating ? 'opacity-50' : ''}`}>
      {/* Track header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <span className="text-[13px] font-medium text-[#C4C4C4] pt-1">
            {String(track.track_number).padStart(2, '0')}
          </span>
          <div>
            <p className="text-[22px] leading-tight font-medium text-[#1A1A1A]">{track.title}</p>
            <p className="text-[11px] text-[#8A8A8A] font-mono mt-1">{track.structure}</p>
          </div>
        </div>
        {onRegenerate && (
          <ButtonV2 onClick={() => onRegenerate(track.track_number)} loading={isRegenerating} variant="ghost" size="sm">
            Regenerate
          </ButtonV2>
        )}
      </div>

      {/* Prompts — two-column cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Suno prompt */}
        <div className="bg-[#F7F7F5] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="orange">Suno</Badge>
              <span className={`text-[11px] font-mono ${sunoCharCount > 1000 ? 'text-signal-red' : 'text-[#C4C4C4]'}`}>
                {sunoCharCount}/1000
              </span>
            </div>
            <button
              onClick={() => handleCopy(track.suno_prompt, 'suno')}
              className="text-[11px] font-medium text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 border border-[#E8E8E8] rounded-full px-3 py-1 hover:border-[#1A1A1A]"
            >
              {copiedField === 'suno' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[13px] text-[#1A1A1A] font-mono leading-relaxed">
            {track.suno_prompt}
          </p>
        </div>

        {/* Udio prompt */}
        <div className="bg-[#F7F7F5] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="violet">Udio</Badge>
            <button
              onClick={() => handleCopy(track.udio_prompt, 'udio')}
              className="text-[11px] font-medium text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 border border-[#E8E8E8] rounded-full px-3 py-1 hover:border-[#1A1A1A]"
            >
              {copiedField === 'udio' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[13px] text-[#1A1A1A] leading-relaxed">
            {track.udio_prompt}
          </p>
        </div>
      </div>

      {/* Notes */}
      {track.notes && (
        <p className="text-[13px] text-[#8A8A8A] leading-relaxed mt-4">
          {track.notes}
        </p>
      )}
    </div>
  );
}
