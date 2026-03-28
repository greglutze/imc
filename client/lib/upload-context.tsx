'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { api } from './api';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  projectId: string;
  shareId: string;
  status: UploadStatus;
  error?: string;
}

interface UploadContextType {
  uploads: UploadItem[];
  addUploads: (projectId: string, shareId: string, files: File[]) => void;
  clearCompleted: () => void;
  isUploading: boolean;
  /** Callback for when a batch finishes — manage page can reload data */
  onBatchComplete: React.MutableRefObject<((projectId: string, shareId: string) => void) | null>;
}

const UploadContext = createContext<UploadContextType | null>(null);

let uploadIdCounter = 0;

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const processingRef = useRef(false);
  const queueRef = useRef<UploadItem[]>([]);
  const onBatchComplete = useRef<((projectId: string, shareId: string) => void) | null>(null);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      if (!item) break;

      // Mark as uploading
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'uploading' as UploadStatus } : u));

      try {
        await api.uploadShareTrack(item.projectId, item.shareId, item.file);
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'done' as UploadStatus } : u));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'error' as UploadStatus, error: msg } : u));
      }

      queueRef.current = queueRef.current.slice(1);
    }

    processingRef.current = false;

    // Notify the manage page that uploads finished
    setUploads(prev => {
      const lastDone = prev.filter(u => u.status === 'done');
      if (lastDone.length > 0 && onBatchComplete.current) {
        const last = lastDone[lastDone.length - 1];
        onBatchComplete.current(last.projectId, last.shareId);
      }
      return prev;
    });
  }, []);

  const addUploads = useCallback((projectId: string, shareId: string, files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({
      id: `upload-${++uploadIdCounter}`,
      file,
      projectId,
      shareId,
      status: 'pending' as UploadStatus,
    }));

    setUploads(prev => [...prev, ...newItems]);
    queueRef.current = [...queueRef.current, ...newItems];
    processQueue();
  }, [processQueue]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'done' && u.status !== 'error'));
  }, []);

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return (
    <UploadContext.Provider value={{ uploads, addUploads, clearCompleted, isUploading, onBatchComplete }}>
      {children}
      {/* Global upload progress toast */}
      {uploads.length > 0 && <UploadToast />}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
}

/* ── Floating toast that shows upload progress ── */

function UploadToast() {
  const { uploads, clearCompleted, isUploading } = useUpload();

  const total = uploads.length;
  const done = uploads.filter(u => u.status === 'done').length;
  const errors = uploads.filter(u => u.status === 'error').length;
  const current = uploads.find(u => u.status === 'uploading');
  const progress = total > 0 ? ((done + errors) / total) * 100 : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-neutral-200 rounded-sm shadow-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-100">
        <div
          className={`h-full transition-all duration-300 ${errors > 0 ? 'bg-red-500' : 'bg-black'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-small font-bold text-black">
            {isUploading ? 'Uploading...' : errors > 0 ? 'Upload complete (with errors)' : 'Upload complete'}
          </span>
          {!isUploading && (
            <button
              onClick={clearCompleted}
              className="text-micro text-neutral-400 hover:text-black transition-colors duration-fast"
            >
              Dismiss
            </button>
          )}
        </div>

        {/* Status */}
        <span className="text-micro text-neutral-500">
          {done + errors} of {total} file{total !== 1 ? 's' : ''}
          {errors > 0 && <span className="text-red-500 ml-1">({errors} failed)</span>}
        </span>

        {/* Current file */}
        {current && (
          <div className="mt-2 text-micro text-neutral-400 truncate">
            {current.file.name}
          </div>
        )}
      </div>
    </div>
  );
}
