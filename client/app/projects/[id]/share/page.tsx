'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../../lib/api';
import type { ShareProject, Project } from '../../../../lib/api';
import { Button } from '../../../../components/ui';

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
        <div className="max-w-[1400px] mx-auto px-8 pt-10">
          <div className="h-3 w-40 bg-neutral-100 rounded-sm animate-pulse mb-4" />
          <div className="h-10 w-32 bg-neutral-100 rounded-sm animate-pulse mb-4" />
          <div className="h-4 w-80 bg-neutral-50 rounded-sm animate-pulse mb-8" />
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-neutral-100 animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-neutral-100 rounded-sm animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-neutral-50 rounded-sm animate-pulse" />
                </div>
              </div>
            ))}
          </div>
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
      <div className="max-w-[1400px] mx-auto">
        {/* Editorial header */}
        <div className="px-8 pt-10 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Private Listening &amp; Distribution
              </p>
              <h2 className="text-[40px] leading-[0.9] font-bold tracking-tight text-black">
                Tracks
              </h2>
              <p className="text-body-lg text-neutral-500 mt-4 max-w-lg">
                Share your music with collaborators, labels, or press — privately, on your terms.
              </p>
            </div>
            <Button onClick={handleCreate} loading={creating}>
              + New Share Link
            </Button>
          </div>
        </div>

        <div className="px-8 pb-12">

        {/* Share projects list */}
        {shares.length === 0 ? (
          <div className="border-2 border-dashed border-neutral-200 rounded-sm py-20 px-8 text-center">
            <p className="text-[28px] font-bold text-neutral-200 tracking-tight">
              Your first release starts here
            </p>
            <p className="text-body text-neutral-400 mt-3 max-w-sm mx-auto">
              Create a share link to send your music to collaborators, labels, or press — privately, before it goes public.
            </p>
            <Button onClick={handleCreate} loading={creating} className="mt-6">
              + New Share Link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <button
                key={share.id}
                onClick={() => router.push(`/projects/${id}/share/${share.id}`)}
                className="w-full text-left border border-neutral-200 rounded-sm p-5 hover:border-black transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    {/* Artwork thumbnail */}
                    {share.artwork_url ? (
                      <div className="w-14 h-14 rounded-sm overflow-hidden border border-neutral-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveArtworkUrl(share.artwork_url) || ''} alt={share.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-sm bg-neutral-50 border border-neutral-200 shrink-0 flex items-center justify-center">
                        <span className="text-neutral-300 text-heading">&#9835;</span>
                      </div>
                    )}
                    <div>
                      <span className="text-heading-sm font-bold text-black">{share.title}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-micro font-bold text-neutral-400 uppercase tracking-widest">
                          {share.track_count || 0} track{(share.track_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-neutral-200">·</span>
                        <span className="text-micro text-neutral-400 uppercase tracking-widest">
                          {share.total_plays} play{share.total_plays !== 1 ? 's' : ''}
                        </span>
                        <span className="text-neutral-200">·</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${share.is_public ? 'bg-green-500' : 'bg-neutral-300'}`} />
                          <span className={`text-micro uppercase tracking-widest ${share.is_public ? 'text-green-600' : 'text-neutral-400'}`}>
                            {share.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-neutral-300 group-hover:text-black transition-colors duration-fast text-body">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
