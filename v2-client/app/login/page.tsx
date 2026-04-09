'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      login(res.token, res.user);
      router.push('/archive');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-[360px] px-6">
        <div className="mb-10">
          <p className="text-label font-semibold tracking-widest text-neutral-400 uppercase mb-2">IMC V2</p>
          <h1 className="text-heading font-semibold text-black">Sign in</h1>
          <p className="text-body text-neutral-500 mt-1">Creative Intelligence & Archive</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label text-neutral-500 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-body border border-neutral-200 rounded-sm focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-label text-neutral-500 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-body border border-neutral-200 rounded-sm focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {error && <p className="text-small text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white text-small font-medium rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-small text-neutral-400 mt-6 text-center">
          No account?{' '}
          <button onClick={() => router.push('/register')} className="text-black underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
