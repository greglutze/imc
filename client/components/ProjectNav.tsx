'use client';

/* eslint-disable @next/next/no-img-element */

type NavPage = 'home' | 'checklist' | 'concept' | 'interview' | 'moodboard' | 'research' | 'prompts' | 'lyrics' | 'share';

interface ProjectNavProps {
  projectId: string;
  artistName: string;
  imageUrl?: string | null;
  activePage: NavPage;
  onNavigate?: (page: NavPage) => void;
}

export default function ProjectNav({ projectId, artistName, imageUrl, activePage, onNavigate }: ProjectNavProps) {
  const links: Array<{ key: NavPage; label: string; href: string }> = [
    { key: 'interview', label: 'Concept', href: `/projects/${projectId}?tab=interview` },
    { key: 'moodboard', label: 'Audio Visuals', href: `/projects/${projectId}?tab=moodboard` },
    { key: 'research', label: 'Research', href: `/projects/${projectId}?tab=research` },
    { key: 'prompts', label: 'Sonic Engine', href: `/projects/${projectId}/prompts` },
    { key: 'lyrics', label: 'LyriCol', href: `/projects/${projectId}/lyrics` },
    { key: 'share', label: 'Tracks', href: `/projects/${projectId}/share` },
  ];

  return (
    <div className="border-b border-neutral-200">
      <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2"
          >
            <span className="text-body">&#8592;</span>
            IMC
          </a>
          <span className="text-neutral-200">/</span>
          <a
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity duration-fast"
          >
            {imageUrl && (
              <div className="w-6 h-6 rounded-sm overflow-hidden border border-neutral-200 shrink-0">
                <img src={imageUrl} alt={artistName} className="w-full h-full object-cover object-top" />
              </div>
            )}
            <span className="text-micro font-bold uppercase tracking-widest text-black">
              {artistName}
            </span>
          </a>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = activePage === link.key;
            const baseClass = `text-micro font-bold uppercase tracking-widest px-3 py-1 rounded-sm transition-colors duration-fast`;
            const activeClass = isActive ? 'text-black bg-neutral-100' : 'text-neutral-400 hover:text-black';

            // If onNavigate is provided and this is concept/research, use button for in-page nav
            if (onNavigate && (link.key === 'interview' || link.key === 'moodboard' || link.key === 'research')) {
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
