'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import type { MoodboardImage, MoodboardBrief } from '../lib/api';
import { extractPaletteFromImages, isLightColor, type ExtractedColor } from '../lib/colorExtract';
import { ButtonV2, Badge } from './ui';

interface VisualMoodboardProps {
  projectId: string;
}

export default function VisualMoodboard({ projectId }: VisualMoodboardProps) {
  const [images, setImages] = useState<(MoodboardImage & { image_data?: string })[]>([]);
  const [brief, setBrief] = useState<MoodboardBrief | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [palette, setPalette] = useState<ExtractedColor[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load moodboard data
  useEffect(() => {
    const loadMoodboard = async () => {
      try {
        const [moodboard, thumbnails] = await Promise.all([
          api.getMoodboard(projectId),
          api.getMoodboardThumbnails(projectId),
        ]);
        setImages(thumbnails);
        setBrief(moodboard.brief);
        setImageCount(moodboard.count);
      } catch (err) {
        console.error('Failed to load moodboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMoodboard();
  }, [projectId]);

  // Extract palette when images change
  useEffect(() => {
    if (images.length === 0) {
      setPalette([]);
      return;
    }
    const dataUrls = images
      .map((img) => img.image_data)
      .filter((d): d is string => !!d);
    if (dataUrls.length === 0) return;

    setExtractingColors(true);
    extractPaletteFromImages(dataUrls, 7).then((colors) => {
      setPalette(colors);
      setExtractingColors(false);
    });
  }, [images]);

  // Copy hex to clipboard
  const handleCopyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    });
  }, []);

  // File to base64 data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Filter to supported image types
    const supported = fileArray.filter(f =>
      /^image\/(jpeg|png|webp|heic)$/.test(f.type) || /\.(jpg|jpeg|png|webp|heic)$/i.test(f.name)
    );

    if (supported.length === 0) return;

    // Check limit
    if (imageCount + supported.length > 30) {
      alert(`You've reached 30 images. Remove some to add more. (Current: ${imageCount})`);
      return;
    }

    // Check file sizes
    const oversized = supported.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`${oversized.length} image(s) exceed the 10MB limit and were skipped.`);
    }

    const valid = supported.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) return;

    setUploading(true);

    try {
      const dataUrls = await Promise.all(valid.map(fileToDataUrl));
      const result = await api.uploadMoodboardImages(projectId, dataUrls);

      // Refresh thumbnails
      const thumbnails = await api.getMoodboardThumbnails(projectId);
      setImages(thumbnails);
      setImageCount(result.count);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [projectId, imageCount]);

  // Handle delete
  const handleDelete = useCallback(async (imageId: string) => {
    try {
      const result = await api.deleteMoodboardImage(projectId, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setImageCount(result.count);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [projectId]);

  // Handle analyze
  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await api.analyzeMoodboard(projectId);
      setBrief(result.brief);
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed — please try again');
    } finally {
      setAnalyzing(false);
    }
  }, [projectId]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // File input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = '';
    }
  }, [handleUpload]);

  if (loading) {
    return (
      <div className="animate-fade-in pt-10 pb-8">
        <div className="h-3 w-32 bg-[#F7F7F5] animate-pulse mb-4" />
        <div className="h-10 w-48 bg-[#F7F7F5] animate-pulse mb-4" />
        <div className="h-4 w-80 bg-[#F7F7F5] animate-pulse mb-8" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-[#F7F7F5] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Editorial header */}
      <div className="pt-10 pb-8 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-2">
            Moodboard
          </p>
          <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">
            Visual World
          </p>
          <p className="text-[20px] leading-[1.4] font-medium text-[#1A1A1A] tracking-tight mt-4 max-w-xl">
            {images.length > 0
              ? 'A moodboard shaping the sound and vision of your project.'
              : 'Drop in anything that feels like your sound — photos, textures, artwork, color palettes, film stills.'
            }
          </p>
        </div>
        {images.length > 0 && images.length < 30 && (
          <ButtonV2 onClick={() => fileInputRef.current?.click()} className="shrink-0 mt-6">
            + Add Images
          </ButtonV2>
        )}
      </div>

      {/* Upload area / Grid */}
      <div
        className={`pb-8 ${dragOver ? 'bg-[#F7F7F5]' : ''} transition-colors duration-150`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Empty state */}
        {images.length === 0 && !uploading && (
          <div
            className="border-2 border-dashed border-[#E8E8E8] py-16 px-10 text-center cursor-pointer hover:border-[#C4C4C4] transition-colors duration-150"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-[28px] font-bold text-[#E8E8E8] tracking-tight">
              Start your visual world
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-3">
              Drop images here or click to browse. JPG, PNG, WEBP — up to 30.
            </p>
          </div>
        )}

        {/* Image grid — loose masonry-style, no square crop */}
        {images.length > 0 && (
          <>
            <div className="columns-3 gap-x-24 space-y-24">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group break-inside-avoid mb-24"
                  onMouseLeave={() => {
                    if (deleteConfirm === img.id) setDeleteConfirm(null);
                  }}
                >
                  <img
                    src={img.image_data}
                    alt=""
                    className="w-full"
                  />
                  {/* Delete button — hover */}
                  <button
                    onClick={() => {
                      if (deleteConfirm === img.id) {
                        handleDelete(img.id);
                      } else {
                        setDeleteConfirm(img.id);
                      }
                    }}
                    className={`
                      absolute top-2 right-2 w-7 h-7 flex items-center justify-center
                      text-white text-[12px] font-bold transition-all duration-150
                      ${deleteConfirm === img.id
                        ? 'bg-red-500 opacity-100'
                        : 'bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                      }
                    `}
                  >
                    {deleteConfirm === img.id ? '?' : '×'}
                  </button>
                  {deleteConfirm === img.id && (
                    <div className="absolute top-2 right-11 bg-red-500 text-white text-[11px] font-semibold uppercase tracking-wide px-2 py-1">
                      Click to remove
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upload status */}
            {uploading && (
              <div className="mt-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Uploading...
                </p>
              </div>
            )}
            {images.length > 0 && images.length < 5 && !brief && (
              <p className="text-[13px] text-[#C4C4C4] mt-4">
                Add more images for a richer sonic brief
              </p>
            )}
          </>
        )}
      </div>

      {/* Color Palette Strip */}
      {palette.length > 0 && (
        <div className="py-6 border-t border-[#E8E8E8]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
              Extracted Palette
            </p>
            <p className="text-[11px] text-[#C4C4C4]">
              Click to copy hex
            </p>
          </div>
          <div className="flex gap-0 overflow-hidden h-16">
            {palette.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleCopyHex(color.hex)}
                className="relative group transition-all duration-200 hover:flex-[2]"
                style={{
                  backgroundColor: color.hex,
                  flex: color.percentage / 10,
                  minWidth: '3rem',
                }}
                title={`${color.hex} · ${color.percentage}%`}
              >
                <span
                  className={`
                    absolute inset-0 flex items-center justify-center
                    text-[11px] font-semibold uppercase tracking-wide
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    ${isLightColor(color.rgb) ? 'text-black/70' : 'text-white/80'}
                  `}
                >
                  {copiedHex === color.hex ? 'Copied' : color.hex}
                </span>
              </button>
            ))}
          </div>
          {/* Swatch detail row */}
          <div className="flex mt-3 gap-4">
            {palette.map((color) => (
              <div key={color.hex} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0 border border-[#E8E8E8]"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-[11px] font-mono text-[#C4C4C4]">
                  {color.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {extractingColors && images.length > 0 && palette.length === 0 && (
        <div className="py-6 border-t border-[#E8E8E8]">
          <div className="h-3 w-32 bg-[#F7F7F5] animate-pulse mb-4" />
          <div className="flex gap-0 overflow-hidden h-16">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 bg-[#F7F7F5] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Sonic Integration — collapsed pills */}
      {(brief || analyzing) && (
        <div className="py-8 border-t border-[#E8E8E8]">
          {analyzing && (
            <div>
              <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-3">
                Reading your images...
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          {brief && !analyzing && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Integrated into Sounds
                  </p>
                  <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-signal-green text-black">
                    Active
                  </span>
                </div>
                <Badge variant="action" onClick={handleAnalyze}>Regenerate</Badge>
              </div>

              {/* Attribute pills */}
              <div className="flex flex-wrap gap-2">
                {brief.atmosphere && (
                  <Badge variant="violet">{brief.atmosphere}</Badge>
                )}
                {brief.texture && (
                  <Badge variant="violet">{brief.texture}</Badge>
                )}
                {brief.emotional_register && (
                  <Badge variant="violet">{brief.emotional_register}</Badge>
                )}
                {brief.tempo_feel && (
                  <Badge variant="default">{brief.tempo_feel}</Badge>
                )}
                {brief.arrangement_density && (
                  <Badge variant="default">{brief.arrangement_density}</Badge>
                )}
                {brief.dynamic_range && (
                  <Badge variant="default">{brief.dynamic_range}</Badge>
                )}
                {brief.production_era && (
                  <Badge variant="default">{brief.production_era}</Badge>
                )}
              </div>

              {/* Sonic references as pills */}
              {brief.sonic_references.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {brief.sonic_references.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center h-5 px-2 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-white text-[#1A1A1A] border border-[#E8E8E8]"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[13px] text-[#C4C4C4] mt-4">
                This moodboard shapes your sound palette, production aesthetic, and vocal direction in Sounds.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Generate brief button — shown when images exist but no brief */}
      {images.length >= 1 && !brief && !analyzing && (
        <div className="border-t border-[#E8E8E8] py-6">
          <ButtonV2 onClick={handleAnalyze}>
            Generate Sonic Brief
          </ButtonV2>
          {analyzeError && (
            <p className="text-[13px] text-red-500 mt-2">
              {analyzeError}
            </p>
          )}
          {!analyzeError && images.length < 5 && (
            <p className="text-[13px] text-[#C4C4C4] mt-2">
              More images will produce a richer brief
            </p>
          )}
        </div>
      )}
    </div>
  );
}

