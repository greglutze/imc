'use client';

import { useMemo, useState } from 'react';
import { Badge } from './ui';
import type { I2StyleProfile, I2VocalistPersona, ProjectConcept } from '../lib/api';

interface SonicBlueprint {
  bpm_range: string;
  key_signatures: string[];
  energy_profile: string;
  production_style: string;
  sonic_signatures: string[];
}

interface StyleProfileProps {
  styleProfile: I2StyleProfile;
  concept?: ProjectConcept;
  sonicBlueprint?: SonicBlueprint;
  vocalistPersona?: I2VocalistPersona;
}

/* ——— Helpers ——— */

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/** Parse a flat string into { title, description } by splitting on em dash, colon, or first sentence. */
function parseTitleDesc(raw: string): { title: string; description: string } {
  // Try em dash first (most common in our prompts)
  const emDash = raw.indexOf(' — ');
  if (emDash > 0 && emDash < 60) {
    return { title: raw.slice(0, emDash).trim(), description: raw.slice(emDash + 3).trim() };
  }

  // Try colon
  const colon = raw.indexOf(': ');
  if (colon > 0 && colon < 50) {
    return { title: raw.slice(0, colon).trim(), description: raw.slice(colon + 2).trim() };
  }

  // Try " that " or " with " as natural break points
  for (const splitter of [' that ', ' with ']) {
    const idx = raw.indexOf(splitter);
    if (idx > 8 && idx < 55) {
      return { title: raw.slice(0, idx).trim(), description: raw.slice(idx + 1).trim() };
    }
  }

  // Fallback: first comma if it's early enough
  const comma = raw.indexOf(', ');
  if (comma > 8 && comma < 50) {
    return { title: raw.slice(0, comma).trim(), description: raw.slice(comma + 2).trim() };
  }

  // Last resort: take first ~40 chars as title
  if (raw.length > 50) {
    const spaceIdx = raw.indexOf(' ', 30);
    if (spaceIdx > 0) {
      return { title: raw.slice(0, spaceIdx).trim(), description: raw.slice(spaceIdx + 1).trim() };
    }
  }

  return { title: raw, description: '' };
}

/** Break a long production style paragraph into themed sentences */
function parseProductionThemes(text: string): Array<{ title: string; body: string }> {
  // Split on sentence boundaries (period followed by space and capital letter)
  const sentences = text.match(/[^.!]+[.!]+/g) || [text];

  // Group into themed chunks of 1-2 sentences
  const themes: Array<{ title: string; body: string }> = [];
  const themeKeywords: Record<string, string[]> = {
    'Foundation': ['foundation', 'structural', 'base', 'core', 'roots', 'influenced'],
    'Texture & Space': ['texture', 'reverb', 'pad', 'atmospheric', 'rain', 'space', 'ambient', 'synth', 'analog'],
    'Low End': ['808', 'bass', 'sub-bass', 'low-end', 'low end', 'weight'],
    'Drums & Rhythm': ['drum', 'snare', 'hi-hat', 'percussion', 'rhythm', 'beat', 'kick'],
    'Distortion & Edge': ['distortion', 'lo-fi', 'lofi', 'punk', 'raw', 'grit', 'clipping', 'noise'],
    'Dynamics': ['silence', 'negative space', 'dynamic', 'contrast', 'heavy', 'soft', 'tension'],
    'Mix & Master': ['mix', 'mixing', 'master', 'earphone', 'headphone', 'presence', 'midrange', 'stereo'],
    'Vocals': ['vocal', 'voice', 'sing', 'falsetto', 'harmony', 'choir', 'choral'],
  };

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    let matchedTheme = 'Sound Design';
    const lower = trimmed.toLowerCase();

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        matchedTheme = theme;
        break;
      }
    }

    // Try to merge with existing theme
    const existing = themes.find(t => t.title === matchedTheme);
    if (existing) {
      existing.body += ' ' + trimmed;
    } else {
      themes.push({ title: matchedTheme, body: trimmed });
    }
  }

  return themes;
}

/* ——— Icons as simple SVG components ——— */

function WaveformIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="6" width="2" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="4.5" y="3" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
      <rect x="8" y="5" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.8" />
      <rect x="11.5" y="2" width="2" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="2" y="4" width="2" height="8" rx="0.5" fill="currentColor" />
      <rect x="5" y="2" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="8" y="5" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="11" y="3" width="2" height="9" rx="0.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/* ——— Main Component ——— */

