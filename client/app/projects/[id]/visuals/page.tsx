'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import { Badge } from '../../../../components/ui';
import type { Project, ProjectConcept, MoodboardImage, MoodboardBrief } from '../../../../lib/api';
import { extractPaletteFromImages, type ExtractedColor } from '../../../../lib/colorExtract';
import {
  matchMovements,
  findContrastMovement,
  collectGoogleFonts,
  buildGoogleFontsUrl,
  type ArtMovement,
  type MatchedMovement,
} from '../../../../lib/artMovements';

/* eslint-disable @next/next/no-img-element */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface VisualDirection {
  label: string;
  subtitle: string;
  movement: ArtMovement;
}

// ────────────────────────────────────────────
// Page
// ────────────────────────────────────────────

export default function VisualEnginePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);
  const [moodboardBrief, setMoodboardBrief] = useState<MoodboardBrief | null>(null);
  const [moodboardPalette, setMoodboardPalette] = useState<ExtractedColor[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  /** Which direction the user picked: 'a' | 'b' | null (not chosen yet) */
  const [chosenDirection, setChosenDirection] = useState<'a' | 'b' | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
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
          setMoodboardPalette(colors);
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
  const conceptReady = !!(concept && concept.genre_primary);

  // ── Match primary + find contrast ──
  const matched: MatchedMovement[] = useMemo(() => {
    if (!conceptReady) return [];
    return matchMovements(concept!, 3);
  }, [concept, conceptReady]);

  const primaryMovement = matched[0]?.movement ?? null;

  const contrastMovement: ArtMovement | null = useMemo(() => {
    if (!primaryMovement || !conceptReady) return null;
    return findContrastMovement(primaryMovement.id, concept!);
  }, [primaryMovement, concept, conceptReady]);

  // ── Build the two directions ──
  const directionA: VisualDirection | null = primaryMovement
    ? { label: 'Direction A', subtitle: 'Natural Fit', movement: primaryMovement }
    : null;

  const directionB: VisualDirection | null = contrastMovement
    ? { label: 'Direction B', subtitle: 'Creative Tension', movement: contrastMovement }
    : null;

  /** The active movement driving typography, prompts, color */
  const activeMovement: ArtMovement | null =
    chosenDirection === 'b' && directionB ? directionB.movement
    : chosenDirection === 'a' && directionA ? directionA.movement
    : null;

  // ── Load Google Fonts ──
  useEffect(() => {
    const extras = contrastMovement ? [contrastMovement] : [];
    const families = collectGoogleFonts(matched, extras);
    if (families.length === 0) return;

    const url = buildGoogleFontsUrl(families);
    const linkId = 'visual-engine-fonts';
    if (document.getElementById(linkId)) { setFontsLoaded(true); return; }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);
    return () => { document.getElementById(linkId)?.remove(); };
  }, [matched, contrastMovement]);

  // ── Prompt builders (use activeMovement) ──
  const buildCoverPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    parts.push(`Album cover art for a ${concept!.genre_primary} project.`);
    if (concept!.mood_keywords?.length) parts.push(`Mood: ${concept!.mood_keywords.slice(0, 4).join(', ')}.`);
    if (concept!.creative_direction) parts.push(concept!.creative_direction + '.');
    if (activeMovement) parts.push(`Visual style: ${activeMovement.promptFragment}.`);
    parts.push('Cinematic, editorial quality, no text. --ar 1:1 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildPromoPrompt = () => {
    if (!conceptReady) return '';
    const parts: string[] = [];
    parts.push(`Promotional photography for a ${concept!.genre_primary} project.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} atmosphere.`);
    if (activeMovement) parts.push(`Visual references: ${activeMovement.promptFragment}.`);
    parts.push('Fashion editorial style, dramatic lighting, strong composition. --ar 4:5 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildTypePrompt = () => {
    if (!conceptReady) return '';
    const genre = concept!.genre_primary;
    const typeStyle = activeMovement
      ? activeMovement.typeFamilies.direction.split('.')[0]
      : 'Custom lettering';
    const parts: string[] = [];
    parts.push(`Typography design for a ${genre} project logo.`);
    if (concept!.mood_keywords?.length) parts.push(`${concept!.mood_keywords.slice(0, 3).join(', ')} feeling.`);
    parts.push(`${typeStyle}.`);
    if (activeMovement) parts.push(`Inspired by ${activeMovement.name} design movement.`);
    parts.push('Black on white, high contrast. --ar 3:1 --v 6.1 --style raw');
    return parts.join(' ');
  };

  const buildBTSPrompt = () => {
    if (!conceptReady) return '';
    const colorHint = activeMovement?.colorDirection
      ? `Color direction: ${activeMovement.colorDirection.split('.')[0].toLowerCase()}.`
      : 'Warm tones, natural light.';
    return `Behind-the-scenes studio photography. Creative flow. ${colorHint} Shallow depth of field. Candid, not posed. Film grain texture. --ar 16:9 --v 6.1 --style raw`;
  };

  // ── Loading / empty states ──
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
          <div className="max-w-[1400px] mx-auto px-10 py-16">
            <p className="text-[40px] leading-[1.1] font-medium text-black tracking-tight">Concept Not Ready</p>
            <p className="text-[16px] text-[#8A8A8A] mt-5 max-w-sm">
              Your artist concept needs to be defined before the Visual Engine can generate direction. This happens during project creation.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-[13px] font-medium text-[#C4C4C4] mb-2">Cover Art & Identity</p>
            <p className="text-[40px] leading-[1.1] font-medium text-[#1A1A1A] tracking-tight">Visual Engine</p>
            <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-lg leading-relaxed">
              Two visual directions built from your concept. Choose one to shape your typography, color palette, and image prompts.
            </p>
          </div>

          {/* ══════════════════════════════════════════
              DIRECTION CHOOSER
              ══════════════════════════════════════════ */}
          {directionA && directionB && (
            <div className="mb-12 border-b border-[#E8E8E8] pb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                Choose Your Direction
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DirectionCard
                  direction={directionA}
                  chosen={chosenDirection === 'a'}
                  otherChosen={chosenDirection === 'b'}
                  fontsLoaded={fontsLoaded}
                  artistName={artistName}
                  onChoose={() => setChosenDirection('a')}
                />
                <DirectionCard
                  direction={directionB}
                  chosen={chosenDirection === 'b'}
                  otherChosen={chosenDirection === 'a'}
                  fontsLoaded={fontsLoaded}
                  artistName={artistName}
                  onChoose={() => setChosenDirection('b')}
                />
              </div>
              {chosenDirection && (
                <button
                  onClick={() => setChosenDirection(null)}
                  className="text-[12px] text-[#C4C4C4] hover:text-[#8A8A8A] mt-4 transition-colors duration-150"
                >
                  Reset choice
                </button>
              )}
            </div>
          )}

          {/* Show single direction if no contrast found */}
          {directionA && !directionB && (
            <div className="mb-12 border-b border-[#E8E8E8] pb-12">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                Art Direction
              </p>
              <DirectionCard
                direction={directionA}
                chosen={true}
                otherChosen={false}
                fontsLoaded={fontsLoaded}
                artistName={artistName}
                onChoose={() => setChosenDirection('a')}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════
              CONTENT — shown after direction is chosen
              ══════════════════════════════════════════ */}
          {activeMovement && (
            <>
              {/* ── Color Palette ── */}
              <div className="mb-12 border-b border-[#E8E8E8] pb-12">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">Color Palette</p>

                {/* Movement palette */}
                <div className="flex gap-3 mb-4">
                  {activeMovement.palette.map((hex, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(hex, hex)}
                      className="group flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-16 h-16 rounded-lg border border-[#E8E8E8] group-hover:scale-105 transition-transform duration-150"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-[11px] font-mono text-[#8A8A8A] group-hover:text-[#1A1A1A] transition-colors duration-150">
                        {copiedPrompt === hex ? '✓' : hex}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-[#8A8A8A] mb-1">
                  {activeMovement.colorDirection}
                </p>
                <p className="text-[12px] text-[#C4C4C4]">
                  From {activeMovement.name}. Click to copy hex.
                </p>

                {/* Moodboard-extracted palette (if available) */}
                {moodboardPalette.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#F0F0F0]">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-3">
                      From Your Moodboard
                    </p>
                    <div className="flex gap-2">
                      {moodboardPalette.slice(0, 6).map((color, i) => (
                        <button
                          key={i}
                          onClick={() => copyToClipboard(color.hex, color.hex)}
                          className="group flex flex-col items-center gap-1.5"
                        >
                          <div
                            className="w-12 h-12 rounded border border-[#E8E8E8] group-hover:scale-105 transition-transform duration-150"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] font-mono text-[#C4C4C4] group-hover:text-[#8A8A8A]">
                            {copiedPrompt === color.hex ? '✓' : color.hex}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Typography ── */}
              <div className="mb-12 border-b border-[#E8E8E8] pb-12">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                  Typography Direction
                  <span className="ml-2 font-normal normal-case text-[#C4C4C4]">
                    via {activeMovement.name}
                  </span>
                </p>
                <div className="grid grid-cols-12 gap-x-8">
                  <div className="col-span-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
                      Display / Headlines
                    </p>
                    <p
                      className="text-[32px] leading-tight font-medium text-[#1A1A1A] mb-2 transition-[font-family] duration-300"
                      style={fontsLoaded && activeMovement.typeFamilies.displayGoogleFont
                        ? { fontFamily: `'${activeMovement.typeFamilies.displayGoogleFont}', sans-serif` }
                        : undefined}
                    >
                      {activeMovement.typeFamilies.display}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mt-6 mb-2">
                      Body / Captions
                    </p>
                    <p
                      className="text-[20px] leading-tight font-medium text-[#1A1A1A] transition-[font-family] duration-300"
                      style={fontsLoaded && activeMovement.typeFamilies.bodyGoogleFont
                        ? { fontFamily: `'${activeMovement.typeFamilies.bodyGoogleFont}', sans-serif` }
                        : undefined}
                    >
                      {activeMovement.typeFamilies.body}
                    </p>
                    {/* Preview */}
                    {fontsLoaded && activeMovement.typeFamilies.displayGoogleFont && (
                      <div className="mt-6 pt-5 border-t border-[#F0F0F0]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-3">Preview</p>
                        <p
                          className="text-[28px] leading-snug text-[#1A1A1A] mb-2"
                          style={{ fontFamily: `'${activeMovement.typeFamilies.displayGoogleFont}', sans-serif` }}
                        >
                          {artistName}
                        </p>
                        <p
                          className="text-[15px] leading-relaxed text-[#8A8A8A]"
                          style={activeMovement.typeFamilies.bodyGoogleFont
                            ? { fontFamily: `'${activeMovement.typeFamilies.bodyGoogleFont}', sans-serif` }
                            : undefined}
                        >
                          The quick brown fox jumps over the lazy dog. 0123456789
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-3">Direction</p>
                    <p className="text-[16px] leading-[1.6] text-[#8A8A8A]">
                      {activeMovement.typeFamilies.direction}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Moodboard ── */}
              {moodboardImages.length > 0 && (
                <div className="mb-12 border-b border-[#E8E8E8] pb-12">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">
                    Visual Moodboard
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {moodboardImages.slice(0, 8).map((img, i) => (
                      <div key={i} className="aspect-square overflow-hidden bg-[#F7F7F5]">
                        <img src={img.image_data || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {moodboardBrief?.prose && (
                    <p className="text-[14px] text-[#8A8A8A] mt-4 max-w-2xl leading-relaxed">{moodboardBrief.prose}</p>
                  )}
                </div>
              )}

              {/* ── Image Prompts ── */}
              <div className="mb-12">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-5">Image Prompts</p>
                <p className="text-[13px] text-[#8A8A8A] mb-6">
                  Ready-to-use prompts for Midjourney, DALL-E, or Stable Diffusion. Shaped by {activeMovement.name}.
                </p>
                <div className="space-y-4">
                  <PromptCard number="01" title="Album Cover" description="Square format, cinematic, no text overlay" prompt={coverPrompt} onCopy={copyToClipboard} copied={copiedPrompt === 'cover'} copyLabel="cover" />
                  <PromptCard number="02" title="Promotional Photo" description="Portrait format for press kits and social" prompt={promoPrompt} onCopy={copyToClipboard} copied={copiedPrompt === 'promo'} copyLabel="promo" />
                  <PromptCard number="03" title="Typography / Logotype" description="Custom lettering direction for artist identity" prompt={typePrompt} onCopy={copyToClipboard} copied={copiedPrompt === 'type'} copyLabel="type" />
                  <PromptCard number="04" title="Behind the Scenes" description="Candid studio content for social channels" prompt={btsPrompt} onCopy={copyToClipboard} copied={copiedPrompt === 'bts'} copyLabel="bts" />
                </div>
              </div>

              {/* ── Mood Keywords ── */}
              {concept.mood_keywords && concept.mood_keywords.length > 0 && (
                <div className="mb-12 border-t border-[#E8E8E8] pt-12">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A] mb-4">Mood Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {concept.mood_keywords.map((kw, i) => (
                      <Badge key={i}>{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Nudge to choose if not chosen yet */}
          {!activeMovement && directionA && (
            <div className="text-center py-16">
              <p className="text-[16px] text-[#C4C4C4]">
                Choose a direction above to generate your visual identity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────
// Direction Card
// ────────────────────────────────────────────

function DirectionCard({
  direction,
  chosen,
  otherChosen,
  fontsLoaded,
  artistName,
  onChoose,
}: {
  direction: VisualDirection;
  chosen: boolean;
  otherChosen: boolean;
  fontsLoaded: boolean;
  artistName: string;
  onChoose: () => void;
}) {
  const mov = direction.movement;
  const dimmed = otherChosen && !chosen;

  return (
    <button
      onClick={onChoose}
      className={`
        text-left w-full p-6 transition-all duration-200 border-2 rounded-sm
        ${chosen
          ? 'border-[#1A1A1A] bg-white'
          : dimmed
            ? 'border-[#F0F0F0] bg-[#FAFAFA] opacity-50'
            : 'border-[#E8E8E8] bg-[#F7F7F5] hover:border-[#C4C4C4]'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4]">
            {direction.label}
          </span>
          <Badge variant={direction.subtitle === 'Natural Fit' ? 'green' : 'orange'}>
            {direction.subtitle}
          </Badge>
        </div>
        {chosen && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]">
            Selected
          </span>
        )}
      </div>

      {/* Movement name */}
      <h3 className="text-[20px] font-medium text-[#1A1A1A] leading-tight mb-1">
        {mov.name}
      </h3>
      <p className="text-[12px] text-[#C4C4C4] mb-3">{mov.era} · {mov.category}</p>
      <p className="text-[14px] text-[#8A8A8A] leading-relaxed mb-5">
        {mov.description}
      </p>

      {/* Palette swatches */}
      <div className="flex gap-2 mb-5">
        {mov.palette.map((hex, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded border border-[#E8E8E8]"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      {/* Type preview */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4C4C4] mb-2">
          Typography
        </p>
        <p
          className="text-[24px] leading-tight font-medium text-[#1A1A1A] transition-[font-family] duration-300"
          style={fontsLoaded && mov.typeFamilies.displayGoogleFont
            ? { fontFamily: `'${mov.typeFamilies.displayGoogleFont}', sans-serif` }
            : undefined}
        >
          {artistName}
        </p>
        <p
          className="text-[14px] text-[#8A8A8A] mt-1 transition-[font-family] duration-300"
          style={fontsLoaded && mov.typeFamilies.bodyGoogleFont
            ? { fontFamily: `'${mov.typeFamilies.bodyGoogleFont}', sans-serif` }
            : undefined}
        >
          {mov.typeFamilies.display} + {mov.typeFamilies.body}
        </p>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {mov.keywords.map((kw, i) => (
          <span key={i} className="text-[11px] px-2 py-0.5 bg-[#EEEDEB] text-[#8A8A8A] rounded-full">
            {kw}
          </span>
        ))}
      </div>
    </button>
  );
}


// ────────────────────────────────────────────
// Prompt Card
// ────────────────────────────────────────────

function PromptCard({
  number, title, description, prompt, onCopy, copied, copyLabel,
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
        <Badge variant="action" copyText={prompt}>
          {copied ? '✓ Copied' : 'Copy'}
        </Badge>
      </div>
      <div className="bg-[#EEEDEB] p-4 rounded">
        <p className="text-[13px] font-mono text-[#1A1A1A] leading-relaxed break-words">{prompt}</p>
      </div>
    </div>
  );
}
