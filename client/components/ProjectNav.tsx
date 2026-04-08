'use client';

/* eslint-disable @next/next/no-img-element */

import { resolveArtworkUrl } from '../lib/api';

type NavPage = 'home' | 'research' | 'prompts' | 'lyrics' | 'moodboard' | 'visuals' | 'share'; // moodboard accessible from artist page, not top nav

interface ProjectNavProps {
  projectId: string;
  artistName: string;
  imageUrl?: string | null;
  activePage: NavPage;
}

export default function ProjectNav({ projectId, artistName, imageUrl, activePage }: ProjectNavProps) {
  const links: Array<{ key: NavPage; label: string; href: string }> = [
    { key: 'prompts', label: 'Sounds', href: `/projects/${projectId}/prompts` },
    { key: 'lyrics', label: 'Lyrics', href: `/projects/${projectId}/lyrics` },
    { key: 'share', label: 'Share', href: `/projects/${projectId}/share` },
  ];

  const researchLink = { key: 'research' as NavPage, label: 'Full Research Report', href: `/projects/${projectId}/research` };

  return (
    <div className="border-b border-[#E8E8E8]">
      <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 flex items-center gap-2"
          >
            <span className="text-[14px]">&#8592;</span>
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
            <span className="text-[11px] font-semibold uppercase tracking-wide text-black">
              {artistName}
            </span>
          </a>
        </div>
        <nav className="flex items-center gap-3" aria-label="Project sections">
          {links.map((link) => {
            const isActive = activePage === link.key;
            const baseClass = `text-[11px] font-semibold uppercase tracking-wide px-3 py-3 transition-colors duration-150`;
            const activeClass = isActive ? 'text-black border-b-2 border-black -mb-px' : 'text-[#8A8A8A] hover:text-[#1A1A1A]';

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

          {/* Research — separated with pill treatment */}
          <a
            href={researchLink.href}
            className={`text-[11px] font-semibold uppercase tracking-wide px-4 py-1.5 rounded-full border transition-colors duration-150 ml-1 ${
              activePage === 'research'
                ? 'bg-black text-white border-black'
                : 'bg-[#F7F7F5] text-[#8A8A8A] border-[#E8E8E8] hover:text-[#1A1A1A] hover:border-[#1A1A1A]'
            }`}
          >
            {researchLink.label}
          </a>
        </nav>
      </div>
    </div>
  );
}
