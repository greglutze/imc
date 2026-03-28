'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../../components/ProjectNav';
import { useAuth } from '../../../../../lib/auth-context';
import { api } from '../../../../../lib/api';
import type { ShareProjectWithTracks, ShareTrack, Project } from '../../../../../lib/api';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ShareManagePage() {
  const { id, shareId } = useParams<{ id: string; shareId: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [share, setShare] = useState<ShareProjectWithTracks | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackTitleValue, setTrackTitleValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    if (!id || !shareId) return;
    try {
      const [proj, shareData] = await Promise.all([
        api.getProject(id),
        api.getShareProject(id, shareId),
      ]);
      setProject(proj);
      setShare(shareData);
      setTitleValue(shareData.title);
    } catch (err) {
      console.error('Failed to load share project:', err);
    } finally {
      setPageLoading(false);
    }
  }, [id, shareId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, loadData]);

  // ── Actions ──

  const handleTitleSave = useCallback(async () => {
    if (!id || !shareId || !titleValue.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateShareProject(id, shareId, { title: titleValue.trim() });
      setShare((prev) => prev ? { ...prev, ...updated } : prev);
      setEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setSaving(false);
    }
  }, [id, shareId, titleValue]);

  const handleTogglePublic = useCallback(async () => {
    if (!share || !id || !shareId) return;
    setSaving(true);
    try {
      const updated = await api.updateShareProject(id, shareId, { is_public: !share.is_public });
      setShare((prev) => prev ? { ...prev, ...updated } : prev);
    } catch (err) {
      console.error('Failed to toggle public:', err);
    } finally {
      setSaving(false);
    }
  }, [share, id, shareId]);

  const handleToggleDownloads = useCallback(async () => {
    if (!share || !id || !shareId) return;
    setSaving(true);
    try {
      const updated = await api.updateShareProject(id, shareId, { downloads_enabled: !share.downloads_enabled });
      setShare((prev) => prev ? { ...prev, ...updated } : prev);
    } catch (err) {
      console.error('Failed to toggle downloads:', err);
    } finally {
      setSaving(false);
    }
  }, [share, id, shareId]);

  const handleSetPassword = useCallback(async () => {
    if (!id || !shareId) return;
    setSaving(true);
    try {
      await api.setSharePassword(id, shareId, passwordValue || null);
      setShare((prev) => prev ? {
        ...prev,
        password_hash: passwordValue ? 'set' : null,
      } : prev);
      setShowPasswordInput(false);
      setPasswordValue('');
    } catch (err) {
      console.error('Failed to set password:', err);
    } finally {
      setSaving(false);
    }
  }, [id, shareId, passwordValue]);

  const handleRegenerateLink = useCallback(async () => {
    if (!id || !shareId) return;
    setSaving(true);
    try {
      const updated = await api.regenerateShareLink(id, shareId);
      setShare((prev) => prev ? { ...prev, ...updated } : prev);
    } catch (err) {
      console.error('Failed to regenerate link:', err);
    } finally {
      setSaving(false);
    }
  }, [id, shareId]);

  const handleCopyLink = useCallback(() => {
    if (!share) return;
    const url = `${window.location.origin}/s/${share.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [share]);

  const handleUploadTracks = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !id || !shareId) return;
    setUploading(true);
    setUploadError(null);

    try {
      const files: Array<{ data: string; filename: string; content_type: string }> = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const commaIdx = result.indexOf(',');
            resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        files.push({
          data: base64,
          filename: file.name,
          content_type: file.type || 'audio/mpeg',
        });
      }

      await api.uploadShareTracks(id, shareId, files);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      console.error('Failed to upload tracks:', msg);
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  }, [id, shareId, loadData]);

  const handleUploadArtwork = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !shareId) return;
    setUploadingArtwork(true);

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await api.uploadShareArtwork(id, shareId, dataUrl, file.name);
      setShare((prev) => prev ? { ...prev, artwork_url: result.artwork_url } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Artwork upload failed';
      console.error('Failed to upload artwork:', msg);
      setUploadError(msg);
    } finally {
      setUploadingArtwork(false);
      if (artworkInputRef.current) artworkInputRef.current.value = '';
    }
  }, [id, shareId]);

  const handleRenameTrack = useCallback(async (trackId: string) => {
    if (!id || !shareId || !trackTitleValue.trim()) return;
    try {
      const updated = await api.renameShareTrack(id, shareId, trackId, trackTitleValue.trim());
      setShare((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.map((t) => t.id === trackId ? { ...t, ...updated } : t),
        };
      });
      setEditingTrackId(null);
    } catch (err) {
      console.error('Failed to rename track:', err);
    }
  }, [id, shareId, trackTitleValue]);

  const handleDeleteTrack = useCallback(async (trackId: string) => {
    if (!id || !shareId) return;
    try {
      await api.deleteShareTrack(id, shareId, trackId);
      setShare((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.filter((t) => t.id !== trackId),
        };
      });
    } catch (err) {
      console.error('Failed to delete track:', err);
    }
  }, [id, shareId]);

  const handleDeleteProject = useCallback(async () => {
    if (!id || !shareId || deleting) return;
    setDeleting(true);
    try {
      await api.deleteShareProject(id, shareId);
      router.push(`/projects/${id}/share`);
    } catch (err) {
      console.error('Failed to delete share project:', err);
      setDeleting(false);
    }
  }, [id, shareId, deleting, router]);

  const handleMoveTrack = useCallback(async (trackId: string, direction: 'up' | 'down') => {
    if (!share || !id || !shareId) return;
    const tracks = [...share.tracks];
    const idx = tracks.findIndex((t) => t.id === trackId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= tracks.length) return;

    [tracks[idx], tracks[newIdx]] = [tracks[newIdx], tracks[idx]];
    const trackIds = tracks.map((t) => t.id);

    // Optimistic update
    setShare((prev) => prev ? { ...prev, tracks } : prev);

    try {
      await api.reorderShareTracks(id, shareId, trackIds);
    } catch (err) {
      console.error('Failed to reorder tracks:', err);
      await loadData();
    }
  }, [share, id, shareId, loadData]);

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ProjectNav projectId={id} artistName="..." activePage="share" />
        <div className="max-w-[1400px] mx-auto px-10 py-20">
          <div className="text-neutral-400 text-label uppercase tracking-widest">Loading...</div>
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen bg-white">
        <ProjectNav projectId={id} artistName={project?.artist_name || ''} imageUrl={project?.image_url} activePage="share" />
        <div className="max-w-[1400px] mx-auto px-10 py-20">
          <div className="text-neutral-400 text-label uppercase tracking-widest">Share project not found.</div>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/s/${share.slug}` : '';

  return (
    <div className="min-h-screen bg-white">
      <ProjectNav
        projectId={id}
        artistName={project?.artist_name || ''}
        imageUrl={project?.image_url}
        activePage="share"
      />
      <div className="max-w-[1400px] mx-auto px-10 py-12">
        {/* Back link */}
        <button
          onClick={() => router.push(`/projects/${id}/share`)}
          className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast mb-8 flex items-center gap-2"
        >
          <span className="text-body">←</span> All Share Links
        </button>

        <div className="grid grid-cols-[1fr_340px] gap-12">
          {/* Left column: tracks */}
          <div>
            {/* Title */}
            <div className="mb-8">
              {editingTitle ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                    className="text-display font-bold tracking-tight text-black border-b-2 border-black bg-transparent outline-none w-full"
                    autoFocus
                  />
                  <button onClick={handleTitleSave} disabled={saving} className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black">
                    Save
                  </button>
                </div>
              ) : (
                <h1
                  onClick={() => { setEditingTitle(true); setTitleValue(share.title); }}
                  className="text-display font-bold tracking-tight text-black cursor-pointer hover:text-neutral-600 transition-colors duration-fast"
                  title="Click to edit"
                >
                  {share.title}
                </h1>
              )}
            </div>

            {/* Upload tracks */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-label font-bold uppercase tracking-widest text-neutral-400">
                Tracks ({share.tracks.length})
              </span>
              <button
                onClick={() => audioInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-1.5 bg-black text-white text-micro font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-800 transition-colors duration-fast disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Tracks'}
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleUploadTracks}
                className="hidden"
              />
            </div>

            {/* Upload error */}
            {uploadError && (
              <div className="mb-4 px-4 py-3 border border-red-200 rounded-sm bg-red-50">
                <div className="flex items-center justify-between">
                  <span className="text-small text-red-600">{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 text-small">×</button>
                </div>
              </div>
            )}

            {/* Track list */}
            {share.tracks.length === 0 ? (
              <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center">
                <p className="text-body text-neutral-500 mb-1">No tracks yet.</p>
                <p className="text-small text-neutral-400">Upload audio files to share.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {share.tracks.map((track: ShareTrack, idx: number) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-4 py-3 border border-neutral-200 rounded-sm group hover:border-neutral-300 transition-colors duration-fast"
                  >
                    {/* Order */}
                    <span className="text-micro text-neutral-400 w-5 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Title / rename */}
                    <div className="flex-1 min-w-0">
                      {editingTrackId === track.id ? (
                        <input
                          type="text"
                          value={trackTitleValue}
                          onChange={(e) => setTrackTitleValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTrack(track.id); if (e.key === 'Escape') setEditingTrackId(null); }}
                          className="text-body text-black border-b border-black bg-transparent outline-none w-full"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingTrackId(track.id); setTrackTitleValue(track.title); }}
                          className="text-body text-black cursor-pointer truncate block"
                          title="Click to rename"
                        >
                          {track.title}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <span className="text-micro text-neutral-400 shrink-0">
                      {formatBytes(track.file_size_bytes)}
                    </span>
                    <span className="text-micro text-neutral-400 shrink-0">
                      {formatDuration(track.duration_ms)}
                    </span>
                    <span className="text-micro text-neutral-400 shrink-0">
                      {track.play_count} play{track.play_count !== 1 ? 's' : ''}
                    </span>

                    {/* Reorder buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-fast shrink-0">
                      <button
                        onClick={() => handleMoveTrack(track.id, 'up')}
                        disabled={idx === 0}
                        className="text-neutral-400 hover:text-black disabled:opacity-20 text-small px-1"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveTrack(track.id, 'down')}
                        disabled={idx === share.tracks.length - 1}
                        className="text-neutral-400 hover:text-black disabled:opacity-20 text-small px-1"
                      >
                        ↓
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteTrack(track.id)}
                      className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-fast text-small shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: artwork + settings */}
          <div className="space-y-8">
            {/* Artwork */}
            <div>
              <span className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3 block">
                Artwork
              </span>
              <div
                onClick={() => artworkInputRef.current?.click()}
                className="aspect-square rounded-sm overflow-hidden border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors duration-fast relative group"
              >
                {share.artwork_url ? (
                  <>
                    <img src={share.artwork_url} alt="Artwork" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-fast flex items-center justify-center">
                      <span className="text-white text-micro font-bold uppercase tracking-widest">
                        {uploadingArtwork ? 'Uploading...' : 'Replace'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-neutral-50 flex flex-col items-center justify-center">
                    <span className="text-neutral-400 text-display mb-2">♫</span>
                    <span className="text-micro text-neutral-400 uppercase tracking-widest">
                      {uploadingArtwork ? 'Uploading...' : 'Add artwork'}
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={artworkInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadArtwork}
                className="hidden"
              />
            </div>

            {/* Share Link */}
            <div>
              <span className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3 block">
                Share Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-small text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-sm px-3 py-2 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-sm text-micro font-bold uppercase tracking-widest text-neutral-600 hover:text-black transition-colors duration-fast shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button
                onClick={handleRegenerateLink}
                disabled={saving}
                className="text-micro text-neutral-400 hover:text-black mt-2 transition-colors duration-fast"
              >
                Regenerate link
              </button>
            </div>

            {/* Settings */}
            <div>
              <span className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3 block">
                Settings
              </span>
              <div className="space-y-3">
                {/* Public toggle */}
                <button
                  onClick={handleTogglePublic}
                  disabled={saving}
                  className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-sm hover:border-neutral-300 transition-colors duration-fast"
                >
                  <span className="text-small text-black">Public</span>
                  <span className={`text-micro font-bold uppercase tracking-widest ${share.is_public ? 'text-green-600' : 'text-neutral-400'}`}>
                    {share.is_public ? 'On' : 'Off'}
                  </span>
                </button>

                {/* Downloads toggle */}
                <button
                  onClick={handleToggleDownloads}
                  disabled={saving}
                  className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-sm hover:border-neutral-300 transition-colors duration-fast"
                >
                  <span className="text-small text-black">Allow Downloads</span>
                  <span className={`text-micro font-bold uppercase tracking-widest ${share.downloads_enabled ? 'text-green-600' : 'text-neutral-400'}`}>
                    {share.downloads_enabled ? 'On' : 'Off'}
                  </span>
                </button>

                {/* Password */}
                <div className="border border-neutral-200 rounded-sm">
                  <button
                    onClick={() => {
                      if (share.password_hash) {
                        // Remove password
                        handleSetPassword();
                      } else {
                        setShowPasswordInput(!showPasswordInput);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors duration-fast"
                  >
                    <span className="text-small text-black">Password Protection</span>
                    <span className={`text-micro font-bold uppercase tracking-widest ${share.password_hash ? 'text-green-600' : 'text-neutral-400'}`}>
                      {share.password_hash ? 'On' : 'Off'}
                    </span>
                  </button>
                  {showPasswordInput && (
                    <div className="px-4 py-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={passwordValue}
                          onChange={(e) => setPasswordValue(e.target.value)}
                          placeholder="Enter password"
                          className="flex-1 text-small bg-neutral-50 border border-neutral-200 rounded-sm px-3 py-1.5 outline-none focus:border-neutral-400"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSetPassword(); }}
                        />
                        <button
                          onClick={handleSetPassword}
                          disabled={!passwordValue.trim() || saving}
                          className="px-3 py-1.5 bg-black text-white text-micro font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div>
              <span className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3 block">
                Analytics
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-neutral-200 rounded-sm p-4">
                  <span className="text-display font-bold text-black block">{share.total_plays}</span>
                  <span className="text-micro text-neutral-400 uppercase tracking-widest">Total Plays</span>
                </div>
                <div className="border border-neutral-200 rounded-sm p-4">
                  <span className="text-display font-bold text-black block">{share.download_count}</span>
                  <span className="text-micro text-neutral-400 uppercase tracking-widest">Downloads</span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div>
              {showDeleteConfirm ? (
                <div className="border border-red-200 rounded-sm p-4">
                  <p className="text-small text-red-600 mb-3">Delete this share link and all its tracks? This can't be undone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteProject}
                      disabled={deleting}
                      className="px-4 py-1.5 bg-red-600 text-white text-micro font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-1.5 text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-micro text-neutral-400 hover:text-red-500 transition-colors duration-fast"
                >
                  Delete share link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
