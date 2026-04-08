'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import VisualMoodboard from '../../../../components/VisualMoodboard';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { Project } from '../../../../lib/api';

export default function MoodboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    api.getProject(id)
      .then((proj) => {
        setProject(proj);
      })
      .catch((err) => console.error('Failed to load project:', err))
      .finally(() => setPageLoading(false));
  }, [isAuthenticated, id]);

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 skel" />
              <span className="text-[#E8E8E8]">/</span>
              <div className="h-3 w-24 skel skel-delay-1" />
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-10 w-full pt-10">
          <div className="h-3 w-32 skel mb-4" />
          <div className="h-10 w-48 skel skel-delay-1 mb-8" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square skel skel-delay-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const artistName = project?.artist_name || 'Untitled';

  return (
    <div className="content-reveal h-full flex flex-col">
      <ProjectNav
        projectId={id}
        artistName={artistName}
        imageUrl={project?.image_url}
        activePage="moodboard"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10">
          <VisualMoodboard projectId={id} />
        </div>
      </div>
    </div>
  );
}
