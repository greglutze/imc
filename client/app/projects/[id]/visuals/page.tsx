'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import { Badge } from '../../../../components/ui';
import type { Project, ProjectConcept, MoodboardImage, MoodboardBrief } from '../../../../lib/api';
import { extractPaletteFromImages, type ExtractedColor } from '../../../../lib/colorExtract';
import { matchMovements, type MatchedMovement } from '../../../../lib/artMovements';

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

  // ── Match art movements from concept ──
  const matched: MatchedMovement[] = useMemo(() => {
    if (!conceptReady) return [];
    return matchMovements(concept!, 3);
  }, [concept, conceptReady]);

  const primaryMovement = matched[0]?.movement ?? null;
  const secondaryMovement = matched[1]?.movement ?? null;

  // ── Typography: movement-influenced ──
  const getTypeRecommendations = () => {
    if (primaryMovement) {
      return {
        display: primaryMovement.typeFamilies.display,
        body: primaryMovement.typeFamilies.body,
        direction: primaryMovement.typeFamilies.direction,
        source: primaryMovement.name,
      };
    }
    // Fallback to genre-based if no movement matched
    const genre = concept?.genre_primary?.toLowerCase() || '';
    if (genre.includes('hip-hop') || genre.includes('rap') || genre.includes('trap')) {
      return { display: 'Druk Wide / Neue Haas Grotesk', body: 'Monument Extended', direction: 'Bold, condensed, uppercase. High impact.', source: null };
    }
    if (genre.includes('electronic') || genre.includes('house') || genre.includes('techno')) {
      return { display: 'Neue Montreal / Space Grotesk', body: 'JetBrains Mono', direction: 'Clean geometric sans-serif. Monospaced accents. Technical precision.', source: null };
    }
    if (genre.includes('r&b') || genre.includes('soul') || genre.includes('neo')) {
      return { display: 'Canela / Freight Display', body: 'Söhne', direction: 'Warm serif with modern proportions. Intimate, personal, editorial.', source: null };
    }
    if (genre.includes('indie') || genre.includes('alternative') || genre.includes('folk')) {
      return { display: 'GT Super / Editorial New', body: 'ABC Favorit', direction: 'Expressive serif headlines with humanist sans body. Organic and approachable.', source: null };
    }
    if (genre.includes('pop')) {
      return { display: 'PP Neue Machina / Clash Display', body: 'General Sans', direction: 'Contemporary display type. Bold but refined. Clean with character.', source: null };
    }
    return { display: 'Inter / Satoshi', body: 'Source Serif Pro', direction: 'Versatile modern system. Clean, readable, adaptable across formats.', source: null };
  };

  // ── Build prompts with movement influence ──
  const movementPromptLayer = primaryMovement?.promptFragment || '';

  const buildCoverPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    const genre = concept!.genre_primary;
    parts.push(`Album cover art for a ${genre} artist.`);
    if (concept!.mood_keywords?.length) parts.push(`Mood: ${concept!.mood_keywords.slice(0, 4).join(', ')}.`);
    if (concept!.reference_artists?.length) parts.push(`Influenced by ${concept!.reference_artists.slice(0, 2).join(' and ')}.`);
    if (concept!.creative_direction) parts.push(concept!.creative_direction + '.');
    if (movementPromptLayer) parts.push(`Visual style: ${movementPromptLayer}.`);
    parts.push('Cinematic, editorial quality, no text. --ar 1:1 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildPromoPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    const genre = concept!.genre_primary;
    parts.push(`Promotional photography for a ${genre} artist.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} atmosphere.`);
    if (secondaryMovement) parts.push(`Visual references: ${secondaryMovement.promptFragment}.`);
    parts.push('Fashion editorial style, dramatic lighting, strong composition. Environment matches the sonic world. --ar 4:5 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildTypePrompt = () => {
    if (!conceptReady) return '';
    const genre = concept!.genre_primary;
    const typeStyle = primaryMovement
      ? primaryMovement.typeFamilies.direction.split('.')[0]
      : 'Custom lettering';
    const parts: string[] = [];
    parts.push(`Typography design for a ${genre} artist logo.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} feeling.`);
    parts.push(`${typeStyle}.`);
    if (movementPromptLayer) parts.push(`Inspired by ${primaryMovement!.name} design movement.`);
    parts.push('Black on white, high contrast. --ar 3:1 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildBTSPrompt = () => {
    if (!conceptReady) return '';
    const colorHint = primaryMovement?.colorDirection
      ? `Color direction: ${primaryMovement.colorDirection.split('.')[0].toLowerCase()}.`
      : 'Warm tones, natural light.';
    return `Behind-the-scenes studio photography. Artist in creative flow. ${colorHint} Shallow depth of field. Candid, not posed. Film grain texture. --ar 16:9 --v 6.1 --style raw`;
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
              Album cover direction, typography, color palettes, and image prompts — built from your concept, moodboard, and matched art movements.
            </p>
          </div>

          {/* ── Art Direction ── */}
          {matched.length > 0 && (
            <div className="mb-12 border-b border-[#E8E8E8] pb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                Art Direction
              </p>
              <p className="text-[13px] text-[#8A8A8A] mb-6">
                Matched from your genre, mood, and creative direction. These movements shape everything below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {matched.map(({ movement, matchReasons }, i) => (
                  <div key={movement.id} className="bg-[#F7F7F5] p-6 card-hover" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-mono text-[#C4C4C4]">{String(i + 1).padStart(2, '0')}</span>
                      <Badge variant={i === 0 ? 'green' : 'default'}>
                        {movement.category}
                      </Badge>
                    </div>
                    <h3 className="text-[18px] font-medium text-[#1A1A1A] leading-tight mb-1">
                      {movement.name}
                    </h3>
                    <p className="text-[12px] text-[#C4C4C4] mb-3">{movement.era}</p>
                    <p className="text-[14px] text-[#8A8A8A] leading-relaxed mb-4">
                      {movement.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {movement.keywords.map((kw, ki) => (
                        <span key={ki} className="text-[11px] px-2 py-0.5 bg-[#EEEDEB] text-[#8A8A8A] rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                    {matchReasons.length > 0 && (
                      <p className="text-[11px] text-[#C4C4C4]">
                        Matched on: {matchReasons.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Color Palette ── */}
          <div className="mb-12 border-b border-[#E8E8E8] pb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
              Color Palette
            </p>
            {palette.length > 0 && (
              <>
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
                <p className="text-[12px] text-[#C4C4C4] mb-4">
                  Extracted from your moodboard. Click to copy hex.
                </p>
              </>
            )}
            {primaryMovement && (
              <div className="bg-[#F7F7F5] p-5 mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
                  Movement Color Direction
                  <span className="ml-2 font-normal normal-case text-[#C4C4C4]">
                    via {primaryMovement.name}
                  </span>
                </p>
                <p className="text-[14px] text-[#8A8A8A] leading-relaxed">
                  {primaryMovement.colorDirection}
                </p>
                {secondaryMovement && (
                  <p className="text-[13px] text-[#C4C4C4] mt-2">
                    Also consider: {secondaryMovement.colorDirection.split('.')[0]}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Typography ── */}
          <div className="mb-12 border-b border-[#E8E8E8] pb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
              Typography Direction
              {typeRecs.source && (
                <span className="ml-2 font-normal normal-case text-[#C4C4C4]">
                  influenced by {typeRecs.source}
                </span>
              )}
            </p>
            <div className="grid grid-cols-12 gap-x-8">
              <div className="col-span-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
                  Display / Headlines
                </p>
                <p className="text-[28px] leading-tight font-medium text-[#1A1A1A] mb-2">
                  {typeRecs.display}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mt-5 mb-2">
                  Body / Captions
                </p>
                <p className="text-[20px] leading-tight font-medium text-[#1A1A1A]">
                  {typeRecs.body}
                </p>
              </div>
              <div className="col-span-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-3">
                  Direction
                </p>
                <p className="text-[16px] leading-[1.6] text-[#8A8A8A]">
                  {typeRecs.direction}
                </p>
              </div>
            </div>
            {/* Secondary movement type hint */}
            {secondaryMovement && (
              <div className="mt-6 pt-5 border-t border-[#F0F0F0]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
                  Alternate Direction
                  <span className="ml-2 font-normal normal-case">via {secondaryMovement.name}</span>
                </p>
                <p className="text-[14px] text-[#C4C4C4] leading-relaxed">
                  {secondaryMovement.typeFamilies.display} + {secondaryMovement.typeFamilies.body} — {secondaryMovement.typeFamilies.direction.split('.')[0]}.
                </p>
              </div>
            )}
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
              Ready-to-use prompts for Midjourney, DALL-E, or Stable Diffusion. Built from your concept, mood,{primaryMovement ? ` ${primaryMovement.name} influence,` : ''} and references.
            </p>

            <div className="space-y-4">
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
  if (!prompt) return null;

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
