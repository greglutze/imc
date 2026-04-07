'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../../components/ProjectNav';
import { useAuth } from '../../../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../../../lib/api';
import type { ShareProjectWithTracks, ShareTrack, Project } from '../../../../../lib/api';
import SharePreview from '../../../../../components/SharePreview';
import TrackAnnotations from '../../../../../components/TrackAnnotations';
import ShowreelPlayer from '../../../../../components/ShowreelPlayer';
import { ButtonV2 } from '../../../../../components/ui';

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'settings' | 'preview'>('settings');

  // Add track via Dropbox link
  const [dropboxInput, setDropboxInput] = useState('');
  const [addingTrack, setAddingTrack] = useState(false);

  // Player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Add track by pasting a Dropbox link
  const handleAddTrack = useCallback(async () => {
    if (!id || !shareId || !dropboxInput.trim()) return;

    // Support pasting multiple links (one per line)
    const lines = dropboxInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const dropboxLinks = lines.filter(l => l.includes('dropbox.com') || l.includes('dropboxusercontent.com'));

    if (dropboxLinks.length === 0) {
      setAddError('Please paste a Dropbox shared link. Right-click a file in Dropbox and choose "Copy link."');
      return;
    }

    setAddingTrack(true);
    setAddError(null);

    try {
      if (dropboxLinks.length === 1) {
        const track = await api.addShareTrack(id, shareId, dropboxLinks[0]);
        setShare((prev) => prev ? { ...prev, tracks: [...prev.tracks, track] } : prev);
      } else {
        const result = await api.addShareTracksBatch(id, shareId, dropboxLinks.map(url => ({ dropbox_url: url })));
        setShare((prev) => prev ? { ...prev, tracks: [...prev.tracks, ...result.tracks] } : prev);
      }
      setDropboxInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add track';
      setAddError(msg);
    } finally {
      setAddingTrack(false);
    }
  }, [id, shareId, dropboxInput]);

  const handleUploadArtwork = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !shareId) return;
    setUploadingArtwork(true);
    setAddError(null);

    try {
      const result = await api.uploadShareArtwork(id, shareId, file);
      setShare((prev) => prev ? { ...prev, artwork_url: result.artwork_url } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Artwork upload failed';
      console.error('Failed to upload artwork:', msg);
      setAddError(msg);
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

  // ── Audio player (streams directly from Dropbox) ──

  const handlePlayTrack = useCallback((trackId: string) => {
    if (!share) return;
    const track = share.tracks.find(t => t.id === trackId);
    if (!track) return;

    // If clicking the same track, toggle play/pause
    if (playingTrackId === trackId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stream directly from Dropbox
    const audio = new Audio(track.dropbox_url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.play();
    setPlayingTrackId(trackId);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, [share, playingTrackId, isPlaying]);

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

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ProjectNav projectId={id} artistName="..." activePage="share" />
        <div className="max-w-[1400px] mx-auto px-10 py-12">
          <div className="h-3 w-24 bg-[#F7F7F5] animate-pulse mb-8" />
          <div className="grid grid-cols-[1fr_340px] gap-12">
            <div>
              <div className="h-12 w-64 bg-[#F7F7F5] animate-pulse mb-8" />
              <div className="h-3 w-20 bg-[#F7F7F5] animate-pulse mb-4" />
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border border-[#E8E8E8] ">
                    <div className="w-7 h-7 rounded-full bg-[#F7F7F5] animate-pulse shrink-0" />
                    <div className="w-4 h-3 bg-[#F7F7F5] animate-pulse" />
                    <div className="flex-1 h-4 bg-[#F7F7F5] animate-pulse" />
                    <div className="w-10 h-3 bg-[#F7F7F5] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <div className="h-3 w-16 bg-[#F7F7F5] animate-pulse mb-3" />
                <div className="aspect-square bg-[#F7F7F5] animate-pulse" />
              </div>
              <div>
                <div className="h-3 w-20 bg-[#F7F7F5] animate-pulse mb-3" />
                <div className="h-9 w-full bg-[#F7F7F5] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen bg-white">
        <ProjectNav projectId={id} artistName={project?.artist_name || ''} imageUrl={project?.image_url} activePage="share" />
        <div className="max-w-[1400px] mx-auto px-10 py-20">
          <div className="text-[#8A8A8A] text-[12px] uppercase tracking-wide">Share project not found.</div>
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
        <a href={`/projects/${id}/share`} className="inline-block mb-8">
          <ButtonV2 variant="ghost" size="sm" className="flex items-center gap-2">
            <span className="text-[14px]">←</span> All Share Links
          </ButtonV2>
        </a>

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
                    className="text-[40px] font-medium tracking-tight text-black border-b-2 border-black bg-transparent outline-none w-full"
                    autoFocus
                  />
                  <ButtonV2 onClick={handleTitleSave} disabled={saving} variant="ghost" size="sm">
                    Save
                  </ButtonV2>
                </div>
              ) : (
                <h1
                  onClick={() => { setEditingTitle(true); setTitleValue(share.title); }}
                  className="text-[40px] font-medium tracking-tight text-black cursor-pointer hover:text-[#8A8A8A] transition-colors duration-150"
                  title="Click to edit"
                >
                  {share.title}
                </h1>
              )}
            </div>

            {/* Showreel Player — auto-generated preview mix */}
            {share.tracks.length >= 2 && (
              <div className="mb-6">
                <ShowreelPlayer
                  tracks={share.tracks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    dropbox_url: t.dropbox_url,
                    duration_ms: t.duration_ms,
                  }))}
                />
              </div>
            )}

            {/* Add track via Dropbox link */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                  Tracks ({share.tracks.length})
                </span>
              </div>
              <div className="flex items-stretch gap-2">
                <textarea
                  value={dropboxInput}
                  onChange={(e) => setDropboxInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTrack(); } }}
                  placeholder="Paste Dropbox link(s) here — one per line for multiple tracks"
                  className="flex-1 text-[13px] bg-[#F7F7F5] border border-[#E8E8E8] px-3 py-2.5 outline-none focus:border-[#C4C4C4] resize-none min-h-[42px]"
                  rows={dropboxInput.includes('\n') ? 3 : 1}
                />
                <ButtonV2 onClick={handleAddTrack} disabled={!dropboxInput.trim()} loading={addingTrack} size="sm" className="shrink-0 self-end">
                  Add
                </ButtonV2>
              </div>
              <p className="text-[11px] text-[#8A8A8A] mt-1.5">
                Right-click a file in Dropbox → Copy link → paste here. Multiple links? Shift+Enter for new lines.
              </p>
            </div>

            {/* Error */}
            {addError && (
              <div className="mb-4 px-4 py-3 border border-red-200  bg-red-50">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-red-600">{addError}</span>
                  <button onClick={() => setAddError(null)} className="text-red-400 hover:text-red-600 text-[13px]">×</button>
                </div>
              </div>
            )}

            {/* Track list */}
            {share.tracks.length === 0 ? (
              <div className="border-2 border-dashed border-[#E8E8E8] py-16 px-10 text-center">
                <p className="text-[28px] font-medium text-[#E8E8E8] tracking-tight">
                  Add your first track
                </p>
                <p className="text-[14px] text-[#8A8A8A] mt-3 max-w-sm mx-auto">
                  Paste a Dropbox link above — your music will be streamable instantly, no upload needed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {share.tracks.map((track: ShareTrack, idx: number) => {
                  const isActiveTrack = playingTrackId === track.id;
                  const progress = isActiveTrack && duration > 0 ? (currentTime / duration) * 100 : 0;
                  return (
                  <div
                    key={track.id}
                    className={`relative border  group transition-all duration-150 overflow-hidden ${isActiveTrack ? 'border-black' : 'border-[#E8E8E8] hover:border-[#E8E8E8]'}`}
                  >
                    {/* Inline progress bar — sits behind content */}
                    {isActiveTrack && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#F7F7F5] transition-all duration-100 pointer-events-none"
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    <div className="relative flex items-center gap-4 px-5 py-4">
                      {/* Play/Pause button */}
                      <ButtonV2
                        onClick={() => handlePlayTrack(track.id)}
                        variant="media"
                        size="sm"
                        data-active={isActiveTrack}
                      >
                        <span className="text-[10px] leading-none">
                          {isActiveTrack && isPlaying ? '▮▮' : '▶'}
                        </span>
                      </ButtonV2>

                      {/* Track number */}
                      <span className="text-[11px] font-mono text-[#C4C4C4] w-5 text-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Title / rename */}
                      <div className="flex-1 min-w-0">
                        {editingTrackId === track.id ? (
                          <input
                            type="text"
                            value={trackTitleValue}
                            onChange={(e) => setTrackTitleValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTrack(track.id); if (e.key === 'Escape') setEditingTrackId(null); }}
                            className="text-[14px] font-semibold text-black border-b border-black bg-transparent outline-none w-full"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => { setEditingTrackId(track.id); setTrackTitleValue(track.title); }}
                            className="text-[14px] font-semibold text-black cursor-pointer truncate block"
                            title="Click to rename"
                          >
                            {track.title}
                          </span>
                        )}
                      </div>

                      {/* Time display for active track */}
                      {isActiveTrack && duration > 0 && (
                        <span className="text-[11px] font-mono text-[#8A8A8A] shrink-0">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      )}

                      {/* Meta */}
                      <span className="text-[11px] text-[#C4C4C4] shrink-0 uppercase tracking-wide">
                        {track.format}
                      </span>
                      <span className="text-[11px] text-[#8A8A8A] shrink-0">
                        {track.play_count > 0 ? `${track.play_count} play${track.play_count !== 1 ? 's' : ''}` : '—'}
                      </span>

                      {/* Reorder buttons */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                        <button
                          onClick={() => handleMoveTrack(track.id, 'up')}
                          disabled={idx === 0}
                          className="text-[#8A8A8A] hover:text-black disabled:opacity-20 text-[13px] px-1"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveTrack(track.id, 'down')}
                          disabled={idx === share.tracks.length - 1}
                          className="text-[#8A8A8A] hover:text-black disabled:opacity-20 text-[13px] px-1"
                        >
                          ↓
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTrack(track.id)}
                        className="text-[#8A8A8A] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-150 text-[13px] shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Player bar */}
            {playingTrackId && share.tracks.length > 0 && (() => {
              const activeTrack = share.tracks.find((t) => t.id === playingTrackId);
              if (!activeTrack) return null;
              return (
                <div className="mt-6 border border-[#E8E8E8] px-5 py-4">
                  <div className="flex items-center gap-4 mb-3">
                    <ButtonV2
                      onClick={() => handlePlayTrack(playingTrackId)}
                      variant="media"
                      size="sm"
                      data-active
                    >
                      <span className="text-[11px] leading-none">
                        {isPlaying ? '▮▮' : '▶'}
                      </span>
                    </ButtonV2>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-semibold text-black truncate block">
                        {activeTrack.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A8A8A] shrink-0">
                      {formatTime(currentTime)} / {formatTime(duration || 0)}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 bg-[#E8E8E8] rounded-full cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-black rounded-full transition-all duration-100"
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Track Annotations — appears when a track is active */}
            {playingTrackId && (
              <TrackAnnotations
                projectId={id}
                shareId={shareId}
                trackId={playingTrackId}
                trackTitle={share.tracks.find((t) => t.id === playingTrackId)?.title || ''}
                currentTimeMs={Math.round(currentTime * 1000)}
                onSeek={(ms) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = ms / 1000;
                  }
                }}
              />
            )}
          </div>

          {/* Right column: settings / preview toggle */}
          <div className="space-y-8">
            {/* Panel toggle */}
            <div className="flex items-center gap-0 border border-[#E8E8E8] overflow-hidden">
              <button
                onClick={() => setRightPanel('settings')}
                className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-150 ${rightPanel === 'settings' ? 'bg-black text-white' : 'text-[#8A8A8A] hover:text-black'}`}
              >
                Settings
              </button>
              <button
                onClick={() => setRightPanel('preview')}
                className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-150 ${rightPanel === 'preview' ? 'bg-black text-white' : 'text-[#8A8A8A] hover:text-black'}`}
              >
                Preview
              </button>
            </div>

            {rightPanel === 'preview' ? (
              <SharePreview
                title={share.title}
                artworkUrl={share.artwork_url}
                theme={share.theme || 'dark'}
                tracks={share.tracks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  format: t.format,
                  sort_order: t.sort_order,
                }))}
                downloadsEnabled={share.downloads_enabled}
                isPublic={share.is_public}
                passwordProtected={!!share.password_hash}
              />
            ) : (
            <>
            {/* Artwork */}
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3 block">
                Artwork
              </span>
              <div
                onClick={() => artworkInputRef.current?.click()}
                className="aspect-square overflow-hidden border border-[#E8E8E8] cursor-pointer hover:border-[#C4C4C4] transition-colors duration-150 relative group"
              >
                {share.artwork_url ? (
                  <>
                    <img src={resolveArtworkUrl(share.artwork_url) || ''} alt="Artwork" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <span className="text-white text-[11px] font-semibold uppercase tracking-wide">
                        {uploadingArtwork ? 'Uploading...' : 'Replace'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-[#F7F7F5] flex flex-col items-center justify-center">
                    <span className="text-[#8A8A8A] text-[40px] mb-2">♫</span>
                    <span className="text-[11px] text-[#8A8A8A] uppercase tracking-wide">
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
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3 block">
                Share Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-[13px] text-[#8A8A8A] bg-[#F7F7F5] border border-[#E8E8E8] px-3 py-2 truncate"
                />
                <ButtonV2 onClick={handleCopyLink} variant="secondary" size="sm" className="shrink-0">
                  {copied ? 'Copied!' : 'Copy'}
                </ButtonV2>
              </div>
              <ButtonV2 onClick={handleRegenerateLink} disabled={saving} variant="ghost" size="sm" className="mt-2">
                Regenerate link
              </ButtonV2>
            </div>

            {/* Settings */}
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3 block">
                Settings
              </span>
              <div className="space-y-3">
                {/* Public toggle */}
                <button
                  onClick={handleTogglePublic}
                  disabled={saving}
                  className="w-full flex items-center justify-between px-4 py-3 border border-[#E8E8E8] hover:border-[#E8E8E8] transition-colors duration-150"
                >
                  <span className="text-[13px] text-black">Public</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${share.is_public ? 'text-green-600' : 'text-[#8A8A8A]'}`}>
                    {share.is_public ? 'On' : 'Off'}
                  </span>
                </button>

                {/* Downloads toggle */}
                <button
                  onClick={handleToggleDownloads}
                  disabled={saving}
                  className="w-full flex items-center justify-between px-4 py-3 border border-[#E8E8E8] hover:border-[#E8E8E8] transition-colors duration-150"
                >
                  <span className="text-[13px] text-black">Allow Downloads</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${share.downloads_enabled ? 'text-green-600' : 'text-[#8A8A8A]'}`}>
                    {share.downloads_enabled ? 'On' : 'Off'}
                  </span>
                </button>

                {/* Password */}
                <div className="border border-[#E8E8E8] ">
                  <button
                    onClick={() => {
                      if (share.password_hash) {
                        handleSetPassword();
                      } else {
                        setShowPasswordInput(!showPasswordInput);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F7F7F5] transition-colors duration-150"
                  >
                    <span className="text-[13px] text-black">Password Protection</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${share.password_hash ? 'text-green-600' : 'text-[#8A8A8A]'}`}>
                      {share.password_hash ? 'On' : 'Off'}
                    </span>
                  </button>
                  {showPasswordInput && (
                    <div className="px-4 py-3 border-t border-[#E8E8E8]">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={passwordValue}
                          onChange={(e) => setPasswordValue(e.target.value)}
                          placeholder="Enter password"
                          className="flex-1 text-[13px] bg-[#F7F7F5] border border-[#E8E8E8] px-3 py-1.5 outline-none focus:border-[#C4C4C4]"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSetPassword(); }}
                        />
                        <ButtonV2 onClick={handleSetPassword} disabled={!passwordValue.trim() || saving} size="sm">
                          Set
                        </ButtonV2>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-3 block">
                Analytics
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#E8E8E8] p-4">
                  <span className="text-[40px] font-medium text-black block">{share.total_plays}</span>
                  <span className="text-[11px] text-[#8A8A8A] uppercase tracking-wide">Total Plays</span>
                </div>
                <div className="border border-[#E8E8E8] p-4">
                  <span className="text-[40px] font-medium text-black block">{share.download_count}</span>
                  <span className="text-[11px] text-[#8A8A8A] uppercase tracking-wide">Downloads</span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div>
              {showDeleteConfirm ? (
                <div className="border border-red-200 p-4">
                  <p className="text-[13px] text-red-600 mb-3">Delete this share link and all its tracks? This can&apos;t be undone.</p>
                  <div className="flex items-center gap-2">
                    <ButtonV2 onClick={handleDeleteProject} loading={deleting} variant="danger" size="sm">
                      Confirm Delete
                    </ButtonV2>
                    <ButtonV2 onClick={() => setShowDeleteConfirm(false)} variant="ghost" size="sm">
                      Cancel
                    </ButtonV2>
                  </div>
                </div>
              ) : (
                <ButtonV2 onClick={() => setShowDeleteConfirm(true)} variant="danger-ghost" size="sm">
                  Delete share link
                </ButtonV2>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
