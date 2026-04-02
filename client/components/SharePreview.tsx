'use client';

/* eslint-disable @next/next/no-img-element */

/**
 * SharePreview — a scaled-down, non-interactive replica of the public listener page.
 * Renders in real-time from the editor's state so artists see exactly what listeners see.
 */

import { resolveArtworkUrl } from '../lib/api';

interface PreviewTrack {
  id: string;
  title: string;
  format: string;
  sort_order: number;
}

interface SharePreviewProps {
  title: string;
  artworkUrl: string | null;
  theme: 'dark' | 'light';
  tracks: PreviewTrack[];
  downloadsEnabled: boolean;
  isPublic: boolean;
  passwordProtected: boolean;
}

export default function SharePreview({
  title,
  artworkUrl,
  theme,
  tracks,
  downloadsEnabled,
  isPublic,
  passwordProtected,
}: SharePreviewProps) {
  const isDark = theme === 'dark';

  // Theme tokens matching the real listener page
  const bg = isDark ? 'bg-neutral-950' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const textMuted = isDark ? 'text-neutral-600' : 'text-neutral-300';
  const border = isDark ? 'border-neutral-800' : 'border-[#E8E8E8]';

  return (
    <div className="relative">
      {/* Phone frame */}
      <div className={`rounded-lg border-2 ${isDark ? 'border-neutral-700' : 'border-neutral-300'} overflow-hidden shadow-lg`}>
        {/* Status bar mock */}
        <div className={`${isDark ? 'bg-neutral-900' : 'bg-neutral-100'} px-4 py-1.5 flex items-center justify-between`}>
          <span className={`text-[9px] font-mono ${textSecondary}`}>9:41</span>
          <div className={`w-16 h-1 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
          <div className="flex items-center gap-1">
            <div className={`w-2.5 h-1.5 rounded-sm ${isDark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
            <div className={`w-1 h-1.5 rounded-sm ${isDark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
          </div>
        </div>

        {/* Page content — scaled down */}
        <div className={`${bg} px-4 py-6 min-h-[420px]`}>
          {/* Password gate preview */}
          {passwordProtected && (
            <div className="absolute top-12 right-3">
              <span className={`text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${isDark ? 'bg-neutral-800 text-[#8A8A8A]' : 'bg-neutral-100 text-neutral-500'}`}>
                Password
              </span>
            </div>
          )}

          {/* Artwork */}
          <div className="text-center mb-5">
            {artworkUrl ? (
              <div className={`w-28 h-28 mx-auto mb-4 rounded-md overflow-hidden border ${border}`}>
                <img
                  src={resolveArtworkUrl(artworkUrl) || ''}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-28 h-28 mx-auto mb-4 rounded-md border ${border} flex items-center justify-center`}>
                <span className={`text-[32px] ${textMuted}`}>♫</span>
              </div>
            )}
            <h2 className={`text-[13px] font-bold ${textPrimary} leading-tight`}>
              {title || 'Untitled'}
            </h2>
          </div>

          {/* Track list */}
          {tracks.length > 0 ? (
            <div className="space-y-0.5">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-md border ${border}`}
                >
                  <span className={`text-[9px] w-3 text-center shrink-0 ${textSecondary}`}>
                    {idx + 1}
                  </span>
                  <span className={`flex-1 text-[10px] ${textPrimary} truncate`}>
                    {track.title}
                  </span>
                  {downloadsEnabled && (
                    <span className={`text-[8px] ${textSecondary}`}>↓</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 border ${border} rounded-md border-dashed`}>
              <span className={`text-[10px] ${textMuted}`}>No tracks yet</span>
            </div>
          )}

          {/* Footer */}
          <div className={`text-center mt-6 pt-4 border-t ${border}`}>
            <span className={`text-[8px] ${textMuted} uppercase tracking-wide`}>
              Shared via IMC
            </span>
          </div>
        </div>
      </div>

      {/* Visibility badge */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-neutral-400'}`} />
        <span className="text-micro text-[#8A8A8A] uppercase tracking-wide">
          {isPublic ? 'Public' : 'Private'}
          {passwordProtected ? ' · Password Protected' : ''}
        </span>
      </div>
    </div>
  );
}
