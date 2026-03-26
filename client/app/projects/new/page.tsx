'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

/* eslint-disable @next/next/no-img-element */

export default function NewProjectPage() {
  const router = useRouter();
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (api.isAuthenticated()) {
        const project = await api.createProject(artistName || undefined);
        // TODO: upload imageFile to storage when backend supports it
        router.push(`/projects/${project.id}`);
      } else {
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
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-10 py-16">
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
            {/* Artist Name */}
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

            {/* Artist Image */}
            <div className="mt-6">
              <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                Artist Image <span className="text-neutral-300 font-normal normal-case tracking-normal">(optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {imagePreview ? (
                <div className="flex items-start gap-4">
                  <div className="relative group w-20 h-20 shrink-0">
                    <div className="w-20 h-20 overflow-hidden rounded-sm border border-neutral-200">
                      <img
                        src={imagePreview}
                        alt={artistName || 'Artist portrait'}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-fast rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-white text-[18px] leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  <div className="pt-1">
                    {imageFile && (
                      <p className="text-body-sm text-black font-bold truncate max-w-[240px]">
                        {imageFile.name}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-caption text-neutral-400 hover:text-black transition-colors duration-fast mt-0.5"
                    >
                      Replace image
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border border-dashed border-neutral-200 rounded-sm px-4 py-3 w-full hover:border-neutral-400 transition-colors duration-fast group"
                >
                  <div className="w-10 h-10 rounded-sm bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-100 transition-colors duration-fast shrink-0">
                    <span className="text-[18px] text-neutral-300 leading-none">+</span>
                  </div>
                  <div className="text-left">
                    <p className="text-body-sm text-neutral-400 group-hover:text-black transition-colors duration-fast">
                      Upload image
                    </p>
                    <p className="text-caption text-neutral-300">
                      JPG, PNG, or WebP
                    </p>
                  </div>
                </button>
              )}
            </div>

            {error && (
              <p className="text-body-sm text-signal-red mt-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                mt-8 h-12 px-8 rounded-sm text-label font-bold uppercase tracking-widest
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
