'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import * as api from '../../../lib/api';

// Extract video thumbnail URL from common platforms
function getVideoThumbnail(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;

  return null;
}

// Extract embed URL for videos
function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ArchiveItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<api.ArchiveItem | null>(null);
  const [artist, setArtist] = useState<api.Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('v2_artist');
      if (!stored) { router.push('/archive'); return; }

      try {
        const a = JSON.parse(stored);
        setArtist(a);
        const data = await api.getArchiveItem(a.id, params.id as string);
        setItem(data);
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-4 h-4 border border-neutral-200 border-t-black animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!item || !artist) {
    return (
      <AppShell>
        <div className="min-h-screen bg-white px-12 pt-[80px]">
          <p className="text-[13px] text-neutral-300">Item not found.</p>
          <button onClick={() => router.push('/archive')} className="text-[13px] text-black mt-4 hover:text-neutral-500 transition-colors">
            Back to archive
          </button>
        </div>
      </AppShell>
    );
  }

  const isVideo = item.file_url ? !!getVideoEmbedUrl(item.file_url) : false;
  const embedUrl = item.file_url ? getVideoEmbedUrl(item.file_url) : null;
  const thumbnail = item.file_url ? getVideoThumbnail(item.file_url) : null;

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        {/* Back link */}
        <div className="px-12 pt-[80px] pb-16">
          <button
            onClick={() => router.push('/archive')}
            className="text-[13px] text-neutral-300 hover:text-black transition-colors"
          >
            Back
          </button>
        </div>

        {/* Content */}
        <div className="px-12 pb-[160px]">
          <div className="max-w-[900px]">

            {/* Image */}
            {item.content_type === 'image' && item.has_image && (
              <div className="mb-16">
                <img
                  src={api.getArchiveImageUrl(artist.id, item.id)}
                  alt={item.title || ''}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Video embed or thumbnail */}
            {item.content_type === 'link' && isVideo && embedUrl && (
              <div className="mb-16">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            {item.title && (
              <h1 className="text-[24px] font-medium text-black mb-6 leading-tight">
                {item.title}
              </h1>
            )}

            {/* Text body */}
            {item.raw_text && (
              <div className="mb-12">
                <p className="text-[15px] text-neutral-500 leading-[1.8] whitespace-pre-wrap max-w-[600px]">
                  {item.raw_text}
                </p>
              </div>
            )}

            {/* Link URL */}
            {item.content_type === 'link' && item.file_url && (
              <div className="mb-12">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-mono text-neutral-400 hover:text-black transition-colors"
                >
                  {item.file_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {/* Metadata line */}
            <div className="pt-12 border-t border-neutral-100">
              <div className="flex gap-12">
                <div>
                  <p className="text-[11px] text-neutral-300 tracking-[0.15em] mb-2">DATE</p>
                  <p className="text-[13px] text-black">{formatDate(item.created_at)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-300 tracking-[0.15em] mb-2">TIME</p>
                  <p className="text-[13px] text-black">{formatTime(item.created_at)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-300 tracking-[0.15em] mb-2">TYPE</p>
                  <p className="text-[13px] text-black">{item.content_type}</p>
                </div>
                {item.source && item.source !== 'manual' && (
                  <div>
                    <p className="text-[11px] text-neutral-300 tracking-[0.15em] mb-2">SOURCE</p>
                    <p className="text-[13px] text-black">{item.source}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
