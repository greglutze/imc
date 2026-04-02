'use client';

import { useMemo } from 'react';
import { Badge } from './ui';
import type { I2StyleProfile, ProjectConcept } from '../lib/api';

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
}

export default function StyleProfile({ styleProfile, concept, sonicBlueprint }: StyleProfileProps) {
  return (
    <div className="animate-fade-in px-8 py-6 space-y-3">
      {/* Production Aesthetic — hero card */}
      <div className="bg-[#F7F7F5] rounded-lg px-7 py-8">
        <SectionLabel>Production Aesthetic</SectionLabel>
        <p className="text-[22px] leading-[1.4] font-medium text-[#1A1A1A] mt-4 max-w-3xl tracking-tight">
          &ldquo;{styleProfile.production_aesthetic}&rdquo;
        </p>
      </div>

      {/* Genre DNA — only if concept has genre data */}
      {concept?.genre_primary && (
        <div className="bg-[#F7F7F5] rounded-lg px-7 py-8">
          <SectionLabel>Genre DNA</SectionLabel>
          <div className="mt-5 flex items-start gap-8">
            <div className="shrink-0">
              <p className="text-[11px] font-mono text-[#C4C4C4] mb-1">Primary</p>
              <p className="text-[32px] leading-none font-medium text-[#1A1A1A] tracking-tight">
                {concept.genre_primary}
              </p>
            </div>

            {concept.genre_secondary.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-mono text-[#C4C4C4] mb-2">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {concept.genre_secondary.map((genre, i) => (
                    <span
                      key={i}
                      className="text-[13px] font-medium text-[#1A1A1A] bg-white px-4 py-2 rounded-full border border-[#E8E8E8]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sonic Signatures + Tempo/Key grid */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 bg-[#F7F7F5] rounded-lg px-7 py-8">
          <SectionLabel>Sonic Signatures</SectionLabel>
          <div className="mt-5 space-y-4">
            {styleProfile.sonic_signatures.map((sig, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-[13px] font-medium text-[#C4C4C4] shrink-0 w-6 text-right pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[14px] text-[#1A1A1A] leading-relaxed">{sig}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-5 bg-[#F7F7F5] rounded-lg px-7 py-8">
          <div className="space-y-6">
            <div className="border-b border-[#E8E8E8] pb-4">
              <SectionLabel>Tempo Range</SectionLabel>
              <p className="text-[18px] font-medium text-[#1A1A1A] mt-2">{styleProfile.tempo_range}</p>
            </div>

            <div>
              <SectionLabel>Key Preferences</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {styleProfile.key_preferences.map((k, i) => (
                  <span key={i} className="text-[13px] font-mono text-[#1A1A1A] bg-white px-2.5 py-1 rounded-full border border-[#E8E8E8]">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Map — only if concept has mood keywords */}
      {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
        <div className="bg-[#F7F7F5] rounded-lg px-7 py-8">
          <SectionLabel>Mood Map</SectionLabel>
          <div className="mt-5">
            <MoodConstellation moods={concept.mood_keywords} />
          </div>
        </div>
      )}

      {/* Energy Profile — only if market research data is available */}
      {sonicBlueprint?.energy_profile && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7 bg-[#F7F7F5] rounded-lg px-7 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <SectionLabel>Energy Profile</SectionLabel>
              <Badge variant="green">From Market Research</Badge>
            </div>
            <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
              {sonicBlueprint.energy_profile}
            </p>
          </div>

          <div className="col-span-5 bg-[#F7F7F5] rounded-lg px-7 py-8">
            <SectionLabel>Market Production Style</SectionLabel>
            <p className="text-[13px] text-[#8A8A8A] leading-relaxed mt-2">
              {sonicBlueprint.production_style}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Deterministic hash for consistent node placement across renders */
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
