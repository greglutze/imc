'use client';

import { useState } from 'react';
import { ConfidenceMeter, Badge, Signal, ButtonV2 } from './ui';
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
      {/* Report header */}
      <div className="px-8 py-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#C4C4C4] mb-2">
              Market Intelligence &amp; Audience Analysis
            </p>
            <h2 className="text-[48px] leading-[0.9] font-medium tracking-tight text-[#1A1A1A]">
              {artistName}
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <p className="text-[13px] text-[#8A8A8A]">
                Report v{version}
              </p>
              {totalVersions > 1 && onVersionChange && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalVersions }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      onClick={() => onVersionChange(v)}
                      className={`w-6 h-6 text-[11px] font-mono font-bold transition-colors duration-150 ${
                        v === version
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#F7F7F5] text-[#8A8A8A] hover:bg-[#E8E8E8] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[#E8E8E8] mx-1">·</span>
              <ButtonV2 onClick={openSections.size === 9 ? collapseAll : expandAll} variant="ghost" size="md">
                {openSections.size === 9 ? 'Collapse All' : 'Expand All'}
              </ButtonV2>
            </div>
          </div>
          <div className="bg-[#F7F7F5] px-6 py-5 text-center">
            <p className="text-[40px] leading-none font-medium font-mono text-[#1A1A1A]">
              {confidence.overall_score}
            </p>
            <p className="text-[11px] font-medium text-[#C4C4C4] mt-1.5">Confidence</p>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="px-8 pb-8 space-y-3">

        {/* Market Overview */}
        <SectionCard
          number="01" title="Market Overview"
          summary={report.market_overview.saturation_level + ' saturation · ' + report.market_overview.growth_trend}
          isOpen={openSections.has('01')} onToggle={() => toggleSection('01')}
        >
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-7">
              <p className="text-[14px] text-[#8A8A8A] leading-relaxed">
                {report.market_overview.genre_landscape}
              </p>
              <div className="mt-8 space-y-3">
                {report.market_overview.key_trends.map((trend, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[11px] font-mono text-[#C4C4C4] pt-1 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[13px] text-[#1A1A1A]">{trend}</p>
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
        </SectionCard>

        {/* Comparable Artists */}
        <SectionCard
          number="02" title="Comparable Artists"
          summary={report.comparable_artists.slice(0, 3).map(a => a.name).join(', ')}
          isOpen={openSections.has('02')} onToggle={() => toggleSection('02')}
        >
          <div className="grid grid-cols-2 gap-3">
            {report.comparable_artists.map((artist, i) => (
              <div key={i} className="bg-white p-5 border border-[#E8E8E8]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[16px] font-medium text-[#1A1A1A]">{artist.name}</p>
                    <p className="text-[11px] text-[#C4C4C4] font-mono mt-0.5">
                      {formatNumber(artist.monthly_listeners)} monthly listeners
                    </p>
                  </div>
                  <span className="text-[13px] font-medium text-[#C4C4C4]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <ConfidenceMeter value={artist.relevance_score} label="Relevance" size="sm" />
                <p className="text-[13px] text-[#8A8A8A] mt-3 leading-relaxed">{artist.positioning_gap}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Audience Profile */}
        <SectionCard
          number="03" title="Audience"
          summary={report.audience_profile.primary_age_range + ' · ' + report.audience_profile.top_markets[0]}
          isOpen={openSections.has('03')} onToggle={() => toggleSection('03')}
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <DataRow label="Age Range" value={report.audience_profile.primary_age_range} />
              <DataRow label="Gender Split" value={report.audience_profile.gender_split} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4] mb-4">Top Markets</p>
              <div className="space-y-2">
                {report.audience_profile.top_markets.map((market, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[#C4C4C4]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] text-[#1A1A1A] font-medium">{market}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4] mb-4">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {report.audience_profile.platforms.map((p, i) => (
                  <Badge key={i}>{p}</Badge>
                ))}
              </div>
              <p className="text-[13px] text-[#8A8A8A] mt-6 leading-relaxed">
                {report.audience_profile.psychographics}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Sonic Blueprint */}
        <SectionCard
          number="04" title="Sonic Blueprint"
          summary={report.sonic_blueprint.bpm_range + ' BPM · ' + report.sonic_blueprint.energy_profile}
          isOpen={openSections.has('04')} onToggle={() => toggleSection('04')}
        >
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-5">
              <div className="space-y-5">
                <DataRow label="BPM Range" value={report.sonic_blueprint.bpm_range} />
                <DataField label="Energy" value={report.sonic_blueprint.energy_profile} />
                <DataField label="Production" value={report.sonic_blueprint.production_style} />
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-medium text-[#C4C4C4] mb-2">Key Signatures</p>
                <div className="flex flex-wrap gap-2">
                  {report.sonic_blueprint.key_signatures.map((k, i) => (
                    <span key={i} className="text-[13px] font-mono text-[#1A1A1A] bg-white px-2.5 py-1 rounded-full border border-[#E8E8E8]">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#C4C4C4] mb-6">Sonic Signatures</p>
              <div className="space-y-4">
                {report.sonic_blueprint.sonic_signatures.map((sig, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-1 h-5 bg-signal-violet rounded-full shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{sig}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Playlist Landscape */}
        <SectionCard
          number="05" title="Playlist Landscape"
          summary={report.playlist_landscape.target_playlists.length + ' target playlists'}
          isOpen={openSections.has('05')} onToggle={() => toggleSection('05')}
        >
          <p className="text-[13px] text-[#8A8A8A] mb-6 leading-relaxed">{report.playlist_landscape.curator_patterns}</p>
          <div className="space-y-3">
            {report.playlist_landscape.target_playlists.map((pl, i) => (
              <div key={i} className="flex items-center justify-between bg-white px-4 py-3 border border-[#E8E8E8]">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-[#C4C4C4]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[14px] font-medium text-[#1A1A1A]">{pl.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[12px] font-mono text-[#8A8A8A]">{formatNumber(pl.followers)} followers</span>
                  <DifficultyBadge difficulty={pl.placement_difficulty} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Opportunities */}
        <SectionCard
          number="06" title="Opportunities"
          summary={report.opportunities.length + ' gaps identified'}
          isOpen={openSections.has('06')} onToggle={() => toggleSection('06')}
        >
          <div className="grid grid-cols-3 gap-3">
            {report.opportunities.map((opp, i) => (
              <div key={i} className="bg-white p-5 border border-[#E8E8E8]">
                <span className="text-[13px] font-medium text-[#C4C4C4]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[14px] font-medium text-[#1A1A1A] mt-3">{opp.gap}</p>
                <div className="mt-4 space-y-2">
                  <ConfidenceMeter value={opp.market_score} label="Market Score" size="sm" />
                  <ConfidenceMeter value={opp.success_probability} label="Success Prob." size="sm" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Revenue Projections */}
        <SectionCard
          number="07" title="Revenue Projections"
          summary="Streaming, touring, merch, sync"
          isOpen={openSections.has('07')} onToggle={() => toggleSection('07')}
        >
          <div className="grid grid-cols-4 gap-3">
            <RevenueCard label="Streaming" value={report.revenue_projections.streaming} />
            <RevenueCard label="Touring" value={report.revenue_projections.touring} />
            <RevenueCard label="Merch" value={report.revenue_projections.merch} />
            <RevenueCard label="Sync Licensing" value={report.revenue_projections.sync_licensing} />
          </div>
        </SectionCard>

        {/* Risks */}
        <SectionCard
          number="08" title="Risks"
          summary={report.risk_assessment.length + ' risks identified'}
          isOpen={openSections.has('08')} onToggle={() => toggleSection('08')}
        >
          <div className="space-y-3">
            {report.risk_assessment.map((risk, i) => (
              <div key={i} className="flex items-start gap-3 bg-white px-4 py-3 border border-[#E8E8E8]">
                <SeverityDot severity={risk.severity} />
                <div className="flex-1">
                  <p className="text-[13px] text-[#1A1A1A] font-medium">{risk.risk}</p>
                  <p className="text-[11px] text-[#C4C4C4] uppercase tracking-wide mt-0.5">{risk.severity}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recommendations */}
        <SectionCard
          number="09" title="Recommendations"
          summary={report.recommendations.length + ' actions'}
          isOpen={openSections.has('09')} onToggle={() => toggleSection('09')}
        >
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-4 bg-white px-5 py-4 border border-[#E8E8E8]">
                <span className="text-[13px] font-medium text-[#C4C4C4] shrink-0 pt-0.5">
                  {String(rec.priority).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#1A1A1A]">{rec.action}</p>
                  <p className="text-[11px] text-[#8A8A8A] mt-1">{rec.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex items-center justify-between">
        <p className="text-[11px] font-mono text-[#C4C4C4]">
          Report v{version} — Generated by Instrument 01
        </p>
        <div className="flex items-center gap-4">
          <ButtonV2 onClick={() => window.print()} variant="ghost" size="md" className="print:hidden">
            Export PDF
          </ButtonV2>
          <div className="flex items-center gap-2">
            <Signal color="green" />
            <span className="text-[11px] font-medium text-[#8A8A8A]">Research Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ———————— Sub-components ———————— */

function SectionCard({ number, title, summary, isOpen, onToggle, children }: {
  number: string;
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-[#F7F7F5] transition-all duration-200 ${isOpen ? '' : 'hover:bg-[#F0F0ED]'}`}>
      <button
        onClick={onToggle}
        className="w-full px-7 py-6 flex items-center justify-between group text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-medium text-[#C4C4C4]">{number}</span>
          <h3 className="text-[18px] font-medium text-[#1A1A1A]">{title}</h3>
          {!isOpen && summary && (
            <span className="text-[13px] text-[#8A8A8A] ml-1 hidden sm:inline truncate max-w-xs">
              {summary}
            </span>
          )}
        </div>
        <span className={`text-[#C4C4C4] group-hover:text-[#1A1A1A] transition-all duration-150 text-[14px] shrink-0 ml-4 ${isOpen ? 'rotate-90' : ''}`}>
          →
        </span>
      </button>
      {isOpen && (
        <div className="animate-fade-in px-7 pb-7">
          {children}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[#E8E8E8] pb-2">
      <span className="text-[11px] font-medium text-[#C4C4C4] shrink-0 mr-4">{label}</span>
      <span className="text-[13px] text-[#1A1A1A] font-medium text-right">{value}</span>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#E8E8E8] pb-3">
      <span className="text-[11px] font-medium text-[#C4C4C4] block mb-1">{label}</span>
      <span className="text-[13px] text-[#1A1A1A] font-medium">{value}</span>
    </div>
  );
}

function MetricDisplay({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-b border-[#E8E8E8] pb-4">
      <p className="text-[11px] font-medium text-[#C4C4C4] mb-1">{label}</p>
      <p className={`text-[18px] font-medium ${color}`}>{value}</p>
    </div>
  );
}

function RevenueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5 border border-[#E8E8E8]">
      <p className="text-[11px] font-medium text-[#C4C4C4] mb-2">{label}</p>
      <p className="text-[14px] font-medium text-[#1A1A1A]">{value}</p>
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
  return <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0 mt-2`} />;
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
