'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../../lib/api';
import type { ShareProject, Project } from '../../../../lib/api';
import { ButtonV2 } from '../../../../components/ui';

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
      <div className="animate-fade-in h-full flex flex-col">
        <ProjectNav
          projectId={id}
          artistName="..."
          activePage="share"
        />
        <div className="max-w-[1400px] mx-auto px-10 pt-10 w-full">
          <div className="h-3 w-32 skel mb-4" />
          <div className="h-10 w-28 skel skel-delay-1 mb-4" />
          <div className="h-4 w-72 skel skel-delay-2 mb-10" />
          <div className="space-y-3 stagger-enter">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#F7F7F5] p-6 flex items-center gap-5">
                <div className="w-14 h-14 skel shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-40 skel skel-delay-1 mb-2" />
                  <div className="h-3 w-28 skel skel-delay-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-reveal h-full flex flex-col">
      <ProjectNav
        projectId={id}
        artistName={project?.artist_name || ''}
        imageUrl={project?.image_url}
        activePage="share"
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {/* Editorial header */}
          <div className="pb-10 border-b border-[#E8E8E8]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-2">
                  Private Listening &amp; Distribution
                </p>
                <h2 className="text-[40px] leading-[1.1] font-medium tracking-tight text-[#1A1A1A]">
                  Tracks
                </h2>
                <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
                  Share your music with collaborators, labels, or press — privately, on your terms.
                </p>
              </div>
              <ButtonV2 onClick={handleCreate} loading={creating}>
                + New Share Link
              </ButtonV2>
            </div>
          </div>

          {/* Share projects list */}
          <div className="pt-10">
            {shares.length === 0 ? (
              <div className="bg-[#F7F7F5] py-20 px-10 text-center">
                <p className="text-[22px] font-medium text-[#C4C4C4] tracking-tight">
                  Your first release starts here
                </p>
                <p className="text-[14px] text-[#8A8A8A] mt-3 max-w-sm mx-auto leading-relaxed">
                  Create a share link to send your music to collaborators, labels, or press — privately, before it goes public.
                </p>
                <div className="mt-6">
                  <ButtonV2 onClick={handleCreate} loading={creating}>
                    + New Share Link
                  </ButtonV2>
                </div>
              </div>
            ) : (
              <div className="space-y-3 stagger-enter">
                {shares.map((share) => (
                  <button
                    key={share.id}
                    onClick={() => router.push(`/projects/${id}/share/${share.id}`)}
                    className="w-full text-left bg-[#F7F7F5] hover:bg-[#F0F0ED] card-hover flex items-center gap-6 px-7 py-6 group"
                  >
                    {/* Artwork thumbnail */}
                    {share.artwork_url ? (
                      <div className="w-16 h-16 overflow-hidden bg-[#EEEDEB] shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveArtworkUrl(share.artwork_url) || ''} alt={share.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-[#EEEDEB] shrink-0 flex items-center justify-center">
                        <span className="text-[#C4C4C4] text-[24px]">&#9835;</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-[#1A1A1A]">{share.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-medium text-[#8A8A8A]">
                          {share.track_count || 0} track{(share.track_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[#C4C4C4]">·</span>
                        <span className="text-[11px] text-[#8A8A8A]">
                          {share.total_plays} play{share.total_plays !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[#C4C4C4]">·</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${share.is_public ? 'bg-green-500' : 'bg-[#C4C4C4]'}`} />
                          <span className={`text-[11px] font-medium ${share.is_public ? 'text-green-600' : 'text-[#8A8A8A]'}`}>
                            {share.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#C4C4C4] mt-10 italic">
            All links are private by default.
          </p>
        </div>
      </div>
    </div>
  );
}
