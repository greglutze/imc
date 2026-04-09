'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import * as api from '../../lib/api';

type ContentFilter = 'all' | 'text' | 'image' | 'link';

// Group items by month
function groupByMonth(items: api.ArchiveItem[]): { label: string; items: api.ArchiveItem[] }[] {
  const groups: Record<string, api.ArchiveItem[]> = {};
  const monthOrder: string[] = [];

  for (const item of items) {
    const d = new Date(item.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!groups[key]) {
      groups[key] = [];
      monthOrder.push(key);
    }
    groups[key].push(item);
  }

  return monthOrder.map((key) => {
    const d = new Date(groups[key][0].created_at);
    return {
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      items: groups[key],
    };
  });
}

// Extract video thumbnail URL from common platforms
function getVideoThumbnail(url: string): string | null {
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;

  return null;
}

// Deterministic varied height based on item id
function getImageHeight(id: string): number {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const sizes = [220, 280, 340, 180, 300, 260];
  return sizes[hash % sizes.length];
}

export default function ArchivePage() {
  const [artist, setArtist] = useState<api.Artist | null>(null);
  const [items, setItems] = useState<api.ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>('all');

  // Intake state
  const [showIntake, setShowIntake] = useState(false);
  const [intakeType, setIntakeType] = useState<'text' | 'link' | 'image'>('text');
  const [intakeTitle, setIntakeTitle] = useState('');
  const [intakeText, setIntakeText] = useState('');
  const [intakeUrl, setIntakeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageContentType, setImageContentType] = useState<string>('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Load artist
  useEffect(() => {
    const loadArtist = async () => {
      const stored = localStorage.getItem('v2_artist');
      if (stored) {
        try { setArtist(JSON.parse(stored)); return; } catch { /* */ }
      }
      try {
        const artists = await api.getArtists();
        if (artists.length > 0) {
          setArtist(artists[0]);
          localStorage.setItem('v2_artist', JSON.stringify(artists[0]));
        }
      } catch (err) { console.error('Failed to load artists:', err); }
    };
    loadArtist();
  }, []);

  // Load items
  const loadItems = useCallback(async () => {
    if (!artist) return;
    setLoading(true);
    try {
      const params: { content_type?: string; limit: number } = { limit: 200 };
      if (filter !== 'all') params.content_type = filter;
      const data = await api.getArchiveItems(artist.id, params);
      setItems(data);
    } catch (err) { console.error('Failed to load archive:', err); }
    finally { setLoading(false); }
  }, [artist, filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // File handler
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageContentType(file.type);
    setIntakeType('image');
    setShowIntake(true);
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) handleFile(imageFile);
  };

  // Save
  const handleSave = async () => {
    if (!artist) return;
    setSaving(true);
    try {
      if (intakeType === 'image' && imageData) {
        await api.uploadArchiveImage(artist.id, imageData, imageContentType, intakeTitle || undefined);
      } else if (intakeType === 'text') {
        await api.addArchiveItem(artist.id, { content_type: 'text', title: intakeTitle || undefined, raw_text: intakeText });
      } else {
        await api.addArchiveItem(artist.id, { content_type: 'link', title: intakeTitle || undefined, file_url: intakeUrl, raw_text: intakeText || undefined });
      }
      resetIntake();
      await loadItems();
    } catch (err) { console.error('Failed to save:', err); }
    finally { setSaving(false); }
  };

  const resetIntake = () => {
    setShowIntake(false); setIntakeTitle(''); setIntakeText('');
    setIntakeUrl(''); setImagePreview(null); setImageData(null); setIntakeType('text');
  };

  const canSave = () => {
    if (intakeType === 'text') return intakeText.trim().length > 0;
    if (intakeType === 'link') return intakeUrl.trim().length > 0;
    if (intakeType === 'image') return imageData !== null;
    return false;
  };

  const grouped = groupByMonth(items);
  const router = useRouter();

  return (
    <AppShell>
      <div
        className="min-h-screen bg-white"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-white/95 z-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-body text-neutral-400">Drop image to archive</p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* Header — minimal */}
        <div className="px-12 pt-[80px] pb-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[13px] font-normal text-black tracking-wide">
                {artist?.name || 'Archive'}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {(['all', 'text', 'image', 'link'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`text-[13px] transition-colors ${
                    filter === type
                      ? 'text-black'
                      : 'text-neutral-300 hover:text-black'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setShowIntake(true)}
                className="text-[13px] text-neutral-300 hover:text-black transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Intake panel */}
        {showIntake && (
          <div className="px-12 pb-16">
            <div className="max-w-[560px]">
              <div className="border border-neutral-100 p-8 bg-white">
                <div className="flex gap-4 mb-6">
                  {(['text', 'link', 'image'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setIntakeType(type); if (type !== 'image') { setImagePreview(null); setImageData(null); } }}
                      className={`text-[13px] transition-colors ${
                        intakeType === type ? 'text-black' : 'text-neutral-300 hover:text-black'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={intakeTitle}
                  onChange={(e) => setIntakeTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-0 py-2 text-[15px] font-medium border-0 border-b border-neutral-100 focus:outline-none focus:border-black transition-colors placeholder:text-neutral-200 mb-6"
                />

                {intakeType === 'image' && (
                  <div className="mb-6">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-[300px] object-contain" />
                        <button
                          onClick={() => { setImagePreview(null); setImageData(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white flex items-center justify-center text-[11px] hover:bg-black"
                        >×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-16 border border-dashed border-neutral-200 hover:border-neutral-400 transition-colors text-center cursor-pointer"
                      >
                        <p className="text-[13px] text-neutral-300">Drop an image or click to browse</p>
                      </button>
                    )}
                  </div>
                )}

                {intakeType === 'link' && (
                  <input type="url" value={intakeUrl} onChange={(e) => setIntakeUrl(e.target.value)} placeholder="https://..."
                    className="w-full px-0 py-2 text-[13px] border-0 border-b border-neutral-100 focus:outline-none focus:border-black transition-colors mb-6 font-mono placeholder:text-neutral-200" />
                )}

                {intakeType !== 'image' && (
                  <textarea value={intakeText} onChange={(e) => setIntakeText(e.target.value)}
                    placeholder={intakeType === 'text' ? 'Write anything...' : 'Notes (optional)'}
                    className="w-full px-0 py-2 text-[14px] border-0 focus:outline-none resize-none placeholder:text-neutral-200 leading-relaxed" rows={5} autoFocus />
                )}

                <div className="flex justify-end gap-6 mt-6 pt-6 border-t border-neutral-50">
                  <button onClick={resetIntake} className="text-[13px] text-neutral-300 hover:text-black transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !canSave()}
                    className="text-[13px] text-black hover:text-neutral-600 transition-colors disabled:text-neutral-200">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive grid — CSS columns for organic scatter */}
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-4 h-4 border border-neutral-200 border-t-black animate-spin" />
          </div>
        ) : items.length === 0 && !showIntake ? (
          <div className="text-center py-40">
            <p className="text-[13px] text-neutral-300 mb-8">Nothing here yet.</p>
            <button onClick={() => setShowIntake(true)}
              className="text-[13px] text-black hover:text-neutral-500 transition-colors">
              Add your first piece
            </button>
          </div>
        ) : (
          <div className="px-12 pb-[160px]">
            {grouped.map((group) => (
              <div key={group.label} className="mb-32">
                {/* Month label */}
                <h2 className="text-[11px] font-normal tracking-[0.2em] text-neutral-400 mb-16">{group.label.toUpperCase()}</h2>

                {/* Masonry columns */}
                <div style={{ columns: 3, columnGap: '90px' }}>
                  {group.items.map((item) => (
                    <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '90px' }}>
                      <ArchiveCard item={item} artistId={artist?.id || ''} onClick={() => router.push(`/archive/${item.id}`)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Archive Card ──

function ArchiveCard({ item, artistId, onClick }: { item: api.ArchiveItem; artistId: string; onClick?: () => void }) {
  // Images: varied sizes, no chrome
  if (item.content_type === 'image' && item.has_image) {
    const h = getImageHeight(item.id);
    return (
      <div className="cursor-pointer group" onClick={onClick}>
        <img
          src={api.getArchiveImageUrl(artistId, item.id)}
          alt={item.title || ''}
          className="w-full object-contain transition-opacity duration-300 group-hover:opacity-80"
          style={{ maxHeight: `${Math.round(h * 0.6)}px` }}
        />
        {item.title && (
          <p className="text-[11px] text-neutral-300 mt-3 tracking-wide">{item.title}</p>
        )}
      </div>
    );
  }

  // Text: clamp with "More" link
  if (item.content_type === 'text') {
    const TEXT_LIMIT = 180;
    const isLong = (item.raw_text?.length || 0) > TEXT_LIMIT;

    return (
      <div className="cursor-pointer group max-w-[320px]" onClick={onClick}>
        {item.title && (
          <p className="text-[14px] font-medium text-black mb-2">{item.title}</p>
        )}
        {item.raw_text && (
          <p className="text-[13px] text-neutral-400 leading-[1.7] whitespace-pre-wrap">
            {isLong ? item.raw_text.slice(0, TEXT_LIMIT).trimEnd() + '...' : item.raw_text}
            {isLong && (
              <span className="text-black ml-1 hover:text-neutral-500 transition-colors">More</span>
            )}
          </p>
        )}
      </div>
    );
  }

  // Links: show video thumbnail if it's a video URL
  if (item.content_type === 'link') {
    const thumbnail = item.file_url ? getVideoThumbnail(item.file_url) : null;

    return (
      <div className="cursor-pointer group" onClick={onClick}>
        {thumbnail && (
          <div className="relative mb-3">
            <img
              src={thumbnail}
              alt={item.title || ''}
              className="w-full object-contain transition-opacity duration-300 group-hover:opacity-80"
            />
            {/* Play indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 bg-black/50 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
              </div>
            </div>
          </div>
        )}
        <div className="max-w-[320px]">
          {item.title && (
            <p className="text-[14px] font-medium text-black mb-2">{item.title}</p>
          )}
          {item.file_url && (
            <p className="text-[11px] text-neutral-300 font-mono tracking-wide">
              {item.file_url.replace(/^https?:\/\//, '')}
            </p>
          )}
          {item.raw_text && (
            <p className="text-[13px] text-neutral-400 leading-[1.7] mt-2">{item.raw_text}</p>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="cursor-pointer" onClick={onClick}>
      <p className="text-[11px] text-neutral-300">{item.content_type}</p>
      {item.title && <p className="text-[13px] text-black">{item.title}</p>}
    </div>
  );
}
