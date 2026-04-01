'use client';

import { useState } from 'react';
import { ConfidenceMeter, Badge, Signal, Button } from './ui';
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['01', '02']));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(['01','02','03','04','05','06','07','08','09']));
  const collapseAll = () => setOpenSections(new Set());

  return (
    <div className="animate-fade-in">
      {/* Report header — oversized editorial */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
              Market Intelligence &amp; Audience Analysis
            </p>
            <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
              {artistName}
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <p className="text-body-sm text-neutral-500">
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
              <span className="text-neutral-200 mx-1">·</span>
              <Button onClick={openSections.size === 9 ? collapseAll : expandAll} variant="ghost" size="md">
                {openSections.size === 9 ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[48px] leading-none font-bold font-mono text-black">
              {confidence.overall_score}
            </p>
            <p className="text-caption text-neutral-400 mt-1">Confidence</p>
          </div>
        </div>
      </div>


      {/* Market Overview */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="01" title="Market Overview"
          summary={report.market_overview.saturation_level + ' saturation · ' + report.market_overview.growth_trend}
          isOpen={openSections.has('01')} onToggle={() => toggleSection('01')}
        />
        {openSections.has('01') && (
          <div className="animate-fade-in mt-6">
            <div className="grid grid-cols-12 gap-x-6">
              <div className="col-span-7">
                <p className="text-body-lg text-neutral-700 leading-relaxed">
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
              <div className="col-span-5">
                <div className="space-y-6">
                  <MetricDisplay label="Saturation" value={report.market_overview.saturation_level} color={getSaturationColor(report.market_overview.saturation_level)} />
                  <MetricDisplay label="Growth" value={report.market_overview.growth_trend} color={getGrowthColor(report.market_overview.growth_trend)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparable Artists */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="02" title="Comparable Artists"
          summary={report.comparable_artists.slice(0, 3).map(a => a.name).join(', ')}
          isOpen={openSections.has('02')} onToggle={() => toggleSection('02')}
        />
        {openSections.has('02') && (
          <div className="animate-fade-in mt-6 grid grid-cols-2 gap-6">
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
        )}
      </div>

      {/* Audience Profile */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="03" title="Audience"
          summary={report.audience_profile.primary_age_range + ' · ' + report.audience_profile.top_markets[0]}
          isOpen={openSections.has('03')} onToggle={() => toggleSection('03')}
        />
        {openSections.has('03') && (
          <div className="animate-fade-in mt-6 grid grid-cols-12 gap-x-6">
            <div className="col-span-4">
              <div className="space-y-4">
                <DataRow label="Age Range" value={report.audience_profile.primary_age_range} />
                <DataRow label="Gender Split" value={report.audience_profile.gender_split} />
              </div>
            </div>
            <div className="col-span-4">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-4">Top Markets</p>
              <div className="space-y-2">
                {report.audience_profile.top_markets.map((market, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-micro font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-body-sm text-black font-bold">{market}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-4">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-4">Platforms</p>
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
        )}
      </div>

      {/* Sonic Blueprint */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="04" title="Sonic Blueprint"
          summary={report.sonic_blueprint.bpm_range + ' BPM · ' + report.sonic_blueprint.energy_profile}
          isOpen={openSections.has('04')} onToggle={() => toggleSection('04')}
        />
        {openSections.has('04') && (
          <div className="animate-fade-in mt-6 grid grid-cols-12 gap-x-6">
            <div className="col-span-5">
              <div className="space-y-5">
                <DataRow label="BPM Range" value={report.sonic_blueprint.bpm_range} />
                <DataField label="Energy" value={report.sonic_blueprint.energy_profile} />
                <DataField label="Production" value={report.sonic_blueprint.production_style} />
              </div>
              <div className="mt-6">
                <p className="text-caption text-neutral-400 mb-2">Key Signatures</p>
                <div className="flex flex-wrap gap-2">
                  {report.sonic_blueprint.key_signatures.map((k, i) => (
                    <span key={i} className="text-body-sm font-mono text-black bg-neutral-50 px-2 py-1 rounded-sm border border-neutral-200">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-7">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">Sonic Signatures</p>
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
        )}
      </div>

      {/* Playlist Landscape */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="05" title="Playlist Landscape"
          summary={report.playlist_landscape.target_playlists.length + ' target playlists'}
          isOpen={openSections.has('05')} onToggle={() => toggleSection('05')}
        />
        {openSections.has('05') && (
          <div className="animate-fade-in mt-6">
            <p className="text-body text-neutral-500 mb-8">{report.playlist_landscape.curator_patterns}</p>
            <div className="space-y-3">
              {report.playlist_landscape.target_playlists.map((pl, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-4">
                    <span className="text-micro font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-body font-bold text-black">{pl.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-body-sm font-mono text-neutral-500">{formatNumber(pl.followers)} followers</span>
                    <DifficultyBadge difficulty={pl.placement_difficulty} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opportunities */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="06" title="Opportunities"
          summary={report.opportunities.length + ' gaps identified'}
          isOpen={openSections.has('06')} onToggle={() => toggleSection('06')}
        />
        {openSections.has('06') && (
          <div className="animate-fade-in mt-6 grid grid-cols-3 gap-6">
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
        )}
      </div>

      {/* Revenue Projections */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="07" title="Revenue Projections"
          summary="Streaming, touring, merch, sync"
          isOpen={openSections.has('07')} onToggle={() => toggleSection('07')}
        />
        {openSections.has('07') && (
          <div className="animate-fade-in mt-6 grid grid-cols-4 gap-6">
            <RevenueCard label="Streaming" value={report.revenue_projections.streaming} />
            <RevenueCard label="Touring" value={report.revenue_projections.touring} />
            <RevenueCard label="Merch" value={report.revenue_projections.merch} />
            <RevenueCard label="Sync Licensing" value={report.revenue_projections.sync_licensing} />
          </div>
        )}
      </div>

      {/* Risks */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="08" title="Risks"
          summary={report.risk_assessment.length + ' risks identified'}
          isOpen={openSections.has('08')} onToggle={() => toggleSection('08')}
        />
        {openSections.has('08') && (
          <div className="animate-fade-in mt-6 space-y-4">
            {report.risk_assessment.map((risk, i) => (
              <div key={i} className="flex items-start gap-3">
                <SeverityDot severity={risk.severity} />
                <div className="flex-1">
                  <p className="text-body-sm text-black font-bold">{risk.risk}</p>
                  <p className="text-caption text-neutral-400 uppercase tracking-widest mt-0.5">{risk.severity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="border-b border-neutral-200 px-8 py-8">
        <SectionHeader
          number="09" title="Recommendations"
          summary={report.recommendations.length + ' actions'}
          isOpen={openSections.has('09')} onToggle={() => toggleSection('09')}
        />
        {openSections.has('09') && (
          <div className="animate-fade-in mt-6 space-y-5">
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
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex items-center justify-between">
        <p className="text-micro font-mono text-neutral-300">
          Report v{version} — Generated by Instrument 01
        </p>
        <div className="flex items-center gap-4">
          <Button onClick={() => window.print()} variant="ghost" size="md" className="print:hidden">
            Export PDF
          </Button>
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

function SectionHeader({ number, title, summary, isOpen, onToggle }: {
  number: string;
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between group text-left"
    >
      <div className="flex items-center gap-4">
        <span className="text-heading font-bold font-mono text-neutral-200">{number}</span>
        <h3 className="text-heading font-bold text-black">{title}</h3>
        {!isOpen && summary && (
          <span className="text-body-sm text-neutral-400 ml-2 hidden sm:inline truncate max-w-xs">
            {summary}
          </span>
        )}
      </div>
      <span className={`text-neutral-300 group-hover:text-black transition-all duration-fast text-body shrink-0 ml-4 ${isOpen ? 'rotate-90' : ''}`}>
        →
      </span>
    </button>
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
