'use client';

import { ConfidenceMeter, Badge, Signal } from './ui';
import type { I1Report, I1Confidence } from '../lib/api';

interface ResearchReportProps {
  report: I1Report;
  confidence: I1Confidence;
  version: number;
  totalVersions?: number;
  artistName: string;
  createdAt?: string;
  onVersionChange?: (version: number) => void;
}

export default function ResearchReport({
  report,
  confidence,
  version,
  totalVersions = 1,
  artistName,
  createdAt,
  onVersionChange,
}: ResearchReportProps) {
  return (
    <div className="animate-fade-in">
      {/* Report header — oversized editorial */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
                Market Research Report — v{version}
              </p>
              {totalVersions > 1 && onVersionChange && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalVersions }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      onClick={() => onVersionChange(v)}
                      className={`w-6 h-6 rounded-sm text-micro font-mono font-bold transition-colors duration-fast ${
                        v === version
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-black'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
              {artistName}
            </h2>
            {createdAt && (
              <p className="text-caption text-neutral-400 mt-3 font-mono">
                {new Date(createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[48px] leading-none font-bold font-mono text-black">
              {confidence.overall_score}
            </p>
            <p className="text-caption text-neutral-400 mt-1">Confidence</p>
          </div>
        </div>
      </div>

      {/* Confidence strip */}
      <div className="border-b border-neutral-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          <ConfidenceMeter value={confidence.overall_score} label="Overall" />
          <ConfidenceMeter value={confidence.data_completeness} label="Data Completeness" />
          <div>
            <p className="text-caption text-neutral-400 mb-2">Sources Used</p>
            <div className="flex flex-wrap gap-1.5">
              {confidence.sources_used.map((s, i) => (
                <Badge key={i} variant="green">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-neutral-400 mb-2">Sources Failed</p>
            <div className="flex flex-wrap gap-1.5">
              {confidence.sources_failed.length > 0 ? (
                confidence.sources_failed.map((s, i) => (
                  <Badge key={i} variant="red">{s}</Badge>
                ))
              ) : (
                <Badge variant="green">None</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview — full-width editorial */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          {/* Left: genre landscape description */}
          <div className="col-span-7 px-8 py-10 border-r border-neutral-200">
            <SectionHeader number="01" title="Market Overview" />
            <p className="text-body-lg text-neutral-700 leading-relaxed mt-6">
              {report.market_overview.genre_landscape}
            </p>

            <div className="mt-8 space-y-3">
              {report.market_overview.key_trends.map((trend, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-micro font-mono text-neutral-300 pt-1 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-sm text-neutral-600">{trend}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: key metrics */}
          <div className="col-span-5 px-8 py-10">
            <div className="space-y-6">
              <MetricDisplay
                label="Saturation"
                value={report.market_overview.saturation_level}
                color={getSaturationColor(report.market_overview.saturation_level)}
              />
              <MetricDisplay
                label="Growth"
                value={report.market_overview.growth_trend}
                color={getGrowthColor(report.market_overview.growth_trend)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparable Artists — editorial grid */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <SectionHeader number="02" title="Comparable Artists" />

        <div className="mt-8 grid grid-cols-2 gap-6">
          {report.comparable_artists.map((artist, i) => (
            <div key={i} className="border border-neutral-200 rounded-sm p-5 hover:border-neutral-300 transition-colors duration-fast">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-heading-sm font-bold text-black">{artist.name}</p>
                  <p className="text-caption text-neutral-400 font-mono mt-0.5">
                    {formatNumber(artist.monthly_listeners)} monthly listeners
                  </p>
                </div>
                <span className="text-[32px] leading-none font-bold font-mono text-neutral-200">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <ConfidenceMeter value={artist.relevance_score} label="Relevance" size="sm" />
              <p className="text-body-sm text-neutral-500 mt-3">{artist.positioning_gap}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Profile — three-column layout */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-4 px-8 py-10 border-r border-neutral-200">
            <SectionHeader number="03" title="Audience" />

            <div className="mt-6 space-y-4">
              <DataRow label="Age Range" value={report.audience_profile.primary_age_range} />
              <DataRow label="Gender Split" value={report.audience_profile.gender_split} />
            </div>
          </div>

          <div className="col-span-4 px-6 py-10 border-r border-neutral-200">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">
              Top Markets
            </p>
            <div className="space-y-2">
              {report.audience_profile.top_markets.map((market, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-micro font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-body-sm text-black font-bold">{market}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-4 px-6 py-10">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">
              Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {report.audience_profile.platforms.map((p, i) => (
                <Badge key={i}>{p}</Badge>
              ))}
            </div>

            <p className="text-body-sm text-neutral-500 mt-6 leading-relaxed">
              {report.audience_profile.psychographics}
            </p>
          </div>
        </div>
      </div>

      {/* Sonic Blueprint — two-column editorial */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-5 px-8 py-10 border-r border-neutral-200">
            <SectionHeader number="04" title="Sonic Blueprint" />

            <div className="mt-6 space-y-5">
              <DataRow label="BPM Range" value={report.sonic_blueprint.bpm_range} />
              <DataField label="Energy" value={report.sonic_blueprint.energy_profile} />
              <DataField label="Production" value={report.sonic_blueprint.production_style} />
            </div>

            <div className="mt-6">
              <p className="text-caption text-neutral-400 mb-2">Key Signatures</p>
              <div className="flex flex-wrap gap-2">
                {report.sonic_blueprint.key_signatures.map((k, i) => (
                  <span key={i} className="text-body-sm font-mono text-black bg-neutral-50 px-2 py-1 rounded-sm border border-neutral-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-7 px-8 py-10">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">
              Sonic Signatures
            </p>
            <div className="space-y-4">
              {report.sonic_blueprint.sonic_signatures.map((sig, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-1 h-5 bg-signal-violet rounded-full shrink-0 mt-0.5" />
                  <p className="text-body text-neutral-700">{sig}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Landscape */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <SectionHeader number="05" title="Playlist Landscape" />

        <p className="text-body text-neutral-500 mt-4 mb-8">{report.playlist_landscape.curator_patterns}</p>

        <div className="space-y-3">
          {report.playlist_landscape.target_playlists.map((pl, i) => (
            <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-4">
                <span className="text-micro font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-body font-bold text-black">{pl.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-body-sm font-mono text-neutral-500">
                  {formatNumber(pl.followers)} followers
                </span>
                <DifficultyBadge difficulty={pl.placement_difficulty} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities — oversized numbers */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <SectionHeader number="06" title="Opportunities" />

        <div className="grid grid-cols-3 gap-6 mt-8">
          {report.opportunities.map((opp, i) => (
            <div key={i} className="border border-neutral-200 rounded-sm p-5">
              <span className="text-[48px] leading-none font-bold font-mono text-neutral-100">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-body font-bold text-black mt-3">{opp.gap}</p>
              <div className="mt-4 space-y-2">
                <ConfidenceMeter value={opp.market_score} label="Market Score" size="sm" />
                <ConfidenceMeter value={opp.success_probability} label="Success Prob." size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Projections — four-column grid */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <SectionHeader number="07" title="Revenue Projections" />

        <div className="grid grid-cols-4 gap-6 mt-8">
          <RevenueCard label="Streaming" value={report.revenue_projections.streaming} />
          <RevenueCard label="Touring" value={report.revenue_projections.touring} />
          <RevenueCard label="Merch" value={report.revenue_projections.merch} />
          <RevenueCard label="Sync Licensing" value={report.revenue_projections.sync_licensing} />
        </div>
      </div>

      {/* Risk Assessment + Recommendations side by side */}
      <div className="border-b border-neutral-200">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-5 px-8 py-10 border-r border-neutral-200">
            <SectionHeader number="08" title="Risks" />

            <div className="mt-6 space-y-4">
              {report.risk_assessment.map((risk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <SeverityDot severity={risk.severity} />
                  <div className="flex-1">
                    <p className="text-body-sm text-black font-bold">{risk.risk}</p>
                    <p className="text-caption text-neutral-400 uppercase tracking-widest mt-0.5">
                      {risk.severity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-7 px-8 py-10">
            <SectionHeader number="09" title="Recommendations" />

            <div className="mt-6 space-y-5">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[28px] leading-none font-bold font-mono text-neutral-200 shrink-0">
                    {String(rec.priority).padStart(2, '0')}
                  </span>
                  <div className="flex-1 border-b border-neutral-100 pb-4">
                    <p className="text-body font-bold text-black">{rec.action}</p>
                    <p className="text-caption text-neutral-400 mt-1">{rec.timeline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex items-center justify-between">
        <p className="text-micro font-mono text-neutral-300">
          Report v{version} — Generated by Instrument 01
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.print()}
            className="print:hidden text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
          >
            Export PDF
          </button>
          <div className="flex items-center gap-2">
            <Signal color="green" />
            <span className="text-caption text-neutral-400">Research Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ———————— Sub-components ———————— */

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-heading font-bold font-mono text-neutral-200">{number}</span>
      <h3 className="text-heading font-bold text-black">{title}</h3>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
      <span className="text-caption text-neutral-400 shrink-0 mr-4">{label}</span>
      <span className="text-body-sm text-black font-bold text-right">{value}</span>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-neutral-100 pb-3">
      <span className="text-caption text-neutral-400 block mb-1">{label}</span>
      <span className="text-body-sm text-black font-bold">{value}</span>
    </div>
  );
}

function MetricDisplay({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-b border-neutral-100 pb-4">
      <p className="text-caption text-neutral-400 mb-1">{label}</p>
      <p className={`text-heading-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RevenueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 rounded-sm p-4">
      <p className="text-caption text-neutral-400 mb-2">{label}</p>
      <p className="text-body font-bold text-black">{value}</p>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const normalized = difficulty.toLowerCase();
  let variant: 'green' | 'yellow' | 'orange' | 'red' = 'yellow';
  if (normalized.includes('easy') || normalized.includes('low')) variant = 'green';
  if (normalized.includes('hard') || normalized.includes('high')) variant = 'red';
  if (normalized.includes('medium') || normalized.includes('moderate')) variant = 'orange';
  return <Badge variant={variant}>{difficulty}</Badge>;
}

function SeverityDot({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();
  let color = 'bg-signal-yellow';
  if (normalized.includes('high') || normalized.includes('critical')) color = 'bg-signal-red';
  if (normalized.includes('low')) color = 'bg-signal-green';
  return <div className={`w-2 h-2 rounded-full ${color} shrink-0 mt-1.5`} />;
}

/* ———————— Helpers ———————— */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getSaturationColor(level: string): string {
  const l = level.toLowerCase();
  if (l.includes('low')) return 'text-signal-green';
  if (l.includes('high') || l.includes('over')) return 'text-signal-red';
  return 'text-signal-yellow';
}

function getGrowthColor(trend: string): string {
  const t = trend.toLowerCase();
  if (t.includes('growing') || t.includes('rising') || t.includes('up')) return 'text-signal-green';
  if (t.includes('declining') || t.includes('shrinking')) return 'text-signal-red';
  return 'text-signal-yellow';
}
