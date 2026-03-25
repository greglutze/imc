'use client';

import { Badge, Signal, ConfidenceMeter } from '../components/ui';

/* eslint-disable @next/next/no-img-element */

// Image paths
const IMG = {
  hero: '/images/greglutze_A_photograph_of_a_black_fashion_man_with_black_drea_06690802-0bdb-4c5d-84bd-ed8a8199d311_0.png',
  mohawk: '/images/greglutze_A_photograph_of_a_white_fashion_man_with_a_mohawk_l_0e305330-5dc5-4c33-b177-54ef6efa9ae2_0.png',
  redLip: '/images/greglutze_A_photograph_of_an_Asian_woman_with_black_hair_and__d74d4b9a-a114-4f4d-a304-af8c71ef5fd5_2.png',
  blue: '/images/GregLutzePortraitBlue.png',
  anaya: '/images/GregLutze_Anaya.png',
  motion: '/images/greglutze_httpss.mj.runUYmNFK5lkcY_Photograph_of_an_androgyno_e255d063-e3d3-4d77-aeb8-0b9a8839a2f5_1.png',
  darkRed: '/images/GregLutze_DarkRedPortrait.png',
};

export default function Home() {
  return (
    <div className="animate-fade-in">

      {/* ════════════════════════════════════════
          MASTHEAD
         ════════════════════════════════════════ */}
      <div className="border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 py-5 flex items-end justify-between">
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
            Instruments of Mass Creation
          </p>
          <p className="text-micro font-mono text-neutral-300">
            Issue No. 001 — March 2026
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          HERO — full bleed image + type
         ════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-12 gap-x-6">
          {/* Large hero image */}
          <div className="col-span-6 py-10">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={IMG.hero}
                alt="Artist portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Type + data */}
          <div className="col-span-6 py-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Signal color="green" />
                <Badge variant="green">Active Project</Badge>
              </div>

              <h1 className="text-[140px] leading-[0.85] font-bold tracking-tight text-black -ml-2">
                MMe.
              </h1>

              <p className="text-body-lg text-neutral-500 mt-8 max-w-sm">
                Symphonic × electronic. Where Ólafur Arnalds meets The Prodigy.
                A debut artist pushing genre boundaries through AI-assisted production.
              </p>
            </div>

            {/* Metrics strip at bottom */}
            <div className="border-t border-neutral-200 pt-8 mt-8">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">
                Research Intelligence
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <MetricCompact value={87} label="Overall Confidence" />
                <MetricCompact value={92} label="Genre Match" />
                <MetricCompact value={74} label="Market Viability" />
                <MetricCompact value={28} label="Saturation Risk" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          IMAGE STRIP — editorial triptych
         ════════════════════════════════════════ */}
      <div className="border-y border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="grid grid-cols-12 gap-x-6 py-1">
            {/* Tall narrow */}
            <div className="col-span-3">
              <div className="aspect-[2/3] overflow-hidden">
                <img src={IMG.darkRed} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Wide center */}
            <div className="col-span-5">
              <div className="aspect-[2/3] overflow-hidden">
                <img src={IMG.mohawk} alt="" className="w-full h-full object-cover object-top" />
              </div>
            </div>
            {/* Square-ish */}
            <div className="col-span-4">
              <div className="aspect-[2/3] overflow-hidden">
                <img src={IMG.redLip} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          {/* Strip caption */}
          <div className="grid grid-cols-12 gap-x-6 pb-6 pt-3">
            <div className="col-span-3">
              <p className="text-caption text-neutral-400">01 — Concept</p>
            </div>
            <div className="col-span-5">
              <p className="text-caption text-neutral-400">02 — Reference</p>
            </div>
            <div className="col-span-4">
              <p className="text-caption text-neutral-400">03 — Direction</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURE — concept + pipeline + image
         ════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-12 gap-x-6 border-b border-neutral-200">

          {/* Artist concept — pull quote */}
          <div className="col-span-5 py-16 pr-8 border-r border-neutral-200">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
              Artist Concept
            </p>

            <blockquote className="text-[32px] leading-[1.15] font-bold text-black">
              &ldquo;Classical instruments processed through electronic production
              techniques&rdquo;
            </blockquote>

            <div className="mt-10 space-y-3">
              <DetailRow label="Genre" value="Neoclassical Electronic" />
              <DetailRow label="Influences" value="Arnalds, Prodigy, Burial" />
              <DetailRow label="BPM Range" value="110–140" />
              <DetailRow label="Mood" value="Melancholic, Driving" />
              <DetailRow label="Vocal" value="Processed, Androgynous" />
            </div>

            {/* Pipeline status */}
            <div className="mt-12 pt-8 border-t border-neutral-200">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">
                Pipeline
              </p>
              <div className="space-y-4">
                <InstrumentRow number="01" name="Market Research" status="Complete" statusColor="green" />
                <InstrumentRow number="02" name="Prompt Generation" status="In Progress" statusColor="yellow" />
                <InstrumentRow number="03" name="Track Analysis" status="On Hold" statusColor="neutral" />
              </div>
            </div>
          </div>

          {/* Large image — bleeds to the right edge feel */}
          <div className="col-span-7 py-16 pl-6">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={IMG.blue}
                alt="Artist direction"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-caption text-neutral-400 mt-3">
              Visual direction — tonal palette, lighting reference
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          CONFIDENCE BREAKDOWN — data + image
         ════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-12 gap-x-6 border-b border-neutral-200">

          {/* Image column */}
          <div className="col-span-4 py-16 pr-6 border-r border-neutral-200">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={IMG.motion}
                alt="Artistic direction"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-caption text-neutral-400 mt-3">
              Movement study — energy, texture
            </p>
          </div>

          {/* Confidence data */}
          <div className="col-span-4 py-16 px-6 border-r border-neutral-200">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
              Confidence Breakdown
            </p>
            <div className="space-y-6">
              <ConfidenceMeter value={92} label="Genre Fit" />
              <ConfidenceMeter value={87} label="Reference Artist Match" />
              <ConfidenceMeter value={74} label="Market Demand" />
              <ConfidenceMeter value={68} label="Playlist Potential" />
              <ConfidenceMeter value={55} label="Audience Reach" />
              <ConfidenceMeter value={28} label="Saturation Risk" />
            </div>
          </div>

          {/* Large numbers */}
          <div className="col-span-4 py-16 pl-6 flex flex-col justify-between">
            <div>
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
                Score
              </p>
              <p className="text-[120px] leading-none font-bold font-mono text-signal-green">
                87
              </p>
              <p className="text-body text-neutral-500 mt-4">
                Overall confidence score. Strong genre fit, healthy market
                demand, low saturation risk.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-neutral-400">Data sources</span>
                <span className="text-body-sm font-bold font-mono text-black">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-neutral-400">Reference artists</span>
                <span className="text-body-sm font-bold font-mono text-black">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-neutral-400">Playlists analyzed</span>
                <span className="text-body-sm font-bold font-mono text-black">38</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BOTTOM — counters + CTA
         ════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-12 gap-x-6 py-20">
          <div className="col-span-2">
            <p className="text-[80px] leading-none font-bold text-black">01</p>
            <p className="text-caption text-neutral-400 mt-2">Active project</p>
          </div>
          <div className="col-span-2">
            <p className="text-[80px] leading-none font-bold text-neutral-200">00</p>
            <p className="text-caption text-neutral-400 mt-2">Prompts generated</p>
          </div>
          <div className="col-span-2">
            <p className="text-[80px] leading-none font-bold text-neutral-200">00</p>
            <p className="text-caption text-neutral-400 mt-2">Tracks analyzed</p>
          </div>
          <div className="col-span-6 flex flex-col justify-end items-end text-right">
            <p className="text-body text-neutral-400 max-w-sm">
              The Sonic Engine is ready. Define your concept, run research,
              generate prompts.
            </p>
            <button className="mt-6 bg-black text-white text-label font-bold uppercase tracking-widest h-12 px-8 rounded-sm hover:bg-neutral-800 transition-colors duration-fast">
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          COLOPHON
         ════════════════════════════════════════ */}
      <div className="border-t border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 py-4 flex items-center justify-between">
          <p className="text-micro font-mono text-neutral-300">IMC v0.1.0</p>
          <p className="text-micro font-mono text-neutral-300">Music Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}

/* ———————— Editorial Components ———————— */

function MetricCompact({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-signal-green';
    if (v >= 60) return 'text-signal-yellow';
    if (v >= 40) return 'text-signal-orange';
    return 'text-signal-red';
  };

  return (
    <div>
      <p className="text-caption text-neutral-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-heading-lg font-bold font-mono ${getColor(value)}`}>{value}</span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>
    </div>
  );
}

function InstrumentRow({ number, name, status, statusColor }: {
  number: string;
  name: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'red' | 'neutral';
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-heading-sm font-bold text-neutral-200 font-mono">{number}</span>
      <div className="flex-1 pt-0.5">
        <p className="text-body font-bold text-black">{name}</p>
        <div className="mt-1">
          <Signal color={statusColor} label={status} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
      <span className="text-caption text-neutral-400">{label}</span>
      <span className="text-body-sm text-black font-bold">{value}</span>
    </div>
  );
}
