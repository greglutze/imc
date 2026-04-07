'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Badge, ButtonV2 } from './ui';
import { api } from '../lib/api';
import type { I2Track } from '../lib/api';

interface TrackPromptsProps {
  tracks: I2Track[];
  onRegenerateTrack?: (trackNumber: number) => void;
  regenerating?: number | null;
}

export default function TrackPrompts({ tracks, onRegenerateTrack, regenerating }: TrackPromptsProps) {
  return (
    <div className="content-reveal py-10">
      <div className="space-y-4 stagger-enter">
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
  const { id } = useParams<{ id: string }>();
  const [copiedField, setCopiedField] = useState<'suno' | 'lyrics' | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const sunoCharCount = track.suno_prompt.length;

  // Normalize escaped newlines from JSON into real newlines
  const normalizeLyrics = (text: string) => text.replace(/\\n/g, '\n');

  const handleCopy = async (text: string, field: 'suno' | 'lyrics') => {
    try {
      const normalized = field === 'lyrics' ? normalizeLyrics(text) : text;
      await navigator.clipboard.writeText(normalized);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleEditInLyrics = useCallback(async () => {
    if (!id || creatingSession) return;
    setCreatingSession(true);
    try {
      const session = await api.createLyricSession(id, {
        entry_mode: 'paste',
        title: track.title,
        lyrics: normalizeLyrics(track.lyrics),
      });
      window.location.href = `/projects/${id}/lyrics/${session.id}`;
    } catch (err) {
      console.error('Failed to create lyrics session:', err);
      setCreatingSession(false);
    }
  }, [id, track, creatingSession]);

  // Format lyrics with structure tags highlighted
  const renderLyrics = (lyrics: string) => {
    if (!lyrics) return null;
    // Handle both literal \n (from JSON) and actual newlines
    const normalized = lyrics.replace(/\\n/g, '\n');
    const lines = normalized.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      // Structure tags like [Chorus], [Verse 1], etc.
      if (/^\[.+\]$/.test(trimmed)) {
        return (
          <p key={i} className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mt-4 mb-1 first:mt-0">
            {trimmed}
          </p>
        );
      }
      // Empty lines = section spacing
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }
      // Regular lyric line
      return (
        <p key={i} className="text-[14px] text-[#1A1A1A] leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className={`border-b border-[#E8E8E8] pb-8 mb-4 last:border-b-0 ${isRegenerating ? 'opacity-50' : ''}`}>
      {/* Track header — title + short notes + regenerate badge */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-4">
          <span className="text-[13px] font-medium text-[#C4C4C4] pt-1">
            {String(track.track_number).padStart(2, '0')}
          </span>
          <div>
            <p className="text-[22px] leading-tight font-medium text-[#1A1A1A]">{track.title}</p>
            {track.notes && (
              <p className="text-[13px] text-[#8A8A8A] leading-relaxed mt-1 max-w-xl">
                {track.notes.length > 120 ? track.notes.slice(0, 120).trim() + '...' : track.notes}
              </p>
            )}
          </div>
        </div>
        {onRegenerate && (
          <Badge variant="action" onClick={() => onRegenerate(track.track_number)}>
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Badge>
        )}
      </div>

      {/* Two-column: Suno Prompt + Lyrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Suno prompt */}
        <div className="bg-[#F7F7F5] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
              Suno Prompt
              <span className={`ml-2 font-mono ${sunoCharCount > 1000 ? 'text-signal-red' : 'text-[#C4C4C4]'}`}>
                {sunoCharCount}/1000
              </span>
            </p>
            <Badge variant="action" copyText={track.suno_prompt}>Copy</Badge>
          </div>
          <p className="text-[13px] text-[#1A1A1A] font-mono leading-relaxed">
            {track.suno_prompt}
          </p>
        </div>

        {/* Lyrics */}
        <div className="bg-[#F7F7F5] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
              Lyrics
            </p>
            <div className="flex items-center gap-2">
              {track.lyrics && (
                <Badge variant="action" onClick={handleEditInLyrics}>
                  {creatingSession ? 'Opening...' : 'Refine in Lyrics'}
                </Badge>
              )}
              <Badge variant="action" copyText={track.lyrics}>Copy</Badge>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto pr-2 flex-1">
            {renderLyrics(track.lyrics)}
          </div>
        </div>
      </div>
    </div>
  );
}
