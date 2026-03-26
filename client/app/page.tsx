'use client';

import { Badge, Signal, ConfidenceMeter } from '../components/ui';

/* eslint-disable @next/next/no-img-element */

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Masthead */}
      <div className="border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <div>
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400">
              Instruments of Mass Creation
            </p>
          </div>
          <p className="text-micro font-mono text-neutral-300">
            March 2026
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10">

        {/* Hero — oversized project feature with artist image */}
        <div className="grid grid-cols-12 gap-x-6 border-b border-neutral-200">
          {/* Left: large project name + description */}
          <div className="col-span-7 py-16 pr-12 border-r border-neutral-200">
            <div className="flex items-center gap-3 mb-6">
              <Signal color="green" />
              <Badge variant="green">Active Project</Badge>
            </div>
            <a href="/projects/demo" className="block hover:opacity-80 transition-opacity duration-fast">
              <h1 className="text-[120px] leading-[0.9] font-bold tracking-tight text-black -ml-1">
                MMe.
              </h1>
            </a>
            <p className="text-body-lg text-neutral-500 mt-8 max-w-md">
              Symphonic × electronic. Where Ólafur Arnalds meets The Prodigy.
              A debut artist pushing genre boundaries through AI-assisted production.
            </p>
          </div>

          {/* Right: artist portrait, cropped tight */}
          <div className="col-span-5 py-16 pl-8 flex items-center justify-center">
            <div className="w-full max-w-[320px] aspect-[3/4] overflow-hidden">
              <img
                src="/images/greglutze_A_photograph_of_a_black_fashion_man_with_black_drea_06690802-0bdb-4c5d-84bd-ed8a8199d311_0.png"
                alt="MMe. — artist portrait"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* Editorial grid — three columns, mixed scale */}
        <div className="grid grid-cols-12 gap-x-6 border-b border-neutral-200">

          {/* Column 1: Instrument status */}
          <div className="col-span-4 py-10 border-r border-neutral-200 pr-6">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
              Pipeline
            </p>

            <div className="space-y-6">
              <InstrumentRow
                number="01"
                name="Market Research"
                status="Complete"
                statusColor="green"
              />
              <InstrumentRow
                number="02"
                name="Prompt Generation"
                status="In Progress"
                statusColor="yellow"
              />
              <InstrumentRow
                number="03"
                name="Track Analysis"
                status="On Hold"
                statusColor="neutral"
              />
            </div>
          </div>

          {/* Column 2: Concept excerpt */}
          <div className="col-span-4 py-10 border-r border-neutral-200 pr-6">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
              Artist Concept
            </p>

            <blockquote className="text-heading font-bold text-black leading-tight">
              &ldquo;Classical instruments processed through electronic production
              techniques&rdquo;
            </blockquote>

            <div className="mt-8 space-y-3">
              <DetailRow label="Genre" value="Neoclassical Electronic" />
              <DetailRow label="Influences" value="Arnalds, Prodigy, Burial" />
              <DetailRow label="BPM Range" value="110–140" />
              <DetailRow label="Mood" value="Melancholic, Driving" />
            </div>
          </div>

          {/* Column 3: Confidence breakdown */}
          <div className="col-span-4 py-10">
            <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-8">
              Confidence Breakdown
            </p>

            <div className="space-y-5">
              <ConfidenceMeter value={92} label="Genre Fit" />
              <ConfidenceMeter value={87} label="Reference Artist Match" />
              <ConfidenceMeter value={74} label="Market Demand" />
              <ConfidenceMeter value={68} label="Playlist Potential" />
              <ConfidenceMeter value={55} label="Audience Reach" />
              <ConfidenceMeter value={28} label="Saturation Risk" />
            </div>
          </div>
        </div>

        {/* Bottom strip — oversized number + context */}
        <div className="grid grid-cols-12 gap-x-6 py-16">
          <div className="col-span-3">
            <p className="text-[96px] leading-none font-bold text-black">01</p>
            <p className="text-body-sm text-neutral-400 mt-2">Active project</p>
          </div>
          <div className="col-span-3">
            <p className="text-[96px] leading-none font-bold text-neutral-200">00</p>
            <p className="text-body-sm text-neutral-400 mt-2">Prompts generated</p>
          </div>
          <div className="col-span-3">
            <p className="text-[96px] leading-none font-bold text-neutral-200">00</p>
            <p className="text-body-sm text-neutral-400 mt-2">Tracks analyzed</p>
          </div>
          <div className="col-span-3 flex flex-col justify-end">
            <p className="text-body-sm text-neutral-400">
              The Sonic Engine is ready. Define your concept, run research,
              generate prompts.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="/projects/demo"
                className="bg-black text-white text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:bg-neutral-800 transition-colors duration-fast inline-flex items-center"
              >
                Open Project
              </a>
              <a
                href="/projects/new"
                className="bg-white text-black border border-neutral-200 text-label font-bold uppercase tracking-widest h-10 px-5 rounded-sm hover:border-black transition-colors duration-fast inline-flex items-center"
              >
                New Project
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Colophon */}
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

function MetricLarge({ value, label, color }: { value: string; label: string; color: 'green' | 'yellow' | 'red' | 'neutral' }) {
  const colorMap = {
    green: 'text-signal-green',
    yellow: 'text-signal-yellow',
    red: 'text-signal-red',
    neutral: 'text-neutral-300',
  };

  return (
    <div className="flex items-end justify-between border-b border-neutral-100 pb-4">
      <span className="text-body-sm text-neutral-500">{label}</span>
      <span className={`text-[48px] leading-none font-bold font-mono ${colorMap[color]}`}>
        {value}
      </span>
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
      <span className="text-heading font-bold text-neutral-200 font-mono">{number}</span>
      <div className="flex-1 pt-1">
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