/** Build a Suno-formatted vocal prompt (no real names). */
function buildVocalPrompt(persona: I2VocalistPersona): string {
  const parts: string[] = [];
  if (persona.vocal_character) parts.push(`[Vocal Style: ${persona.vocal_character}]`);
  if (persona.delivery_style) parts.push(`[Vocal Delivery: ${persona.delivery_style}]`);
  if (persona.tone_keywords.length > 0) parts.push(`[Vocal Tone: ${persona.tone_keywords.join(', ')}]`);
  return parts.join('\n');
}

export default function StyleProfile({ styleProfile, concept, sonicBlueprint, vocalistPersona }: StyleProfileProps) {
  const parsedSignatures = useMemo(
    () => styleProfile.sonic_signatures.map(parseTitleDesc),
    [styleProfile.sonic_signatures]
  );

  const parsedKeys = useMemo(
    () => styleProfile.key_preferences.map(parseTitleDesc),
    [styleProfile.key_preferences]
  );

  const productionThemes = useMemo(
    () => sonicBlueprint?.production_style ? parseProductionThemes(sonicBlueprint.production_style) : [],
    [sonicBlueprint?.production_style]
  );

  return (
    <div className="animate-fade-in px-10 py-10 max-w-[1400px] mx-auto">

      {/* ———— Production Aesthetic — hero quote ———— */}
      <div className="pb-10 border-b border-[#E8E8E8]">
        <SectionLabel>Production Aesthetic</SectionLabel>
        <blockquote className="text-[24px] leading-[1.35] font-medium text-[#1A1A1A] mt-5 max-w-3xl tracking-tight">
          &ldquo;{styleProfile.production_aesthetic}&rdquo;
        </blockquote>
      </div>

      {/* ———— Genre DNA ———— */}
      {concept?.genre_primary && (
        <div className="py-10 border-b border-[#E8E8E8]">
          <SectionLabel>Genre DNA</SectionLabel>
          <div className="mt-5 flex items-start gap-10">
            <div className="shrink-0">
              <p className="text-[11px] font-mono text-[#C4C4C4] mb-1">Primary</p>
              <p className="text-[32px] leading-none font-medium text-[#1A1A1A] tracking-tight">
                {toTitleCase(concept.genre_primary)}
              </p>
            </div>

            {concept.genre_secondary.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-mono text-[#C4C4C4] mb-2">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {concept.genre_secondary.map((genre, i) => (
                    <span
                      key={i}
                      className="text-[13px] font-medium text-[#1A1A1A] bg-[#F7F7F5] px-4 py-2 rounded-full border border-[#E8E8E8]"
                    >
                      {toTitleCase(genre)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ———— Sonic Signatures — card grid ———— */}
      <div className="py-10 border-b border-[#E8E8E8]">
        <SectionLabel>Sonic Signatures</SectionLabel>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {parsedSignatures.map((sig, i) => (
            <div
              key={i}
              className="bg-[#F7F7F5] px-5 py-4 group hover:bg-[#F0F0ED] transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-[#C4C4C4] mt-0.5">
                  <WaveformIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#1A1A1A] leading-snug">
                    {sig.title}
                  </p>
                  {sig.description && (
                    <p className="text-[13px] text-[#8A8A8A] leading-relaxed mt-1">
                      {sig.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ———— Tempo & Key — side by side cards ———— */}
      <div className="py-10 border-b border-[#E8E8E8]">
        <div className="grid grid-cols-12 gap-4">
          {/* Tempo */}
          <div className="col-span-5">
            <SectionLabel>Tempo Range</SectionLabel>
            <div className="mt-4 bg-[#1A1A1A] px-6 py-5">
              <p className="text-[22px] font-medium text-white tracking-tight">
                {styleProfile.tempo_range.split('—')[0]?.split('–')[0]?.trim() || styleProfile.tempo_range}
              </p>
              {(styleProfile.tempo_range.includes('—') || styleProfile.tempo_range.includes('–')) && (
                <p className="text-[13px] text-[#8A8A8A] mt-1.5">
                  {(styleProfile.tempo_range.split('—')[1] || styleProfile.tempo_range.split('–')[1] || '').trim()}
                </p>
              )}
            </div>
          </div>

          {/* Key Preferences */}
          <div className="col-span-7">
            <SectionLabel>Key Preferences</SectionLabel>
            <div className="mt-4 space-y-2">
              {parsedKeys.map((k, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#F7F7F5] px-5 py-3.5">
                  <span className="text-[#C4C4C4] mt-0.5">
                    <KeyIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-[#1A1A1A]">
                      {k.title}
                    </p>
                    {k.description && (
                      <p className="text-[13px] text-[#8A8A8A] leading-relaxed mt-0.5">
                        {k.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ———— Mood Map ———— */}
      {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
        <div className="py-10 border-b border-[#E8E8E8]">
          <SectionLabel>Mood Map</SectionLabel>
          <div className="mt-5">
            <MoodConstellation moods={concept.mood_keywords} />
          </div>
        </div>
      )}

      {/* ———— Market Production Style — themed cards ———— */}
      {sonicBlueprint?.production_style && (
        <div className="py-10 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3 mb-5">
            <SectionLabel>Market Production Style</SectionLabel>
            <Badge variant="green">From Research</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {productionThemes.map((theme, i) => (
              <div key={i} className="bg-[#F7F7F5] px-5 py-4">
                <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-2">
                  {theme.title}
                </p>
                <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
                  {theme.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ———— Energy Profile ———— */}
      {sonicBlueprint?.energy_profile && (
        <div className="py-10 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <SectionLabel>Energy Profile</SectionLabel>
            <Badge variant="green">From Research</Badge>
          </div>
          <div className="bg-[#1A1A1A] px-7 py-6">
            <p className="text-[15px] text-[#E0E0E0] leading-relaxed">
              {sonicBlueprint.energy_profile}
            </p>
          </div>
        </div>
      )}

      {/* ———— Vocal Direction (folded in from Vocalist Persona) ———— */}
      {vocalistPersona && (
        <VocalDirection vocalistPersona={vocalistPersona} />
      )}
    </div>
  );
}

/* ——— Vocal Direction Section ——— */

function VocalDirection({ vocalistPersona }: { vocalistPersona: I2VocalistPersona }) {
  const [copied, setCopied] = useState(false);
  const prompt = buildVocalPrompt(vocalistPersona);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  return (
    <div className="py-10">
      <SectionLabel>Vocal Direction</SectionLabel>

      {/* Two-column: character + delivery */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="bg-[#F7F7F5] px-5 py-4">
          <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-2">
            Vocal Character
          </p>
          <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
            {vocalistPersona.vocal_character}
          </p>
        </div>
        <div className="bg-[#F7F7F5] px-5 py-4">
          <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide mb-2">
            Delivery Style
          </p>
          <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
            {vocalistPersona.delivery_style}
          </p>
        </div>
      </div>

      {/* Tone keywords + Suno vocal prompt */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Tone keywords */}
        <div>
          {vocalistPersona.tone_keywords && vocalistPersona.tone_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vocalistPersona.tone_keywords.map((kw, i) => (
                <span key={i} className="text-[11px] font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}
          {vocalistPersona.reference_vocalists && vocalistPersona.reference_vocalists.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] text-[#C4C4C4] mb-2">Reference vocalists (context only — not in prompts)</p>
              <p className="text-[13px] text-[#8A8A8A]">
                {vocalistPersona.reference_vocalists.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Suno vocal prompt — copyable */}
        <div className="bg-[#F7F7F5] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="orange">Suno Vocal Prompt</Badge>
            <button
              onClick={handleCopy}
              className="text-[11px] font-medium text-[#C4C4C4] hover:text-[#1A1A1A] transition-colors duration-150 border border-[#E8E8E8] rounded-full px-3 py-1 hover:border-[#1A1A1A]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-[13px] font-mono text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ——— Mood Constellation (unchanged visual component) ——— */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

type MoodTemp = 'warm' | 'cool' | 'neutral';

function classifyMood(mood: string): MoodTemp {
  const lower = mood.toLowerCase();

  const warmWords = [
    'aggressive', 'heavy', 'angry', 'rage', 'intense', 'chaotic', 'brutal',
    'fierce', 'violent', 'dark', 'gritty', 'raw', 'explosive', 'furious',
    'fire', 'loud', 'harsh', 'crushing', 'punishing', 'destructive',
    'ferocious', 'unrelenting', 'abrasive', 'volatile', 'menacing',
    'energetic', 'powerful', 'driving', 'urgent', 'defiant', 'rebellious',
  ];

  const coolWords = [
    'hopeful', 'peaceful', 'calm', 'serene', 'atmospheric', 'ambient',
    'dreamy', 'gentle', 'soft', 'ethereal', 'positive', 'uplifting',
    'healing', 'warm', 'tender', 'soothing', 'reflective', 'introspective',
    'meditative', 'tranquil', 'bliss', 'comfort', 'faith', 'grace',
    'light', 'bright', 'clean', 'open', 'spacious', 'airy', 'lush',
    'mental health', 'vulnerable', 'emotional', 'cathartic',
  ];

  for (const w of warmWords) {
    if (lower.includes(w)) return 'warm';
  }
  for (const w of coolWords) {
    if (lower.includes(w)) return 'cool';
  }
  return 'neutral';
}

interface MoodColor {
  fill: string;
  stroke: string;
  line: string;
  text: string;
}

const MOOD_COLORS: Record<MoodTemp, MoodColor> = {
  warm: {
    fill: '#FFF7ED',
    stroke: '#FB923C',
    line: '#FDBA74',
    text: '#C2410C',
  },
  cool: {
    fill: '#F0FDF4',
    stroke: '#4ADE80',
    line: '#86EFAC',
    text: '#15803D',
  },
  neutral: {
    fill: '#F9FAFB',
    stroke: '#D1D5DB',
    line: '#E5E7EB',
    text: '#374151',
  },
};

interface MoodNode {
  label: string;
  x: number;
  y: number;
  r: number;
  temp: MoodTemp;
}

function MoodConstellation({ moods }: { moods: string[] }) {
  const WIDTH = 900;
  const HEIGHT = 440;
  const PADDING = 90;

  const nodes: MoodNode[] = useMemo(() => {
    if (moods.length === 0) return [];

    const sizes = [32, 26, 30, 24, 28, 34, 22, 29];
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const radiusX = (WIDTH / 2) - PADDING;
    const radiusY = (HEIGHT / 2) - PADDING;

    return moods.map((mood, i) => {
      const hash = hashStr(mood);
      const r = sizes[i % sizes.length];
      const temp = classifyMood(mood);

      if (moods.length === 1) {
        return { label: mood, x: cx, y: cy, r, temp };
      }

      const angle = i * goldenAngle + (hash % 100) * 0.02;
      const normalizedDist = Math.sqrt((i + 0.5) / moods.length);
      const dist = normalizedDist * 0.95;
      const jitterX = ((hash % 50) - 25);
      const jitterY = (((hash >> 4) % 50) - 25);

      const x = Math.max(PADDING, Math.min(WIDTH - PADDING,
        cx + Math.cos(angle) * dist * radiusX + jitterX));
      const y = Math.max(PADDING, Math.min(HEIGHT - PADDING,
        cy + Math.sin(angle) * dist * radiusY + jitterY));

      return { label: mood, x, y, r, temp };
    });
  }, [moods]);

  const edges: Array<[number, number]> = useMemo(() => {
    if (nodes.length < 2) return [];
    const result: Array<[number, number]> = [];
    const seen = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
      const distances = nodes
        .map((n, j) => ({
          j,
          d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y),
        }))
        .filter((item) => item.j !== i)
        .sort((a, b) => a.d - b.d);

      const connections = Math.min(2, distances.length);
      for (let k = 0; k < connections; k++) {
        const key = [Math.min(i, distances[k].j), Math.max(i, distances[k].j)].join('-');
        if (!seen.has(key)) {
          seen.add(key);
          result.push([i, distances[k].j]);
        }
      }
    }
    return result;
  }, [nodes]);

  if (nodes.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      style={{ maxHeight: '440px' }}
    >
      {edges.map(([a, b], i) => {
        const colA = MOOD_COLORS[nodes[a].temp];
        const lineColor = nodes[a].temp === nodes[b].temp ? colA.line : '#E5E7EB';
        return (
          <line
            key={`edge-${i}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={lineColor}
            strokeWidth="1.5"
          />
        );
      })}

      {nodes.map((node, i) => {
        const colors = MOOD_COLORS[node.temp];
        return (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r - 4}
              fill={colors.fill}
              stroke="none"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={3}
              fill={colors.stroke}
              opacity="0.4"
            />
            <text
              x={node.x}
              y={node.y + node.r + 16}
              textAnchor="middle"
              style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}
              fill={colors.text}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-[#C4C4C4] uppercase tracking-wide">
      {children}
    </p>
  );
}
