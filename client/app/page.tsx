'use client';

import { useState, useEffect, useRef } from 'react';
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
          <p className="text-[120px] leading-[0.85] font-medium text-[#E8E8E8] animate-pulse-subtle">IMC</p>
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C4C4C4] animate-pulse-subtle" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C4C4C4] animate-pulse-subtle" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C4C4C4] animate-pulse-subtle" style={{ animationDelay: '0.6s' }} />
          </div>
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
          <p className="text-[120px] leading-[0.85] font-medium text-[#E8E8E8] -ml-1">IMC</p>
          <p className="text-[40px] leading-[1.1] font-medium tracking-tight text-black mt-6 max-w-xl">
            Your creative intelligence engine
          </p>
          <p className="text-[16px] text-[#8A8A8A] mt-6 max-w-md">
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
            <p className="text-[11px] font-mono text-[#C4C4C4]">IMC v0.1.0</p>
            <p className="text-[11px] font-mono text-[#C4C4C4]">Music Intelligence Platform</p>
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
            <p className="text-[11px] font-mono text-[#C4C4C4]">
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
                  <div className="h-3 w-16 bg-[#F7F7F5] animate-pulse mb-3" />
                  <div className="h-14 w-16 bg-[#F7F7F5] animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-[#F7F7F5] animate-pulse" />
              </div>
              <div className="border-t border-[#E8E8E8]">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 py-6 border-b border-[#E8E8E8]">
                    <div className="w-16 h-16 bg-[#F7F7F5] animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-[#F7F7F5] animate-pulse mb-2" />
                      <div className="h-3 w-64 bg-[#F7F7F5] animate-pulse mb-2" />
                      <div className="h-2 w-24 bg-[#F7F7F5] animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-[#F7F7F5] animate-pulse" />
                    <div className="h-4 w-20 bg-[#F7F7F5] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length > 0 ? (
            <>
              {/* Header row */}
              <div className="flex items-end justify-between pt-16 pb-10">
                <div>
                  <h1 className="text-[40px] leading-[1.1] font-medium tracking-tight-sm text-black">
                    My Projects
                  </h1>
                </div>
                <ButtonV2 as="a" href="/projects/new">
                  + New Project
                </ButtonV2>
              </div>

              {/* Project cards — stacked full-width */}
              <div className="space-y-3 stagger-enter">
                {projects.map((project, index) => {
                  const statusLabel = project.status === 'draft' ? 'Draft' : project.status === 'complete' ? 'Complete' : 'In Progress';
                  const statusColor = project.status === 'complete' ? 'green' : project.status === 'draft' ? 'neutral' : 'yellow';
                  const projectCode = `(IMC\u00AE \u2014 ${String(index + 1).padStart(2, '0')}${(project.artist_name || 'U').charAt(0).toUpperCase()})`;

                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      projectCode={projectCode}
                      statusLabel={statusLabel}
                      statusColor={statusColor}
                      projects={projects}
                      setProjects={setProjects}
                    />
                  );
                })}
              </div>

              {/* Bottom spacer */}
              <div className="h-16" />
            </>
          ) : (
            /* No projects yet */
            <div className="py-32">
              <p className="text-[120px] leading-[0.85] font-medium text-[#E8E8E8] -ml-1">00</p>
              <p className="text-[40px] leading-[1.1] font-medium tracking-tight text-black mt-6">
                Start Something
              </p>
              <p className="text-[16px] text-[#8A8A8A] mt-4 max-w-md">
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
          <p className="text-[11px] font-mono text-[#C4C4C4]">IMC v0.1.0</p>
          <p className="text-[11px] font-mono text-[#C4C4C4]">Music Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}

/* ———————— Project Card with Menu ———————— */

interface ProjectCardProps {
  project: Project;
  projectCode: string;
  statusLabel: string;
  statusColor: string;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

function ProjectCard({ project, projectCode, statusLabel, statusColor, projects, setProjects }: ProjectCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await api.deleteProject(project.id);
      setProjects(projects.filter(p => p.id !== project.id));
      setMenuOpen(false);
      setConfirmingDelete(false);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="group bg-[#F7F7F5] hover:bg-[#F0F0ED] card-hover flex items-center gap-6 px-7 py-6">
      {/* Artwork thumbnail */}
      <a href={`/projects/${project.id}`} className="w-16 h-16 overflow-hidden bg-[#EEEDEB] shrink-0 block">
        {project.image_url ? (
          <img
            src={resolveArtworkUrl(project.image_url) || ''}
            alt={project.artist_name || 'Artist'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[24px] font-medium text-[#D4D4D0]">
              {(project.artist_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </a>

      {/* Info */}
      <a href={`/projects/${project.id}`} className="flex-1 min-w-0 block">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[11px] font-medium text-[#C4C4C4]">
            {projectCode}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              statusColor === 'green' ? 'bg-green-500' :
              statusColor === 'yellow' ? 'bg-signal-yellow' :
              'bg-[#C4C4C4]'
            }`} />
            <span className="text-[11px] font-medium text-[#8A8A8A]">
              {statusLabel}
            </span>
          </div>
        </div>
        <h2 className="text-[22px] leading-tight font-medium text-[#1A1A1A] truncate">
          {project.artist_name || 'Untitled'}
        </h2>
      </a>

      {/* Menu button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label={`Options for ${project.artist_name || 'project'}`}
          aria-expanded={menuOpen}
          className="text-[20px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 shrink-0 px-2 py-1 -mx-2"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white border border-[#E8E8E8] z-50 min-w-[220px]">
            {confirmingDelete ? (
              <div className="px-4 py-3">
                <p className="text-[13px] font-medium text-[#1A1A1A] mb-1">
                  Delete {project.artist_name || 'this project'}?
                </p>
                <p className="text-[11px] text-[#8A8A8A] mb-3">This can&apos;t be undone.</p>
                <div className="flex items-center gap-2">
                  <ButtonV2
                    size="sm"
                    className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700 text-[12px]"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    Delete
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    className="text-[12px]"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setConfirmingDelete(false);
                    }}
                  >
                    Cancel
                  </ButtonV2>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                className="block w-full text-left px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                Delete Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <a
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-full px-4 py-1.5 group-hover:border-[#1A1A1A] transition-colors duration-150 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        Open Project
        <span className="text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-colors duration-150">&rarr;</span>
      </a>
    </div>
  );
}
