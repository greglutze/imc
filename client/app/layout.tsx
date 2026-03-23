import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMC - Instruments of Mass Creation',
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
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-black border-r border-gray-700 p-6 hidden lg:block overflow-y-auto">
            <nav className="space-y-4">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-8">
                Navigation
              </div>
              <div className="text-sm text-gray-400 hover:text-yellow-accent transition-colors cursor-pointer">
                Dashboard
              </div>
              <div className="text-sm text-gray-400 hover:text-yellow-accent transition-colors cursor-pointer">
                Projects
              </div>
              <div className="text-sm text-gray-400 hover:text-yellow-accent transition-colors cursor-pointer">
                Analysis
              </div>
              <div className="text-sm text-gray-400 hover:text-yellow-accent transition-colors cursor-pointer">
                Settings
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <header className="h-16 bg-black border-b border-gray-700 flex items-center px-8">
              <div className="text-lg font-mono text-yellow-accent tracking-wide">
                IMC
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 bg-white overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
