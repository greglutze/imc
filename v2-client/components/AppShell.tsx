'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const navItems = [
  { label: 'Archive', path: '/archive', icon: 'A' },
  { label: 'Projects', path: '/projects', icon: 'P' },
  { label: 'Reflections', path: '/reflections', icon: 'R' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-[200px] bg-surface-secondary border-r border-neutral-200 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-neutral-200">
          <span className="text-label font-semibold tracking-widest text-neutral-400 uppercase">IMC V2</span>
        </div>

        {/* Artist name */}
        <div className="px-5 py-4 border-b border-neutral-200">
          <p className="text-small font-medium text-black truncate">
            {(() => {
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('v2_artist');
                if (stored) {
                  try { return JSON.parse(stored).name; } catch { /* */ }
                }
              }
              return user.name;
            })()}
          </p>
          <p className="text-caption text-neutral-400">Creative Archive</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full text-left px-5 py-2.5 text-small transition-colors ${
                  isActive
                    ? 'text-black font-medium bg-neutral-100'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-neutral-200 px-5 py-3">
          <p className="text-caption text-neutral-400 truncate">{user.email}</p>
          <button
            onClick={logout}
            className="text-caption text-neutral-400 hover:text-black mt-1 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
