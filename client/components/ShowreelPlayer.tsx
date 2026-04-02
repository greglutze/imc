'use client';

/**
 * ShowreelPlayer — auto-generated 30-second preview that crossfades
 * highlights from each track. Gives listeners a quick taste before
 * committing to the full project.
 *
 * Uses Web Audio API with MediaElement sources for CORS-safe playback
 * from Dropbox URLs. Each track gets an equal slice of the total duration,
 * starting ~30% in (past the intro, into the hook/chorus).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ButtonV2 } from './ui';

interface ShowreelTrack {
  id: string;
  title: string;
  dropbox_url: string;
  duration_ms: number | null;
}

interface ShowreelPlayerProps {
  tracks: ShowreelTrack[];
  totalDuration?: number; // total showreel length in seconds, default 30
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ShowreelPlayer({
  tracks,
  totalDuration = 30,
}: ShowreelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const activeRef = useRef(false);

  // Clip config
  const crossfadeDuration = 1; // seconds
  const clipCount = Math.min(tracks.length, 6); // max 6 clips for a 30s reel
  const clipDuration = totalDuration / clipCount;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsPlaying(false);
    setCurrentTrackIdx(0);
    setElapsed(0);

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    // Stop all audio elements
    audioElementsRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    });
    audioElementsRef.current = [];
    gainNodesRef.current = [];

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const play = useCallback(async () => {
    if (tracks.length === 0) return;

    setLoading(true);
    stop();

    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      activeRef.current = true;

      // Create audio elements and gain nodes for each clip
      const selectedTracks = tracks.slice(0, clipCount);
      const audioElements: HTMLAudioElement[] = [];
      const gainNodes: GainNode[] = [];

      for (const track of selectedTracks) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.src = track.dropbox_url;

        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);

        audioElements.push(audio);
        gainNodes.push(gain);
      }

      audioElementsRef.current = audioElements;
      gainNodesRef.current = gainNodes;

      // Wait for first track to be loadable
      await new Promise<void>((resolve, reject) => {
        const first = audioElements[0];
        const onCanPlay = () => { first.removeEventListener('canplaythrough', onCanPlay); resolve(); };
        const onError = () => { first.removeEventListener('error', onError); reject(new Error('Failed to load audio')); };
        first.addEventListener('canplaythrough', onCanPlay);
        first.addEventListener('error', onError);
        first.load();
      });

      setLoading(false);
      setIsPlaying(true);
      startTimeRef.current = ctx.currentTime;

      // Play the showreel — sequence through clips
      const playClip = async (idx: number) => {
        if (!activeRef.current || idx >= audioElements.length) {
          stop();
          return;
        }

        setCurrentTrackIdx(idx);
        const audio = audioElements[idx];
        const gain = gainNodes[idx];

        // Connect source (only once)
        try {
          const source = ctx.createMediaElementSource(audio);
          source.connect(gain);
        } catch {
          // Already connected — that's fine
        }

        // Start ~30% into the track for the most interesting part
        const trackDuration = audio.duration || 180;
        const startOffset = Math.min(trackDuration * 0.3, trackDuration - clipDuration - 2);
        audio.currentTime = Math.max(0, startOffset);

        // Fade in
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + crossfadeDuration);

        await audio.play();

        // Wait for clip duration minus crossfade, then start fading out and next clip
        await new Promise<void>((resolve) => {
          const fadeOutTime = (clipDuration - crossfadeDuration) * 1000;
          setTimeout(() => {
            if (!activeRef.current) { resolve(); return; }

            // Fade out current
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + crossfadeDuration);

            // Start next clip (overlaps during crossfade)
            if (idx + 1 < audioElements.length) {
              // Preload next
              const nextAudio = audioElements[idx + 1];
              nextAudio.load();
              setTimeout(() => {
                playClip(idx + 1);
              }, 100);
            }

            // Stop current after fade
            setTimeout(() => {
              try { audio.pause(); } catch { /* ignore */ }
              resolve();
            }, crossfadeDuration * 1000);
          }, fadeOutTime);
        });
      };

      // Progress timer
      const updateProgress = () => {
        if (!activeRef.current || !audioContextRef.current) return;
        const now = audioContextRef.current.currentTime;
        const el = now - startTimeRef.current;
        setElapsed(Math.min(el, totalDuration));

        if (el >= totalDuration) {
          stop();
          return;
        }
        timerRef.current = requestAnimationFrame(updateProgress);
      };
      timerRef.current = requestAnimationFrame(updateProgress);

      // Start first clip
      await playClip(0);

    } catch (err) {
      console.error('Showreel playback failed:', err);
      setLoading(false);
      stop();
    }
  }, [tracks, clipCount, clipDuration, crossfadeDuration, totalDuration, stop]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, stop, play]);

  if (tracks.length < 2) return null; // Need at least 2 tracks for a showreel

  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  const currentTrack = tracks[currentTrackIdx];

  return (
    <div className="border border-[#E8E8E8] rounded-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <span className="text-label font-semibold uppercase tracking-wide text-black">
            Showreel
          </span>
          <span className="text-micro text-neutral-400">
            {totalDuration}s preview · {Math.min(tracks.length, clipCount)} tracks
          </span>
        </div>
      </div>

      {/* Player */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-4 mb-3">
          <ButtonV2
            onClick={togglePlay}
            disabled={loading}
            variant="media"
            size="md"
            data-active={isPlaying}
          >
            <span className="text-[11px] leading-none">
              {loading ? '...' : isPlaying ? '▮▮' : '▶'}
            </span>
          </ButtonV2>

          <div className="flex-1 min-w-0">
            {isPlaying && currentTrack ? (
              <span className="text-body-sm text-black truncate block">
                {currentTrack.title}
              </span>
            ) : (
              <span className="text-body-sm text-neutral-400">
                {loading ? 'Loading tracks...' : 'Play a quick preview of your project'}
              </span>
            )}
          </div>

          <span className="text-micro font-mono text-neutral-400 shrink-0">
            {formatTime(elapsed)} / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Track indicators */}
        {isPlaying && (
          <div className="flex gap-1 mt-3">
            {tracks.slice(0, clipCount).map((track, idx) => (
              <div
                key={track.id}
                className={`flex-1 h-1 rounded-full transition-colors duration-150 ${
                  idx < currentTrackIdx
                    ? 'bg-black'
                    : idx === currentTrackIdx
                      ? 'bg-neutral-400'
                      : 'bg-neutral-100'
                }`}
                title={track.title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
