'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — editorial branding */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-[#E8E8E8] flex-col justify-between p-16">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wide text-[#8A8A8A]">
            Instruments of Mass Creation
          </p>
        </div>

        <div>
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">
            IMC
          </p>
          <p className="text-body-lg text-black mt-6 max-w-md">
            AI-powered market research, prompt generation,
            and track analysis for the next generation of artists.
          </p>
        </div>

        <p className="text-micro font-mono text-neutral-300">
          v1.0 — 2026
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">
            Sign In
          </p>
          <p className="text-body text-neutral-500 mt-3">
            Enter your credentials to access your projects.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A] block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@label.com"
                className="w-full bg-white border border-[#E8E8E8] rounded-md px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-label font-semibold uppercase tracking-wide text-[#8A8A8A] block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E8E8E8] rounded-md px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-body-sm text-signal-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`
                w-full h-12 rounded-md text-label font-semibold uppercase tracking-wide
                transition-colors duration-150
                ${loading
                  ? 'bg-neutral-100 text-neutral-400 cursor-wait'
                  : 'bg-black text-white hover:bg-neutral-800'
                }
              `}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E8E8E8]">
            <p className="text-body-sm text-neutral-500">
              No account?{' '}
              <a href="/register" className="text-black font-bold hover:underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
