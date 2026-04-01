'use client';

import { useState, useEffect } from 'react';
import { Signal, Button } from '../components/ui';
import { useAuth } from '../lib/auth-context';
import { api, resolveArtworkUrl, type Project } from '../lib/api';

/* eslint-disable @next/next/no-img-element */

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    setLoadingProjects(true);
    api.listProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoadingProjects(false));
  }, [authLoading, isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100">IMC</p>
          <p className="text-body text-neutral-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show landing with login CTA
  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        {/* Masthead */}
        <div className="border-b border-neutral-200">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
              Instruments of Mass Creation
            </p>
            <div className="flex items-center gap-3">
              <Button as="a" href="/login" variant="ghost" size="lg">
                Sign In
              </Button>
              <Button as="a" href="/register">
                Get Started
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 py-32">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">IMC</p>
          <p className="text-[48px] leading-[1.1] font-bold text-black mt-6 tracking-tight max-w-xl">

            Your creative intelligence engine
          </p>
          <p className="text-body-lg text-neutral-500 mt-6 max-w-md">
            Define your concept. Research your market. Generate production-ready prompts — all from one brief.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <Button as="a" href="/register" size="lg">
              Create Account
            </Button>
            <Button as="a" href="/login" variant="secondary" size="lg">
              Sign In
            </Button>
          </div>
        </div>

        {/* Colophon */}
        <div className="border-t border-neutral-200">
          <div className="max-w-[1400px] mx-auto px-10 py-4 flex items-center justify-between">
            <p className="text-micro font-mono text-neutral-300">IMC v0.1.0</p>
            <p className="text-micro font-mono text-neutral-300">Music Intelligence Platform</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Masthead */}
      <div className="border-b border-neutral-200 shrink-0">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <div>
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
              Instruments of Mass Creation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-micro font-mono text-neutral-300">
              {user?.name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10">

          {loadingProjects ? (
            <div className="pt-16 pb-10">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <div className="h-3 w-16 bg-neutral-100 rounded-sm animate-pulse mb-3" />
                  <div className="h-14 w-16 bg-neutral-100 rounded-sm animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-neutral-100 rounded-sm animate-pulse" />
              </div>
              <div className="border-t border-neutral-200">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 py-6 border-b border-neutral-200">
                    <div className="w-16 h-16 rounded-sm bg-neutral-100 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-neutral-100 rounded-sm animate-pulse mb-2" />
                      <div className="h-3 w-64 bg-neutral-50 rounded-sm animate-pulse mb-2" />
                      <div className="h-2 w-24 bg-neutral-50 rounded-sm animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-neutral-50 rounded-sm animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-50 rounded-sm animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length > 0 ? (
            <>
              {/* Header row */}
              <div className="flex items-end justify-between pt-16 pb-10">
                <div>
                  <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    Projects
                  </p>
                  <h1 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
                    {String(projects.length).padStart(2, '0')}
                  </h1>
                </div>
                <Button as="a" href="/projects/new">
                  + New Project
                </Button>
              </div>

              {/* Project list */}
              <div className="border-t border-neutral-200">
                {projects.map((project) => {
                  const statusLabel = project.status === 'draft' ? 'Draft' : project.status === 'complete' ? 'Complete' : 'In Progress';
                  const statusColor = project.status === 'complete' ? 'green' : project.status === 'draft' ? 'neutral' : 'yellow';
                  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <a
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group flex items-center gap-6 py-6 border-b border-neutral-200 hover:bg-neutral-50 -mx-4 px-4 rounded-sm transition-colors duration-fast"
                    >
                      {/* Artist image or initial */}
                      <div className="w-16 h-16 rounded-sm overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center">
                        {project.image_url ? (
                          <img
                            src={resolveArtworkUrl(project.image_url) || ''}
                            alt={project.artist_name || 'Artist'}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-[28px] font-bold text-neutral-300">
                            {(project.artist_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name + concept + date */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-heading-sm font-bold text-black group-hover:text-black truncate">
                          {project.artist_name || 'Untitled'}
                        </h2>
                        {project.concept?.creative_direction ? (
                          <p className="text-body-sm text-neutral-500 mt-1 truncate">
                            {project.concept.creative_direction}
                          </p>
                        ) : (
                          <p className="text-body-sm text-neutral-400 mt-1">No concept defined</p>
                        )}
                        <span className="text-micro font-mono text-neutral-300 mt-1.5 block">
                          {createdDate}
                        </span>
                      </div>

                      {/* Genre pill */}
                      {project.concept?.genre_primary && (
                        <span className="text-micro font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-sm shrink-0">
                          {project.concept.genre_primary}
                        </span>
                      )}

                      {/* Status */}
                      <div className="shrink-0 w-24 text-right">
                        <Signal color={statusColor as 'green' | 'yellow' | 'neutral'} label={statusLabel} />
                      </div>

                      {/* Arrow */}
                      <span className="text-neutral-300 group-hover:text-black transition-colors shrink-0">
                        &#8599;
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Bottom spacer */}
              <div className="h-16" />
            </>
          ) : (
            /* No projects yet */
            <div className="py-32">
              <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">00</p>
              <p className="text-[48px] leading-[1.1] font-bold text-black mt-6 tracking-tight">
                Start Something
              </p>
              <p className="text-body-lg text-neutral-500 mt-4 max-w-md">
                Every project begins with a concept. Create one and we&apos;ll help you build the research, prompts, and sound around it.
              </p>
              <Button as="a" href="/projects/new" size="lg" className="mt-8">
                New Project
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Colophon */}
      <div className="border-t border-neutral-200 shrink-0">
        <div className="max-w-[1400px] mx-auto px-10 py-4 flex items-center justify-between">
          <p className="text-micro font-mono text-neutral-300">IMC v0.1.0</p>
          <p className="text-micro font-mono text-neutral-300">Music Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
