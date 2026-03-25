import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMC — Instruments of Mass Creation',
  description: 'Music Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-56 bg-surface-primary border-r border-neutral-800 flex flex-col hidden lg:flex">
            {/* Logo */}
            <div className="h-14 flex items-center px-6 border-b border-neutral-800">
              <span className="text-heading-sm font-bold tracking-tight">IMC</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              <NavItem label="Dashboard" active />
              <NavItem label="Projects" />
              <NavItem label="Research" />
              <NavItem label="Prompts" />
              <NavItem label="Settings" />
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-800">
              <p className="text-micro font-mono text-neutral-600">v0.1.0</p>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <header className="h-14 bg-surface-primary border-b border-neutral-800 flex items-center justify-between px-8 shrink-0">
              <div />
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700" />
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 bg-surface-secondary overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={`
        flex items-center h-9 px-3 rounded-sm text-body-sm cursor-pointer
        transition-colors duration-fast
        ${active
          ? 'bg-neutral-800 text-white font-bold'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
        }
      `}
    >
      {label}
    </div>
  );
}
