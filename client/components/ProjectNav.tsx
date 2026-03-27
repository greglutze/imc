'use client';

type NavPage = 'checklist' | 'concept' | 'research' | 'prompts';

interface ProjectNavProps {
  projectId: string;
  artistName: string;
  activePage: NavPage;
  onNavigate?: (page: NavPage) => void;
}

export default function ProjectNav({ projectId, artistName, activePage, onNavigate }: ProjectNavProps) {
  const links: Array<{ key: NavPage; label: string; href: string }> = [
    { key: 'checklist', label: 'Checklist', href: `/projects/${projectId}/checklist` },
    { key: 'concept', label: 'Concept', href: `/projects/${projectId}` },
    { key: 'research', label: 'Research', href: `/projects/${projectId}` },
    { key: 'prompts', label: 'Prompts', href: `/projects/${projectId}/prompts` },
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
          <span className="text-micro font-bold uppercase tracking-widest text-black">
            {artistName}
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = activePage === link.key;
            const baseClass = `text-label font-bold uppercase tracking-widest px-3 py-1 rounded-sm transition-colors duration-fast`;
            const activeClass = isActive ? 'text-black bg-neutral-100' : 'text-neutral-400 hover:text-black';

            // If onNavigate is provided and this is concept/research, use button for in-page nav
            if (onNavigate && (link.key === 'concept' || link.key === 'research')) {
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
