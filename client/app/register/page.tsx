'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

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
    <div className="min-h-screen bg-white flex">
      {/* Left — editorial branding */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-neutral-200 flex-col justify-between p-16">
        <div>
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
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

      {/* Right — register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="text-[40px] leading-[1.1] font-bold text-black tracking-tight">
            Create Account
          </p>
          <p className="text-body text-neutral-500 mt-3">
            Set up your label and start building artists.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-white border border-neutral-200 rounded-sm px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                Label / Org Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Instruments of Mass Creation"
                className="w-full bg-white border border-neutral-200 rounded-sm px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@label.com"
                className="w-full bg-white border border-neutral-200 rounded-sm px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-white border border-neutral-200 rounded-sm px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="text-body-sm text-signal-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !password || !orgName}
              className={`
                w-full h-12 rounded-sm text-label font-bold uppercase tracking-widest
                transition-colors duration-fast
                ${loading
                  ? 'bg-neutral-100 text-neutral-400 cursor-wait'
                  : 'bg-black text-white hover:bg-neutral-800'
                }
              `}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-body-sm text-neutral-500">
              Already have an account?{' '}
              <a href="/login" className="text-black font-bold hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
