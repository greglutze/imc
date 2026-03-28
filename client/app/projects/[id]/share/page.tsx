'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { ShareProject, Project } from '../../../../lib/api';

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [shares, setShares] = useState<ShareProject[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadData = async () => {
      try {
        const [proj, sharesData] = await Promise.all([
          api.getProject(id),
          api.getShareProjects(id),
        ]);
        setProject(proj);
        setShares(sharesData.projects);
      } catch (err) {
        console.error('Failed to load share data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id]);

  const handleCreate = useCallback(async () => {
    if (!id || creating) return;
    setCreating(true);
    try {
      const share = await api.createShareProject(id);
      router.push(`/projects/${id}/share/${share.id}`);
    } catch (err) {
      console.error('Failed to create share project:', err);
      setCreating(false);
    }
  }, [id, creating, router]);

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ProjectNav
          projectId={id}
          artistName="..."
          activePage="share"
        />
        <div className="max-w-[1400px] mx-auto px-10 py-20">
          <div className="text-neutral-400 text-label uppercase tracking-widest">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ProjectNav
        projectId={id}
        artistName={project?.artist_name || ''}
        imageUrl={project?.image_url}
        activePage="share"
      />
      <div className="max-w-[1400px] mx-auto px-10 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-display font-bold tracking-tight text-black mb-2">
              Share
            </h1>
            <p className="text-body text-neutral-500">
              Create private listening links to share your music before release.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2.5 bg-black text-white text-label font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-800 transition-colors duration-fast disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'New Share Link'}
          </button>
        </div>

        {/* Share projects list */}
        {shares.length === 0 ? (
          <div className="border border-neutral-200 rounded-sm p-16 text-center">
            <p className="text-body text-neutral-500 mb-2">No share links yet.</p>
            <p className="text-small text-neutral-400">
              Create a share link to send your music to collaborators, labels, or press.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <button
                key={share.id}
                onClick={() => router.push(`/projects/${id}/share/${share.id}`)}
                className="w-full text-left border border-neutral-200 rounded-sm p-5 hover:border-neutral-400 transition-colors duration-fast group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Artwork thumbnail */}
                    {share.artwork_url ? (
                      <div className="w-10 h-10 rounded-sm overflow-hidden border border-neutral-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={share.artwork_url} alt={share.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-sm bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
                        <span className="text-neutral-400 text-small">♫</span>
                      </div>
                    )}
                    <div>
                      <span className="text-body font-bold text-black group-hover:text-black">{share.title}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-micro text-neutral-400 uppercase tracking-widest">
                          {share.track_count || 0} track{(share.track_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-neutral-200">·</span>
                        <span className="text-micro text-neutral-400 uppercase tracking-widest">
                          {share.total_plays} play{share.total_plays !== 1 ? 's' : ''}
                        </span>
                        <span className="text-neutral-200">·</span>
                        <span className={`text-micro uppercase tracking-widest ${share.is_public ? 'text-green-600' : 'text-neutral-400'}`}>
                          {share.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-neutral-400 group-hover:text-black transition-colors duration-fast text-body">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
