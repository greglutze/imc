'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import type { MoodboardImage, MoodboardBrief } from '../lib/api';
import { extractPaletteFromImages, isLightColor, type ExtractedColor } from '../lib/colorExtract';
import { ButtonV2 } from './ui';

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
  const [showPreviousBrief, setShowPreviousBrief] = useState(false);
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

  // Handle flag toggle
  const handleFlagToggle = useCallback(async (sentence: string) => {
    if (!brief) return;
    const isFlagged = brief.flagged_elements.includes(sentence);
    try {
      const result = await api.flagMoodboardElement(projectId, sentence, !isFlagged);
      setBrief(result.brief);
    } catch (err) {
      console.error('Flag failed:', err);
    }
  }, [projectId, brief]);

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

  // Split prose into sentences for flagging
  const proseSentences = brief?.prose
    ? brief.prose.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [brief.prose]
    : [];

  if (loading) {
    return (
      <div className="animate-fade-in px-8 pt-10 pb-8">
        <div className="h-3 w-32 bg-neutral-100 rounded-md animate-pulse mb-4" />
        <div className="h-10 w-48 bg-neutral-100 rounded-md animate-pulse mb-4" />
        <div className="h-4 w-80 bg-neutral-50 rounded-md animate-pulse mb-8" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-neutral-100 rounded-md animate-pulse" />
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
      <div className="px-8 pt-10 pb-8 flex items-start justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-2">
            Visual World
          </p>
          <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">
            Audio/Visuals
          </p>
          <p className="text-body-lg text-neutral-500 mt-4 max-w-lg">
            {images.length > 0
              ? `${imageCount} images shaping the visual language of your project.`
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
        className={`px-8 pb-8 ${dragOver ? 'bg-neutral-50' : ''} transition-colors duration-150`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Empty state */}
        {images.length === 0 && !uploading && (
          <div
            className="border-2 border-dashed border-[#E8E8E8] rounded-md py-16 px-8 text-center cursor-pointer hover:border-neutral-400 transition-colors duration-150"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-[28px] font-bold text-neutral-200 tracking-tight">
              Start your visual world
            </p>
            <p className="text-body text-[#8A8A8A] mt-3">
              Drop images here or click to browse. JPG, PNG, WEBP — up to 30.
            </p>
          </div>
        )}

        {/* Image grid — loose masonry-style, no square crop */}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-x-8 gap-y-16 items-start">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group break-inside-avoid"
                  onMouseLeave={() => {
                    if (deleteConfirm === img.id) setDeleteConfirm(null);
                  }}
                >
                  <img
                    src={img.image_data}
                    alt=""
                    className="w-full rounded-md"
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
                      absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center
                      text-white text-label font-bold transition-all duration-150
                      ${deleteConfirm === img.id
                        ? 'bg-red-500 opacity-100'
                        : 'bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                      }
                    `}
                  >
                    {deleteConfirm === img.id ? '?' : '×'}
                  </button>
                  {deleteConfirm === img.id && (
                    <div className="absolute top-2 right-11 bg-red-500 text-white text-micro font-semibold uppercase tracking-wide px-2 py-1 rounded-md">
                      Click to remove
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upload status */}
            {uploading && (
              <div className="mt-4">
                <p className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Uploading...
                </p>
              </div>
            )}
            {images.length > 0 && images.length < 5 && !brief && (
              <p className="text-body-sm text-neutral-400 mt-4">
                Add more images for a richer sonic brief
              </p>
            )}
          </>
        )}
      </div>

      {/* Color Palette Strip */}
      {palette.length > 0 && (
        <div className="px-8 py-6 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
              Extracted Palette
            </p>
            <p className="text-micro text-neutral-300">
              Click to copy hex
            </p>
          </div>
          <div className="flex gap-0 rounded-md overflow-hidden h-16">
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
                    text-micro font-semibold uppercase tracking-wide
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
                <span className="text-micro font-mono text-neutral-400">
                  {color.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {extractingColors && images.length > 0 && palette.length === 0 && (
        <div className="px-8 py-6 border-t border-neutral-100">
          <div className="h-3 w-32 bg-neutral-100 rounded-md animate-pulse mb-4" />
          <div className="flex gap-0 rounded-md overflow-hidden h-16">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 bg-neutral-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Sonic Brief */}
      {(brief || analyzing) && (
        <div className="border-t border-[#E8E8E8] px-8 py-8 bg-neutral-50">
          {analyzing && (
            <div className="max-w-2xl">
              <p className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3">
                Reading your images...
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          {brief && !analyzing && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-5">
                <p className="text-label font-semibold uppercase tracking-wide text-black">
                  Sonic Brief
                </p>
                <div className="flex items-center gap-3">
                  {brief.confidence && (
                    <span className={`text-micro font-semibold uppercase tracking-wide ${
                      brief.confidence === 'high' ? 'text-green-600' :
                      brief.confidence === 'medium' ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {brief.confidence} confidence
                    </span>
                  )}
                  {brief.version > 1 && (
                    <span className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      v{brief.version}
                    </span>
                  )}
                  <ButtonV2 onClick={handleAnalyze} variant="ghost" size="sm">
                    Regenerate
                  </ButtonV2>
                </div>
              </div>

              {/* Prose brief — each sentence hoverable for flagging */}
              <div className="text-body-lg text-black leading-relaxed">
                {proseSentences.map((sentence, i) => {
                  const isFlagged = brief.flagged_elements.includes(sentence);
                  return (
                    <span
                      key={i}
                      className={`
                        inline cursor-pointer transition-colors duration-150
                        ${isFlagged ? 'text-neutral-300 line-through' : 'hover:bg-neutral-100'}
                      `}
                      onClick={() => handleFlagToggle(sentence)}
                      title={isFlagged ? 'Click to unflag' : 'Click to flag as not right'}
                    >
                      {sentence}{' '}
                    </span>
                  );
                })}
              </div>

              {/* Brief metadata */}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {brief.tempo_feel && (
                  <BriefTag label="Tempo" value={brief.tempo_feel} />
                )}
                {brief.texture && (
                  <BriefTag label="Texture" value={brief.texture} />
                )}
                {brief.arrangement_density && (
                  <BriefTag label="Density" value={brief.arrangement_density} />
                )}
                {brief.dynamic_range && (
                  <BriefTag label="Dynamic Range" value={brief.dynamic_range} />
                )}
                {brief.production_era && (
                  <BriefTag label="Era" value={brief.production_era} />
                )}
              </div>

              {/* Sonic references */}
              {brief.sonic_references.length > 0 && (
                <div className="mt-4">
                  <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] mb-2">
                    Sonic References
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {brief.sonic_references.map((ref, i) => (
                      <span
                        key={i}
                        className="text-label font-bold text-black bg-neutral-100 px-3 py-1 rounded-md"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous brief toggle */}
              {brief.previous_prose && (
                <div className="mt-5">
                  <ButtonV2 onClick={() => setShowPreviousBrief(!showPreviousBrief)} variant="ghost" size="md">
                    {showPreviousBrief ? 'Hide' : 'See'} previous brief
                  </ButtonV2>
                  {showPreviousBrief && (
                    <p className="text-body text-[#8A8A8A] mt-3 italic">
                      {brief.previous_prose}
                    </p>
                  )}
                </div>
              )}

              {/* Regenerate button is now in the section header above */}
            </div>
          )}
        </div>
      )}

      {/* Generate brief button — shown when images exist but no brief */}
      {images.length >= 1 && !brief && !analyzing && (
        <div className="border-t border-[#E8E8E8] px-8 py-6">
          <ButtonV2 onClick={handleAnalyze}>
            Generate Sonic Brief
          </ButtonV2>
          {analyzeError && (
            <p className="text-body-sm text-red-500 mt-2">
              {analyzeError}
            </p>
          )}
          {!analyzeError && images.length < 5 && (
            <p className="text-body-sm text-neutral-400 mt-2">
              More images will produce a richer brief
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BriefTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
        {label}
      </span>
      <span className="text-body-sm text-black">
        {value}
      </span>
    </div>
  );
}
