import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
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
      <body className="bg-white text-neutral-900 font-sans">
        <AuthProvider>
          <div className="flex h-screen">
            {/* Sidebar — slim, editorial */}
            <aside className="w-14 bg-white border-r border-neutral-200 flex flex-col items-center hidden lg:flex">
              {/* Logo */}
              <div className="h-14 flex items-center justify-center border-b border-neutral-200 w-full">
                <span className="text-label font-bold tracking-tight text-black">I</span>
              </div>

              {/* Nav icons — vertical, minimal */}
              <nav className="flex-1 flex flex-col items-center py-6 gap-6">
                <NavDot active label="D" />
                <NavDot label="P" />
                <NavDot label="R" />
                <NavDot label="G" />
              </nav>

              {/* Footer */}
              <div className="py-4">
                <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200" />
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

function NavDot({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        text-micro font-bold cursor-pointer transition-all duration-fast
        ${active
          ? 'bg-black text-white'
          : 'text-neutral-400 hover:text-black hover:bg-neutral-100'
        }
      `}
    >
      {label}
    </div>
  );
}
