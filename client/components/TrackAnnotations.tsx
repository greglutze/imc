'use client';

/**
 * TrackAnnotations — timestamped notes on a track.
 * Appears below the player when a track is active in the share editor.
 * "Fix the snare at 1:42" — turns the share page into a working document.
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import type { TrackAnnotation } from '../lib/api';

interface TrackAnnotationsProps {
  projectId: string;
  shareId: string;
  trackId: string;
  trackTitle: string;
  currentTimeMs: number; // current playback position in ms
  onSeek?: (ms: number) => void; // callback to jump to a timestamp
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackAnnotations({
  projectId,
  shareId,
  trackId,
  trackTitle,
  currentTimeMs,
  onSeek,
}: TrackAnnotationsProps) {
  const [annotations, setAnnotations] = useState<TrackAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load annotations when track changes
  useEffect(() => {
    setLoading(true);
    api.getTrackAnnotations(projectId, shareId, trackId)
      .then((res) => setAnnotations(res.annotations))
      .catch((err) => console.error('Failed to load annotations:', err))
      .finally(() => setLoading(false));
  }, [projectId, shareId, trackId]);

  const handleAdd = useCallback(async () => {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const annotation = await api.addTrackAnnotation(projectId, shareId, trackId, {
        timestamp_ms: currentTimeMs,
        content: newContent.trim(),
      });
      setAnnotations((prev) => [...prev, annotation].sort((a, b) => a.timestamp_ms - b.timestamp_ms));
      setNewContent('');
    } catch (err) {
      console.error('Failed to add annotation:', err);
    } finally {
      setAdding(false);
    }
  }, [projectId, shareId, trackId, currentTimeMs, newContent]);

  const handleToggleResolved = useCallback(async (annotation: TrackAnnotation) => {
    try {
      const updated = await api.updateTrackAnnotation(
        projectId, shareId, trackId, annotation.id,
        { resolved: !annotation.resolved }
      );
      setAnnotations((prev) => prev.map((a) => a.id === annotation.id ? updated : a));
    } catch (err) {
      console.error('Failed to update annotation:', err);
    }
  }, [projectId, shareId, trackId]);

  const handleEdit = useCallback(async (annotationId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await api.updateTrackAnnotation(
        projectId, shareId, trackId, annotationId,
        { content: editContent.trim() }
      );
      setAnnotations((prev) => prev.map((a) => a.id === annotationId ? updated : a));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to edit annotation:', err);
    }
  }, [projectId, shareId, trackId, editContent]);

  const handleDelete = useCallback(async (annotationId: string) => {
    try {
      await api.deleteTrackAnnotation(projectId, shareId, trackId, annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  }, [projectId, shareId, trackId]);

  const unresolvedCount = annotations.filter((a) => !a.resolved).length;

  return (
    <div className="border border-neutral-200 rounded-sm mt-4">
      {/* Header */}
      <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-label font-bold uppercase tracking-widest text-black">
            Notes
          </span>
          <span className="text-micro text-neutral-400">
            {trackTitle}
          </span>
        </div>
        {unresolvedCount > 0 && (
          <span className="text-micro font-bold uppercase tracking-widest text-yellow-600">
            {unresolvedCount} open
          </span>
        )}
      </div>

      {/* Add annotation input */}
      <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-3">
        <span className="text-micro font-mono text-neutral-400 shrink-0 w-10 text-center">
          {formatTimestamp(currentTimeMs)}
        </span>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add a note at this timestamp..."
          className="flex-1 text-small bg-transparent outline-none text-black placeholder:text-neutral-300"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newContent.trim()}
          className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast disabled:opacity-30 shrink-0"
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>

      {/* Annotation list */}
      {loading ? (
        <div className="px-5 py-4">
          <div className="h-3 w-48 bg-neutral-100 rounded-sm animate-pulse" />
        </div>
      ) : annotations.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-body-sm text-neutral-300">
            No notes yet — pause playback and add one.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`px-5 py-3 flex items-start gap-3 group ${annotation.resolved ? 'opacity-50' : ''}`}
            >
              {/* Resolved toggle */}
              <button
                onClick={() => handleToggleResolved(annotation)}
                className={`w-4 h-4 rounded-sm border shrink-0 mt-0.5 flex items-center justify-center transition-colors duration-fast ${
                  annotation.resolved
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-neutral-300 hover:border-black'
                }`}
              >
                {annotation.resolved && (
                  <span className="text-[9px] leading-none">✓</span>
                )}
              </button>

              {/* Timestamp — clickable to seek */}
              <button
                onClick={() => onSeek?.(annotation.timestamp_ms)}
                className="text-micro font-mono text-neutral-400 hover:text-black transition-colors duration-fast shrink-0 w-10 text-center mt-0.5"
                title="Jump to this timestamp"
              >
                {formatTimestamp(annotation.timestamp_ms)}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === annotation.id ? (
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit(annotation.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="text-small text-black bg-transparent border-b border-black outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingId(annotation.id);
                      setEditContent(annotation.content);
                    }}
                    className={`text-small cursor-pointer ${annotation.resolved ? 'text-neutral-400 line-through' : 'text-black'}`}
                  >
                    {annotation.content}
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(annotation.id)}
                className="text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-fast text-small shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
