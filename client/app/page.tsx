'use client';

import { useState, useEffect } from 'react';
import { Badge, Signal } from '../components/ui';
import { useAuth } from '../lib/auth-context';
import { api, type Project } from '../lib/api';

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
              <a
                href="/login"
                className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 py-32">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">IMC</p>
          <p className="text-[48px] leading-[1.1] font-bold text-black mt-6 tracking-tight max-w-xl">
            AI-powered market research &amp; prompt generation for artists
          </p>
          <p className="text-body-lg text-neutral-500 mt-6 max-w-md">
            Define your concept. Run research. Generate Suno &amp; Udio prompts.
            All powered by real market intelligence.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <a
              href="/register"
              className="bg-black text-white text-label font-bold uppercase tracking-widest h-12 px-8 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
            >
              Create Account
            </a>
            <a
              href="/login"
              className="bg-white text-black border border-neutral-200 text-label font-bold uppercase tracking-widest h-12 px-8 rounded-sm hover:border-black transition-colors duration-fast inline-flex items-center"
            >
              Sign In
            </a>
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

  const activeProject = projects.length > 0 ? projects[0] : null;

  return (
    <div className="animate-fade-in">
      {/* Masthead */}
      <div className="border-b border-neutral-200">
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

      <div className="max-w-[1400px] mx-auto px-10">

        {loadingProjects ? (
          <div className="py-32 text-center">
            <p className="text-[120px] leading-[0.85] font-bold text-neutral-100">...</p>
            <p className="text-body text-neutral-400 mt-4">Loading projects</p>
          </div>
        ) : activeProject ? (
          <>
            {/* Hero — active project */}
            <div className="py-16 border-b border-neutral-200">
              <div className="flex items-center gap-3 mb-6">
                <Signal color="green" />
                <Badge variant="green">Active Project</Badge>
              </div>
              <a href={`/projects/${activeProject.id}`} className="block hover:opacity-80 transition-opacity duration-fast">
                <h1 className="text-[120px] leading-[0.9] font-bold tracking-tight text-black -ml-1">
                  {activeProject.artist_name || 'Untitled'}
                </h1>
              </a>
              <p className="text-body-lg text-neutral-500 mt-8 max-w-md">
                {activeProject.concept?.creative_direction || 'No concept defined yet. Start the concept interview to begin.'}
              </p>
            </div>

            {/* Pipeline status */}
            <div className="grid grid-cols-12 gap-x-6 border-b border-neutral-200">
              <div className="col-span-4 py-10 border-r border-neutral-200 pr-6">
                <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
                  Pipeline
                </p>
                <div className="space-y-6">
                  <InstrumentRow
                    number="01"
                    name="Market Research"
                    status={activeProject.status === 'draft' ? 'Pending' : 'Complete'}
                    statusColor={activeProject.status === 'draft' ? 'neutral' : 'green'}
                  />
                  <InstrumentRow
                    number="02"
                    name="Prompt Generation"
                    status={activeProject.status === 'prompting' ? 'Complete' : activeProject.status === 'research' ? 'Ready' : 'Pending'}
                    statusColor={activeProject.status === 'prompting' ? 'green' : activeProject.status === 'research' ? 'yellow' : 'neutral'}
                  />
                  <InstrumentRow
                    number="03"
                    name="Track Analysis"
                    status="On Hold"
                    statusColor="neutral"
                  />
                </div>
              </div>

              {/* Concept excerpt */}
              <div className="col-span-4 py-10 border-r border-neutral-200 pr-6">
                <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
                  Artist Concept
                </p>
                {activeProject.concept?.genre_primary ? (
                  <>
                    <blockquote className="text-heading font-bold text-black leading-tight">
                      &ldquo;{activeProject.concept.creative_direction?.slice(0, 80)}...&rdquo;
                    </blockquote>
                    <div className="mt-8 space-y-3">
                      <DetailRow label="Genre" value={activeProject.concept.genre_primary} />
                      <DetailRow label="Influences" value={activeProject.concept.reference_artists?.slice(0, 3).join(', ') || '—'} />
                      <DetailRow label="Mood" value={activeProject.concept.mood_keywords?.slice(0, 3).join(', ') || '—'} />
                    </div>
                  </>
                ) : (
                  <p className="text-body text-neutral-400">Not defined yet</p>
                )}
              </div>

              {/* Status */}
              <div className="col-span-4 py-10">
                <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
                  Status
                </p>
                <p className="text-heading font-bold text-black capitalize">{activeProject.status}</p>
                <p className="text-body-sm text-neutral-400 mt-2">
                  Created {new Date(activeProject.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Bottom strip */}
            <div className="grid grid-cols-12 gap-x-6 py-16">
              <div className="col-span-3">
                <p className="text-[96px] leading-none font-bold text-black">
                  {String(projects.length).padStart(2, '0')}
                </p>
                <p className="text-body-sm text-neutral-400 mt-2">
                  {projects.length === 1 ? 'Active project' : 'Projects'}
                </p>
              </div>
              <div className="col-span-6" />
              <div className="col-span-3 flex flex-col justify-end">
                <div className="flex items-center gap-3">
                  <a
                    href={`/projects/${activeProject.id}`}
                    className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
                  >
                    Open Project
                  </a>
                  <a
                    href="/projects/new"
                    className="bg-white text-black border border-neutral-200 text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:border-black transition-colors duration-fast inline-flex items-center"
                  >
                    New Project
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No projects yet */
          <div className="py-32">
            <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">00</p>
            <p className="text-[48px] leading-[1.1] font-bold text-black mt-6 tracking-tight">
              No Projects Yet
            </p>
            <p className="text-body-lg text-neutral-500 mt-4 max-w-md">
              Create your first project to start defining an artist concept and running market research.
            </p>
            <a
              href="/projects/new"
              className="mt-8 bg-black text-white text-label font-bold uppercase tracking-widest h-12 px-8 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
            >
              New Project
            </a>
          </div>
        )}
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

/* ———————— Editorial Components ———————— */

function InstrumentRow({ number, name, status, statusColor }: {
  number: string;
  name: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'red' | 'neutral';
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-heading font-bold text-neutral-200 font-mono">{number}</span>
      <div className="flex-1 pt-1">
        <p className="text-body font-bold text-black">{name}</p>
        <div className="mt-1">
          <Signal color={statusColor} label={status} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
      <span className="text-caption text-neutral-400">{label}</span>
      <span className="text-body-sm text-black font-bold">{value}</span>
    </div>
  );
}
