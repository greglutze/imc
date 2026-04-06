'use client';

/* eslint-disable @next/next/no-img-element */

import { resolveArtworkUrl } from '../lib/api';

type NavPage = 'home' | 'checklist' | 'moodboard' | 'research' | 'prompts' | 'lyrics' | 'share';

interface ProjectNavProps {
  projectId: string;
  artistName: string;
  imageUrl?: string | null;
  activePage: NavPage;
  onNavigate?: (page: NavPage) => void;
}

export default function ProjectNav({ projectId, artistName, imageUrl, activePage, onNavigate }: ProjectNavProps) {
  const links: Array<{ key: NavPage; label: string; href: string }> = [
    { key: 'research', label: 'Research', href: `/projects/${projectId}?tab=research` },
    { key: 'prompts', label: 'Sonic Engine', href: `/projects/${projectId}/prompts` },
    { key: 'lyrics', label: 'Lyrics', href: `/projects/${projectId}/lyrics` },
    { key: 'share', label: 'Tracks', href: `/projects/${projectId}/share` },
  ];

  return (
    <div className="border-b border-[#E8E8E8]">
      <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 flex items-center gap-2"
          >
            <span className="text-body">&#8592;</span>
            IMC
          </a>
          <span className="text-[#E8E8E8]">/</span>
          <a
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity duration-fast"
          >
            {imageUrl && (
              <div className="w-6 h-6 overflow-hidden border border-[#E8E8E8] shrink-0">
                <img src={resolveArtworkUrl(imageUrl) || ''} alt={artistName} className="w-full h-full object-cover object-top" />
              </div>
            )}
            <span className="text-micro font-semibold uppercase tracking-wide text-black">
              {artistName}
            </span>
          </a>
        </div>
        <nav className="flex items-center gap-3">
          {links.map((link) => {
            const isActive = activePage === link.key;
            const baseClass = `text-micro font-semibold uppercase tracking-wide px-3 py-3 transition-colors duration-150`;
            const activeClass = isActive ? 'text-black border-b-2 border-black -mb-px' : 'text-[#8A8A8A] hover:text-[#1A1A1A]';

            // If onNavigate is provided and this is research, use button for in-page nav
            if (onNavigate && link.key === 'research') {
              return (
                <button
                  key={link.key}
                  onClick={() => onNavigate(link.key)}
                  className={`${baseClass} ${activeClass}`}
                >
                  {link.label}
                </button>
              );
            }

            return (
              <a
                key={link.key}
                href={link.href}
                className={`${baseClass} ${activeClass}`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
