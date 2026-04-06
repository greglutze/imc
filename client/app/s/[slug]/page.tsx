'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import ShowreelPlayer from '../../../components/ShowreelPlayer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

interface PublicTrack {
  id: string;
  title: string;
  dropbox_url: string;
  format: string;
  duration_ms: number | null;
  sort_order: number;
}

interface PublicShareData {
  id: string;
  title: string;
  artwork_url: string | null;
  theme: 'dark' | 'light';
  downloads_enabled: boolean;
  password_required: boolean;
  tracks: PublicTrack[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ListenerPage() {
  const { slug } = useParams<{ slug: string }>();

  const [share, setShare] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password
  const [passwordInput, setPasswordInput] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);

  // Player
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchShare = useCallback(async (token?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-share-token'] = token;

      const res = await fetch(`${API_BASE}/api/s/${slug}`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Not found' }));
        setError(data.error || 'This project is not available.');
        return;
      }
      const data: PublicShareData = await res.json();
      setShare(data);
      setError(null);
    } catch {
      setError('Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchShare(shareToken || undefined);
  }, [slug, shareToken, fetchShare]);

  const handleVerifyPassword = useCallback(async () => {
    if (!passwordInput.trim()) return;
    setPasswordError(false);
    try {
      const res = await fetch(`${API_BASE}/api/s/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (!res.ok) {
        setPasswordError(true);
        return;
      }
      const data = await res.json();
      setShareToken(data.token);
      setLoading(true);
    } catch {
      setPasswordError(true);
    }
  }, [slug, passwordInput]);

  const playTrack = useCallback((idx: number) => {
    if (!share) return;
    const track = share.tracks[idx];
    if (!track) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.dropbox_url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      // Auto-advance
      if (idx < share.tracks.length - 1) {
        playTrack(idx + 1);
      } else {
        setIsPlaying(false);
        setCurrentTrackIdx(null);
      }
    });

    audio.play();
    setCurrentTrackIdx(idx);
    setIsPlaying(true);
    setCurrentTime(0);

    // Record play
    fetch(`${API_BASE}/api/s/${slug}/play/${track.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }, [share, slug]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  }, [duration]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const isDark = share?.theme === 'dark';
  const bg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-[#C4C4C4]' : 'text-[#8A8A8A]';
  const textMuted = isDark ? 'text-[#666]' : 'text-[#C4C4C4]';
  const border = isDark ? 'border-[#1A1A1A]' : 'border-[#E8E8E8]';
  const hoverBorder = isDark ? 'hover:border-[#8A8A8A]' : 'hover:border-[#C4C4C4]';
  const trackActive = isDark ? 'bg-[#0a0a0a]' : 'bg-[#F7F7F5]';
  const progressBg = isDark ? 'bg-[#1A1A1A]' : 'bg-[#E8E8E8]';
  const progressFill = isDark ? 'bg-white' : 'bg-black';
  const inputBg = isDark ? 'bg-[#0a0a0a] border-[#333]' : 'bg-white border-[#E8E8E8]';

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <span className={`text-[12px] uppercase tracking-widest ${textSecondary}`}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <span className="text-[12px] uppercase tracking-widest text-[#8A8A8A]">{error}</span>
        </div>
      </div>
    );
  }

  if (!share) return null;

  // Password gate
  if (share.password_required) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className="w-full max-w-sm px-6">
          {share.artwork_url && (
            <div className="w-32 h-32 mx-auto mb-8  overflow-hidden border border-[#1A1A1A]">
              <img src={resolveUrl(share.artwork_url) || ''} alt={share.title} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className={`text-[22px] font-bold ${textPrimary} text-center mb-8`}>{share.title}</h1>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPassword(); }}
              placeholder="Enter password"
              className={`w-full text-[13px] ${inputBg} border  px-4 py-3 outline-none focus:border-[#8A8A8A] ${textPrimary}`}
            />
            {passwordError && (
              <p className="text-[11px] text-red-500">Incorrect password.</p>
            )}
            <button
              onClick={handleVerifyPassword}
              className={`w-full py-3 ${isDark ? 'bg-white text-black hover:bg-[#E8E8E8]' : 'bg-black text-white hover:bg-[#1A1A1A]'} text-[12px] font-bold uppercase tracking-widest  transition-colors duration-fast`}
            >
              Listen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTrack = currentTrackIdx !== null ? share.tracks[currentTrackIdx] : null;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Artwork + Title */}
        <div className="text-center mb-12">
          {share.artwork_url ? (
            <div className={`w-64 h-64 mx-auto mb-8  overflow-hidden border ${border}`}>
              <img src={resolveUrl(share.artwork_url) || ''} alt={share.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-64 h-64 mx-auto mb-8  border ${border} flex items-center justify-center`}>
              <span className={`text-[40px] ${textMuted}`}>♫</span>
            </div>
          )}
          <h1 className={`text-[22px] font-bold ${textPrimary}`}>{share.title}</h1>
        </div>

        {/* Showreel — quick preview mix */}
        {share.tracks.length >= 2 && (
          <div className="mb-8">
            <ShowreelPlayer
              tracks={share.tracks.map((t) => ({
                id: t.id,
                title: t.title,
                dropbox_url: t.dropbox_url,
                duration_ms: null,
              }))}
            />
          </div>
        )}

        {/* Track list */}
        <div className="space-y-1 mb-8">
          {share.tracks.map((track, idx) => {
            const isActive = currentTrackIdx === idx;
            return (
              <button
                key={track.id}
                onClick={() => {
                  if (isActive) {
                    togglePlayPause();
                  } else {
                    playTrack(idx);
                  }
                }}
                className={`w-full text-left flex items-center gap-4 px-4 py-3  border ${border} ${hoverBorder} transition-colors duration-fast ${isActive ? trackActive : ''}`}
              >
                <span className={`text-[13px] w-5 text-center shrink-0 ${isActive && isPlaying ? textPrimary : textSecondary}`}>
                  {isActive && isPlaying ? '▮▮' : isActive ? '▶' : (idx + 1)}
                </span>
                <span className={`flex-1 text-[14px] ${isActive ? textPrimary + ' font-bold' : textPrimary}`}>
                  {track.title}
                </span>
                {share.downloads_enabled && (
                  <a
                    href={track.dropbox_url}
                    download={`${track.title}.${track.format}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-[11px] ${textSecondary} ${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors duration-fast`}
                    title="Download"
                  >
                    ↓
                  </a>
                )}
              </button>
            );
          })}
        </div>

        {/* Player bar (when track is playing) */}
        {currentTrack && (
          <div className={`border-t ${border} pt-6`}>
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={togglePlayPause}
                className={`${textPrimary} text-[14px] shrink-0`}
              >
                {isPlaying ? '▮▮' : '▶'}
              </button>
              <span className={`text-[13px] ${textPrimary} font-bold flex-1 truncate`}>
                {currentTrack.title}
              </span>
              <span className={`text-[11px] ${textSecondary} shrink-0`}>
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </span>
            </div>
            <div
              className={`w-full h-1 ${progressBg} rounded-full cursor-pointer`}
              onClick={handleSeek}
            >
              <div
                className={`h-full ${progressFill} rounded-full transition-all duration-100`}
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`text-center mt-16 pt-8 border-t ${border}`}>
          <span className={`text-[11px] ${textMuted} uppercase tracking-widest`}>Shared via IMC</span>
        </div>
      </div>
    </div>
  );
}
