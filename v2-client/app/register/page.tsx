'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [artistName, setArtistName] = useState('');
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
      // Register user
      const res = await api.register(email, name, password);
      login(res.token, res.user);

      // Create artist identity
      const artist = await api.createArtist(artistName || name);
      localStorage.setItem('v2_artist', JSON.stringify(artist));

      router.push('/archive');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-[360px] px-6">
        <div className="mb-10">
          <p className="text-label font-semibold tracking-widest text-neutral-400 uppercase mb-2">IMC V2</p>
          <h1 className="text-heading font-semibold text-black">Create account</h1>
          <p className="text-body text-neutral-500 mt-1">Start building your creative archive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label text-neutral-500 block mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-body border border-neutral-200 rounded-sm focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-label text-neutral-500 block mb-1.5">Artist name</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Leave blank to use your name"
              className="w-full px-3 py-2.5 text-body border border-neutral-200 rounded-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300"
            />
          </div>
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
              minLength={6}
            />
          </div>

          {error && <p className="text-small text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white text-small font-medium rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-small text-neutral-400 mt-6 text-center">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-black underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
