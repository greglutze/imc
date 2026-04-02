'use client';

import { useState, useEffect } from 'react';
import { Signal, ButtonV2 } from '../components/ui';
import { useAuth } from '../lib/auth-context';
import { api, resolveArtworkUrl, type Project } from '../lib/api';

/* eslint-disable @next/next/no-img-element */

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

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
          <p className="text-[120px] leading-[0.85] font-medium text-neutral-100">IMC</p>
          <p className="text-body text-[#8A8A8A] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show landing with login CTA
  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        {/* Masthead */}
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
              Instruments of Mass Creation
            </p>
            <div className="flex items-center gap-3">
              <ButtonV2 as="a" href="/login" variant="ghost" size="lg">
                Sign In
              </ButtonV2>
              <ButtonV2 as="a" href="/register">
                Get Started
              </ButtonV2>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 py-32">
          <p className="text-[120px] leading-[0.85] font-medium text-neutral-100 -ml-1">IMC</p>
          <p className="t-display text-black mt-6 max-w-xl">
            Your creative intelligence engine
          </p>
          <p className="text-body-lg text-[#8A8A8A] mt-6 max-w-md">
            Define your concept. Research your market. Generate production-ready prompts — all from one brief.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <ButtonV2 as="a" href="/register" size="lg">
              Create Account
            </ButtonV2>
            <ButtonV2 as="a" href="/login" variant="secondary" size="lg">
              Sign In
            </ButtonV2>
          </div>
        </div>

        {/* Colophon */}
        <div className="border-t border-[#E8E8E8]">
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
      <div className="border-b border-[#E8E8E8] shrink-0">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
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
                  <div className="h-3 w-16 bg-neutral-100 rounded-md animate-pulse mb-3" />
                  <div className="h-14 w-16 bg-neutral-100 rounded-md animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-neutral-100 rounded-md animate-pulse" />
              </div>
              <div className="border-t border-[#E8E8E8]">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 py-6 border-b border-[#E8E8E8]">
                    <div className="w-16 h-16 rounded-md bg-neutral-100 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-neutral-100 rounded-md animate-pulse mb-2" />
                      <div className="h-3 w-64 bg-neutral-50 rounded-md animate-pulse mb-2" />
                      <div className="h-2 w-24 bg-neutral-50 rounded-md animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-neutral-50 rounded-md animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-50 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length > 0 ? (
            <>
              {/* Header row */}
              <div className="flex items-end justify-between pt-16 pb-10">
                <div>
                  <h1 className="t-display-sm text-black">
                    My Projects
                  </h1>
                </div>
                <ButtonV2 as="a" href="/projects/new">
                  + New Project
                </ButtonV2>
              </div>

              {/* Project cards */}
              <div className="grid grid-cols-3 gap-5">
                {projects.map((project, index) => {
                  const statusLabel = project.status === 'draft' ? 'Draft' : project.status === 'complete' ? 'Complete' : 'In Progress';
                  const statusColor = project.status === 'complete' ? 'green' : project.status === 'draft' ? 'neutral' : 'yellow';
                  const projectCode = `(IMC\u00AE \u2014 ${String(index + 1).padStart(2, '0')}${(project.artist_name || 'U').charAt(0).toUpperCase()})`;

                  return (
                    <a
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group bg-[#F7F7F5] rounded-lg p-7 pb-6 hover:bg-[#F0F0ED] transition-all duration-200 flex flex-col justify-between min-h-[260px]"
                    >
                      <div>
                        {/* Code + status row */}
                        <div className="flex items-center justify-between mb-5">
                          <span className="text-[11px] font-medium tracking-wide text-[#C4C4C4]">
                            {projectCode}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              statusColor === 'green' ? 'bg-green-500' :
                              statusColor === 'yellow' ? 'bg-yellow-500' :
                              'bg-neutral-300'
                            }`} />
                            <span className="text-[11px] font-medium text-[#8A8A8A]">
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        {/* Artist image */}
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-white/60 shrink-0 flex items-center justify-center mb-5">
                          {project.image_url ? (
                            <img
                              src={resolveArtworkUrl(project.image_url) || ''}
                              alt={project.artist_name || 'Artist'}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-[24px] font-medium text-[#C4C4C4]">
                              {(project.artist_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <h2 className="text-[22px] leading-tight font-medium text-[#1A1A1A] truncate">
                          {project.artist_name || 'Untitled'}
                        </h2>

                        {/* Genre */}
                        {project.concept?.genre_primary && (
                          <p className="text-[13px] text-[#8A8A8A] mt-1.5">
                            {toTitleCase(project.concept.genre_primary)}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-full px-4 py-1.5 group-hover:border-[#1A1A1A] transition-colors duration-150">
                          Open Project
                          <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
                        </span>
                      </div>
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
              <p className="text-[120px] leading-[0.85] font-medium text-neutral-100 -ml-1">00</p>
              <p className="t-display text-black mt-6">
                Start Something
              </p>
              <p className="text-body-lg text-neutral-500 mt-4 max-w-md">
                Every project begins with a concept. Create one and we&apos;ll help you build the research, prompts, and sound around it.
              </p>
              <ButtonV2 as="a" href="/projects/new" size="lg" className="mt-8">
                New Project
              </ButtonV2>
            </div>
          )}
        </div>
      </div>

      {/* Colophon */}
      <div className="border-t border-[#E8E8E8] shrink-0">
        <div className="max-w-[1400px] mx-auto px-10 py-4 flex items-center justify-between">
          <p className="text-micro font-mono text-neutral-300">IMC v0.1.0</p>
          <p className="text-micro font-mono text-neutral-300">Music Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
