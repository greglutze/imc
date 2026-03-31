'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import type { MoodboardImage, MoodboardBrief } from '../lib/api';

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPreviousBrief, setShowPreviousBrief] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
    try {
      const result = await api.analyzeMoodboard(projectId);
      setBrief(result.brief);
    } catch (err) {
      console.error('Analysis failed:', err);
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
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[40px] leading-[1.1] font-bold text-neutral-200 tracking-tight">
          Loading moodboard...
        </p>
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

      {/* Section header */}
      <div className="px-8 pt-6 pb-2 flex items-center justify-between">
        <p className="text-label font-bold uppercase tracking-widest text-neutral-400">
          Audio Visuals
        </p>
        {images.length > 0 && (
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-300">
            {imageCount} / 30
          </p>
        )}
      </div>

      {/* Upload area / Grid */}
      <div
        className={`px-8 py-4 ${dragOver ? 'bg-neutral-50' : ''} transition-colors duration-fast`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Empty state */}
        {images.length === 0 && !uploading && (
          <div
            className="border-2 border-dashed border-neutral-200 rounded-sm py-12 px-8 text-center cursor-pointer hover:border-neutral-400 transition-colors duration-fast"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-body-lg font-bold text-neutral-300">
              Upload images that represent your project
            </p>
            <p className="text-body-sm text-neutral-400 mt-2">
              Drag and drop or click to browse. JPG, PNG, WEBP — up to 30 images.
            </p>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-0">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square group"
                  onMouseLeave={() => {
                    if (deleteConfirm === img.id) setDeleteConfirm(null);
                  }}
                >
                  <img
                    src={img.image_data}
                    alt=""
                    className="w-full h-full object-cover"
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
                      absolute top-2 right-2 w-7 h-7 rounded-sm flex items-center justify-center
                      text-white text-label font-bold transition-all duration-fast
                      ${deleteConfirm === img.id
                        ? 'bg-red-500 opacity-100'
                        : 'bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                      }
                    `}
                  >
                    {deleteConfirm === img.id ? '?' : '×'}
                  </button>
                  {deleteConfirm === img.id && (
                    <div className="absolute top-2 right-11 bg-red-500 text-white text-micro font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                      Click to remove
                    </div>
                  )}
                </div>
              ))}

              {/* Add more tile */}
              {images.length < 30 && (
                <div
                  className="aspect-square border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-neutral-400 transition-colors duration-fast"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-[32px] text-neutral-300 leading-none">+</span>
                </div>
              )}
            </div>

            {/* Upload status */}
            {uploading && (
              <div className="mt-3">
                <p className="text-label font-bold uppercase tracking-widest text-neutral-400">
                  Uploading...
                </p>
              </div>
            )}
          </>
        )}

        {/* Partial state warning */}
        {images.length > 0 && images.length < 5 && !brief && (
          <p className="text-body text-neutral-400 mt-4">
            Add more images for a richer sonic brief
          </p>
        )}
      </div>

      {/* Sonic Brief */}
      {(brief || analyzing) && (
        <div className="border-t border-neutral-200 px-8 py-8">
          {analyzing && (
            <div className="max-w-2xl">
              <p className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3">
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
                <p className="text-label font-bold uppercase tracking-widest text-black">
                  Sonic Brief
                </p>
                <div className="flex items-center gap-3">
                  {brief.confidence && (
                    <span className={`text-micro font-bold uppercase tracking-widest ${
                      brief.confidence === 'high' ? 'text-green-600' :
                      brief.confidence === 'medium' ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {brief.confidence} confidence
                    </span>
                  )}
                  {brief.version > 1 && (
                    <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                      v{brief.version}
                    </span>
                  )}
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
                        inline cursor-pointer transition-colors duration-fast
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
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Sonic References
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {brief.sonic_references.map((ref, i) => (
                      <span
                        key={i}
                        className="text-label font-bold text-black bg-neutral-100 px-3 py-1 rounded-sm"
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
                  <button
                    onClick={() => setShowPreviousBrief(!showPreviousBrief)}
                    className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                  >
                    {showPreviousBrief ? 'Hide' : 'See'} previous brief
                  </button>
                  {showPreviousBrief && (
                    <p className="text-body text-neutral-400 mt-3 italic">
                      {brief.previous_prose}
                    </p>
                  )}
                </div>
              )}

              {/* Refresh button */}
              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                >
                  Refresh brief
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate brief button — shown when images exist but no brief */}
      {images.length >= 1 && !brief && !analyzing && (
        <div className="border-t border-neutral-200 px-8 py-6">
          <button
            onClick={handleAnalyze}
            className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-6 rounded-sm hover:bg-neutral-800 transition-colors duration-fast"
          >
            Generate Sonic Brief
          </button>
          {images.length < 5 && (
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
      <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span className="text-body-sm text-black">
        {value}
      </span>
    </div>
  );
}
