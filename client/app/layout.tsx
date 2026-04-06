import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
import AIAssistantWrapper from '../components/AIAssistantWrapper';
import './globals.css';
import './theme-open.css';

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
    <html lang="en" className="theme-open">
      <body className="bg-white text-[#1A1A1A] font-sans">
        <AuthProvider>
          <div className="flex h-screen">
            {/* Sidebar — slim, editorial */}
            <aside className="w-14 bg-white border-r border-[#E8E8E8] flex flex-col items-center hidden lg:flex">
              {/* Logo */}
              <div className="h-14 flex items-center justify-center border-b border-[#E8E8E8] w-full">
                <span className="text-[13px] font-semibold tracking-tight text-black">I</span>
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
                <div className="w-6 h-6 rounded-full bg-[#F7F7F5] border border-[#E8E8E8]" /> {/* Keep rounded-full for circular avatar */}
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            <AIAssistantWrapper />
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
        text-[11px] font-medium cursor-pointer transition-all duration-150
        ${active
          ? 'bg-[#1A1A1A] text-white'
          : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
        }
      `}
    >
      {label}
    </div>
  );
}
