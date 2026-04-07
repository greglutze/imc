'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api, resolveArtworkUrl } from '../../../../lib/api';
import { ButtonV2, Badge } from '../../../../components/ui';
import type { Project, ProjectConcept, MoodboardImage, MoodboardBrief } from '../../../../lib/api';
import { extractPaletteFromImages, type ExtractedColor } from '../../../../lib/colorExtract';

/* eslint-disable @next/next/no-img-element */

export default function VisualEnginePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);
  const [moodboardBrief, setMoodboardBrief] = useState<MoodboardBrief | null>(null);
  const [palette, setPalette] = useState<ExtractedColor[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadData = async () => {
      try {
        const [proj, images] = await Promise.all([
          api.getProject(id),
          api.getMoodboardThumbnails(id).catch(() => []),
        ]);
        setProject(proj);
        setMoodboardImages(images);
        if (proj.concept) setConcept(proj.concept);
        if (proj.moodboard_brief) setMoodboardBrief(proj.moodboard_brief as MoodboardBrief);

        // Extract palette from moodboard images
        if (images.length > 0) {
          const colors = await extractPaletteFromImages(
            images.slice(0, 4).map((img: MoodboardImage) => img.image_data).filter(Boolean) as string[]
          );
          setPalette(colors);
        }
      } catch (err) {
        console.error('Failed to load visual engine data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, id]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(label);
      setTimeout(() => setCopiedPrompt(null), 1500);
    }).catch(() => {});
  }, []);

  const artistName = project?.artist_name || 'Untitled';

  /** Concept has real data (not just the DB default empty object) */
  const conceptReady = !!(concept && concept.genre_primary);

  // ── Build visual prompts from concept data ──
  const buildCoverPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    const genre = concept!.genre_primary;
    parts.push(`Album cover art for a ${genre} artist.`);
    if (concept!.mood_keywords?.length) parts.push(`Mood: ${concept!.mood_keywords.slice(0, 4).join(', ')}.`);
    if (concept!.reference_artists?.length) parts.push(`Influenced by ${concept!.reference_artists.slice(0, 2).join(' and ')}.`);
    if (concept!.creative_direction) parts.push(concept!.creative_direction + '.');
    parts.push('Cinematic, editorial quality, no text. --ar 1:1 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildPromoPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    const genre = concept!.genre_primary;
    parts.push(`Promotional photography for a ${genre} artist.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} atmosphere.`);
    parts.push('Fashion editorial style, dramatic lighting, strong composition. Environment matches the sonic world. --ar 4:5 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildTypePrompt = () => {
    if (!conceptReady) return '';
    const genre = concept!.genre_primary;
    const genreLower = genre.toLowerCase();
    const letterStyle = genreLower.includes('hip-hop') || genreLower.includes('rap')
      ? 'bold geometric'
      : genreLower.includes('electronic')
        ? 'futuristic minimal'
        : 'elegant serif';
    const parts: string[] = [];
    parts.push(`Typography design for a ${genre} artist logo.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} feeling.`);
    parts.push(`Custom lettering, ${letterStyle} style. Black on white, high contrast. --ar 3:1 --v 6.1 --style raw`);
    return parts.join(' ');
  };

  const buildBTSPrompt = () => {
    if (!conceptReady) return '';
    return 'Behind-the-scenes studio photography. Artist in creative flow. Warm tones, natural light, shallow depth of field. Candid, not posed. Film grain texture. --ar 16:9 --v 6.1 --style raw';
  };

  // ── Typography recommendations ──
  const getTypeRecommendations = () => {
    const genre = concept?.genre_primary?.toLowerCase() || '';
    if (genre.includes('hip-hop') || genre.includes('rap') || genre.includes('trap')) {
      return {
        primary: 'Druk Wide / Neue Haas Grotesk',
        secondary: 'Monument Extended',
        style: 'Bold, condensed, uppercase. High impact. Think Kanye-era DONDA minimalism.',
      };
    }
    if (genre.includes('electronic') || genre.includes('house') || genre.includes('techno')) {
      return {
        primary: 'Neue Montreal / Space Grotesk',
        secondary: 'JetBrains Mono',
        style: 'Clean geometric sans-serif. Monospaced accents. Technical precision.',
      };
    }
    if (genre.includes('r&b') || genre.includes('soul') || genre.includes('neo')) {
      return {
        primary: 'Canela / Freight Display',
        secondary: 'Söhne',
        style: 'Warm serif with modern proportions. Intimate, personal, editorial.',
      };
    }
    if (genre.includes('indie') || genre.includes('alternative') || genre.includes('folk')) {
      return {
        primary: 'GT Super / Editorial New',
        secondary: 'ABC Favorit',
        style: 'Expressive serif headlines with humanist sans body. Organic and approachable.',
      };
    }
    if (genre.includes('pop')) {
      return {
        primary: 'PP Neue Machina / Clash Display',
        secondary: 'General Sans',
        style: 'Contemporary display type. Bold but refined. Clean with character.',
      };
    }
    return {
      primary: 'Inter / Satoshi',
      secondary: 'Source Serif Pro',
      style: 'Versatile modern system. Clean, readable, adaptable across formats.',
    };
  };

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in h-full flex flex-col">
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 skel" />
              <span className="text-[#E8E8E8]">/</span>
              <div className="h-3 w-24 skel skel-delay-1" />
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto w-full px-10 pt-10">
          <div className="h-3 w-24 skel mb-4" />
          <div className="h-10 w-56 skel skel-delay-1 mb-4" />
          <div className="h-4 w-96 skel skel-delay-2" />
        </div>
      </div>
    );
  }

  if (!conceptReady) {
    return (
      <div className="content-reveal h-full flex flex-col">
        <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="visuals" />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-10 py-16 max-w-2xl">
            <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">
              Concept Not Ready
            </p>
            <p className="text-[16px] text-[#8A8A8A] mt-5 max-w-sm">
              Your artist concept needs to be defined before the Visual Engine can generate direction. This happens during project creation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const typeRecs = getTypeRecommendations();
  const coverPrompt = buildCoverPrompt();
  const promoPrompt = buildPromoPrompt();
  const typePrompt = buildTypePrompt();
  const btsPrompt = buildBTSPrompt();

  return (
    <div className="content-reveal h-full flex flex-col">
      <ProjectNav projectId={id} artistName={artistName} imageUrl={project?.image_url} activePage="visuals" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-10">
          {/* Header */}
          <div className="mb-12">
            <p className="text-[13px] font-medium text-[#C4C4C4] mb-2">
              Cover Art & Identity
            </p>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">
              Visual Engine
            </p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
              Album cover direction, typography, color palettes, and image prompts — built from your concept and moodboard.
            </p>
          </div>

          {/* ── Color Palette ── */}
          {palette.length > 0 && (
            <div className="mb-12 border-b border-[#E8E8E8] pb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                Color Palette
              </p>
              <div className="flex gap-3 mb-4">
                {palette.slice(0, 6).map((color, i) => (
                  <button
                    key={i}
                    onClick={() => copyToClipboard(color.hex, color.hex)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-20 h-20 rounded-lg border border-[#E8E8E8] group-hover:scale-105 transition-transform duration-150"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[11px] font-mono text-[#8A8A8A] group-hover:text-[#1A1A1A] transition-colors duration-150">
                      {copiedPrompt === color.hex ? '✓ Copied' : color.hex}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[#C4C4C4]">
                Extracted from your moodboard. Click to copy hex.
              </p>
            </div>
          )}

          {/* ── Typography ── */}
          <div className="mb-12 border-b border-[#E8E8E8] pb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
              Typography Direction
            </p>
            <div className="grid grid-cols-12 gap-x-8">
              <div className="col-span-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
                  Display / Headlines
                </p>
                <p className="text-[28px] leading-tight font-medium text-[#1A1A1A] mb-2">
                  {typeRecs.primary}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mt-5 mb-2">
                  Body / Captions
                </p>
                <p className="text-[20px] leading-tight font-medium text-[#1A1A1A]">
                  {typeRecs.secondary}
                </p>
              </div>
              <div className="col-span-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-3">
                  Direction
                </p>
                <p className="text-[16px] leading-[1.6] text-[#8A8A8A]">
                  {typeRecs.style}
                </p>
              </div>
            </div>
          </div>

          {/* ── Mood Reference ── */}
          {moodboardImages.length > 0 && (
            <div className="mb-12 border-b border-[#E8E8E8] pb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                Visual Moodboard
              </p>
              <div className="grid grid-cols-4 gap-3">
                {moodboardImages.slice(0, 8).map((img, i) => (
                  <div key={i} className="aspect-square overflow-hidden bg-[#F7F7F5]">
                    <img
                      src={img.image_data || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {moodboardBrief?.prose && (
                <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-2xl leading-relaxed">
                  {moodboardBrief.prose}
                </p>
              )}
            </div>
          )}

          {/* ── Image Prompts ── */}
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
              Image Prompts
            </p>
            <p className="text-[13px] text-[#8A8A8A] mb-6">
              Ready-to-use prompts for Midjourney, DALL-E, or Stable Diffusion. Built from your concept, mood, and influences.
            </p>

            <div className="space-y-4 stagger-enter">
              <PromptCard
                number="01"
                title="Album Cover"
                description="Square format, cinematic, no text overlay"
                prompt={coverPrompt}
                onCopy={copyToClipboard}
                copied={copiedPrompt === 'cover'}
                copyLabel="cover"
              />
              <PromptCard
                number="02"
                title="Promotional Photo"
                description="Portrait format for press kits and social"
                prompt={promoPrompt}
                onCopy={copyToClipboard}
                copied={copiedPrompt === 'promo'}
                copyLabel="promo"
              />
              <PromptCard
                number="03"
                title="Typography / Logotype"
                description="Custom lettering direction for artist identity"
                prompt={typePrompt}
                onCopy={copyToClipboard}
                copied={copiedPrompt === 'type'}
                copyLabel="type"
              />
              <PromptCard
                number="04"
                title="Behind the Scenes"
                description="Candid studio content for social channels"
                prompt={btsPrompt}
                onCopy={copyToClipboard}
                copied={copiedPrompt === 'bts'}
                copyLabel="bts"
              />
            </div>
          </div>

          {/* ── Mood Keywords ── */}
          {concept.mood_keywords && concept.mood_keywords.length > 0 && (
            <div className="mb-12 border-t border-[#E8E8E8] pt-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">
                Mood Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {concept.mood_keywords.map((kw, i) => (
                  <Badge key={i}>{kw}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ———————— Prompt Card Component ———————— */

function PromptCard({
  number,
  title,
  description,
  prompt,
  onCopy,
  copied,
  copyLabel,
}: {
  number: string;
  title: string;
  description: string;
  prompt: string;
  onCopy: (text: string, label: string) => void;
  copied: boolean;
  copyLabel: string;
}) {
  return (
    <div className="bg-[#F7F7F5] p-7">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-mono text-[#C4C4C4]">{number}</span>
            <h3 className="text-[18px] font-medium text-[#1A1A1A]">{title}</h3>
          </div>
          <p className="text-[13px] text-[#8A8A8A]">{description}</p>
        </div>
        <Badge
          variant="action"
          copyText={prompt}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </Badge>
      </div>
      <div className="bg-[#EEEDEB] p-4 rounded">
        <p className="text-[13px] font-mono text-[#1A1A1A] leading-relaxed break-words">
          {prompt}
        </p>
      </div>
    </div>
  );
}
