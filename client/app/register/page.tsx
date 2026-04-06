'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

/* eslint-disable @next/next/no-img-element */

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !orgName) return;

    setLoading(true);
    setError('');

    try {
      await register({ email, password, name, org_name: orgName });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Full-bleed background image */}
      <img
        src="/images/auth-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Branding — top left */}
      <div className="absolute top-0 left-0 p-10 z-10">
        <p className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
          Instruments of Mass Creation
        </p>
      </div>

      {/* Version — bottom left */}
      <div className="absolute bottom-0 left-0 p-10 z-10">
        <p className="text-[11px] font-mono text-white/30">
          v1.0 — 2026
        </p>
      </div>

      {/* Form card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <div className="bg-white/95 backdrop-blur-xl px-10 py-12 shadow-2xl">
          <p className="text-[32px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
            Create Account
          </p>
          <p className="text-[14px] text-[#8A8A8A] mt-3 leading-relaxed">
            Set up your label and start building artists.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide block mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-[#F7F7F5] border-none px-4 py-3 text-[14px] text-[#1A1A1A] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide block mb-2">
                Label / Org Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Instruments of Mass Creation"
                className="w-full bg-[#F7F7F5] border-none px-4 py-3 text-[14px] text-[#1A1A1A] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@label.com"
                className="w-full bg-[#F7F7F5] border-none px-4 py-3 text-[14px] text-[#1A1A1A] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-[#F7F7F5] border-none px-4 py-3 text-[14px] text-[#1A1A1A] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !password || !orgName}
              className={`
                w-full h-12 rounded-full text-[13px] font-medium tracking-wide
                transition-all duration-200
                ${loading
                  ? 'bg-[#E8E8E8] text-[#C4C4C4] cursor-wait'
                  : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                }
              `}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E8E8E8]">
            <p className="text-[13px] text-[#8A8A8A]">
              Already have an account?{' '}
              <a href="/login" className="text-[#1A1A1A] font-medium hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
