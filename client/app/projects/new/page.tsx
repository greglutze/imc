'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (api.isAuthenticated()) {
        const project = await api.createProject(artistName || undefined);
        router.push(`/projects/${project.id}`);
      } else {
        // Demo mode — go to demo project
        router.push('/projects/demo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center">
          <a href="/" className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2">
            <span className="text-body">&#8592;</span>
            IMC
          </a>
          <span className="text-neutral-200 mx-4">/</span>
          <span className="text-micro font-bold uppercase tracking-widest text-black">
            New Project
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        <div className="max-w-[1400px] mx-auto px-10 py-16 w-full">
          <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">
            00
          </p>
          <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
            New Project
          </p>
          <p className="text-body-lg text-black mt-5 max-w-md">
            Name your artist project. You can always change this later.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 max-w-md">
            <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
              Artist Name
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g. MMe., NOVA, Ghost Protocol"
              className="w-full bg-white border border-neutral-200 rounded-sm px-4 py-3 text-body text-black placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              autoFocus
            />
            <p className="text-caption text-neutral-400 mt-2">
              Optional — you can start without a name and define it during the concept interview.
            </p>

            {error && (
              <p className="text-body-sm text-signal-red mt-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                mt-6 h-12 px-8 rounded-sm text-label font-bold uppercase tracking-widest
                transition-colors duration-fast
                ${loading
                  ? 'bg-neutral-100 text-neutral-400 cursor-wait'
                  : 'bg-black text-white hover:bg-neutral-800'
                }
              `}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
