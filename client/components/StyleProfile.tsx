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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
          Instrument 02
        </p>
        <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
          Style Profile
        </h2>
      </div>

      {/* Production Aesthetic — hero block */}
      <div className="border-b border-neutral-200 px-8 py-12">
        <SectionLabel>Production Aesthetic</SectionLabel>
        <p className="text-[24px] leading-[1.4] font-bold text-black mt-4 max-w-3xl tracking-tight">
          &ldquo;{styleProfile.production_aesthetic}&rdquo;
        </p>
      </div>

      {/* Genre DNA — only if concept has genre data */}
      {concept?.genre_primary && (
        <div className="border-b border-neutral-200 px-8 py-10">
          <SectionLabel>Genre DNA</SectionLabel>
          <div className="mt-5 flex items-start gap-8">
            {/* Primary genre — large */}
            <div className="shrink-0">
              <p className="text-micro font-mono text-neutral-300 mb-1">Primary</p>
              <p className="text-[40px] leading-none font-bold text-black tracking-tight">
                {concept.genre_primary}
              </p>
            </div>

            {/* Secondary genres — smaller, branching off */}
            {concept.genre_secondary.length > 0 && (
              <div className="pt-1">
                <p className="text-micro font-mono text-neutral-300 mb-2">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {concept.genre_secondary.map((genre, i) => (
                    <span
                      key={i}
                      className="text-body font-bold text-neutral-600 bg-neutral-50 px-4 py-2 rounded-sm border border-neutral-200"
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
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
            <SectionLabel>Sonic Signatures</SectionLabel>
            <div className="mt-5 space-y-4">
              {styleProfile.sonic_signatures.map((sig, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[32px] leading-none font-bold font-mono text-neutral-200 shrink-0 w-10 text-right">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-lg text-neutral-700 leading-relaxed pt-1">{sig}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 px-8 py-10">
            <div className="space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <SectionLabel>Tempo Range</SectionLabel>
                <p className="text-heading-sm font-bold text-black mt-2">{styleProfile.tempo_range}</p>
              </div>

              <div>
                <SectionLabel>Key Preferences</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {styleProfile.key_preferences.map((k, i) => (
                    <span key={i} className="text-body-sm font-mono text-black bg-neutral-50 px-2 py-1 rounded-sm border border-neutral-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Map — only if concept has mood keywords */}
      {concept?.mood_keywords && concept.mood_keywords.length > 0 && (
        <div className="border-b border-neutral-200 px-8 py-10">
          <SectionLabel>Mood Map</SectionLabel>
          <div className="mt-5">
            <MoodConstellation moods={concept.mood_keywords} />
          </div>
        </div>
      )}

      {/* Energy Profile — only if market research data is available */}
      {sonicBlueprint?.energy_profile && (
        <div className="border-b border-neutral-200">
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-signal-green rounded-full" />
                <SectionLabel>Energy Profile</SectionLabel>
                <Badge variant="green">From Market Research</Badge>
              </div>
              <p className="text-body-lg text-neutral-700 leading-relaxed">
                {sonicBlueprint.energy_profile}
              </p>
            </div>

            <div className="col-span-5 px-8 py-10">
              <SectionLabel>Market Production Style</SectionLabel>
              <p className="text-body text-neutral-700 leading-relaxed mt-2">
                {sonicBlueprint.production_style}
              </p>
            </div>
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

interface MoodNode {
  label: string;
  x: number;
  y: number;
  r: number;
}

function MoodConstellation({ moods }: { moods: string[] }) {
  const WIDTH = 900;
  const HEIGHT = 340;
  const PADDING = 70;

  const nodes: MoodNode[] = useMemo(() => {
    if (moods.length === 0) return [];

    // Size variation based on index
    const sizes = [28, 22, 26, 20, 24, 30, 18, 25];

    // Place nodes using golden-angle spiral for even distribution
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxRadius = Math.min(WIDTH / 2 - PADDING, HEIGHT / 2 - PADDING);

    return moods.map((mood, i) => {
      const hash = hashStr(mood);
      const r = sizes[i % sizes.length];

      if (moods.length === 1) {
        return { label: mood, x: cx, y: cy, r };
      }

      // Spiral layout with hash-based jitter
      const angle = i * goldenAngle + (hash % 100) * 0.01;
      const dist = maxRadius * Math.sqrt((i + 0.5) / moods.length) * 0.85;
      const jitterX = ((hash % 40) - 20);
      const jitterY = (((hash >> 4) % 40) - 20);

      const x = Math.max(PADDING, Math.min(WIDTH - PADDING, cx + Math.cos(angle) * dist + jitterX));
      const y = Math.max(PADDING - 10, Math.min(HEIGHT - PADDING + 10, cy + Math.sin(angle) * dist + jitterY));

      return { label: mood, x, y, r };
    });
  }, [moods]);

  // Build edges: connect each node to its 2 nearest neighbors
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
      style={{ maxHeight: '340px' }}
    >
      {/* Connection lines */}
      {edges.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#e5e5e5"
          strokeWidth="1"
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={i}>
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="white"
            stroke="#d4d4d4"
            strokeWidth="1"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r - 3}
            fill="#fafafa"
            stroke="none"
          />
          <text
            x={node.x}
            y={node.y + node.r + 14}
            textAnchor="middle"
            className="text-[11px] font-bold uppercase tracking-widest"
            fill="#171717"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption text-neutral-400 uppercase tracking-widest font-bold">
      {children}
    </p>
  );
}
