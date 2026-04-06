'use client';

import { Button, Input, Badge, Card, CardHeader, CardTitle, CardDescription, Signal, Divider, ConfidenceMeter } from '../../components/ui';

export default function SystemPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <div className="border-b border-neutral-200 px-12 py-10">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-3">
          IMC Design System
        </p>
        <h1 className="text-display font-bold tracking-tight text-black">
          Component Reference
        </h1>
        <p className="text-body text-neutral-500 mt-2 max-w-xl">
          Dieter Rams meets Virgil Abloh. Functional color, Swiss typography, considered space.
        </p>
      </div>

      <div className="px-12 py-10 space-y-16 max-w-5xl">

        {/* ———————— TYPOGRAPHY ———————— */}
        <section>
          <SectionLabel>Typography</SectionLabel>

          <div className="space-y-6 mt-6">
            <div>
              <span className="text-micro text-neutral-400 font-mono">display-lg / 64px</span>
              <p className="text-display-lg font-bold text-black">Instruments</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">display / 48px</span>
              <p className="text-display font-bold text-black">Mass Creation</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">heading-lg / 36px</span>
              <p className="text-heading-lg font-bold text-black">Market Research</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">heading / 28px</span>
              <p className="text-heading font-bold text-black">Artist Concept</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">heading-sm / 20px</span>
              <p className="text-heading-sm font-bold text-black">Prompt Generation</p>
            </div>

            <Divider />

            <div>
              <span className="text-micro text-neutral-400 font-mono">body-lg / 17px</span>
              <p className="text-body-lg text-neutral-700">The Sonic Engine processes musical DNA through AI-assisted research and prompt engineering.</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">body / 15px</span>
              <p className="text-body text-neutral-600">Each instrument serves a specific function in the creative pipeline. Research informs prompts. Prompts inform production.</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">body-sm / 13px</span>
              <p className="text-body-sm text-neutral-500">Confidence scores are calculated from multiple data signals across Spotify&apos;s API.</p>
            </div>

            <Divider />

            <div>
              <span className="text-micro text-neutral-400 font-mono">label / 12px — uppercase</span>
              <p className="text-label font-bold uppercase tracking-widest text-neutral-500">Instrument One</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">caption / 11px</span>
              <p className="text-caption text-neutral-400">Last updated 3 hours ago</p>
            </div>
            <div>
              <span className="text-micro text-neutral-400 font-mono">mono / JetBrains Mono</span>
              <p className="font-mono text-body-sm text-neutral-600">confidence: 87 — genre_match: 0.92</p>
            </div>
          </div>
        </section>

        {/* ———————— COLORS ———————— */}
        <section>
          <SectionLabel>Signal Colors</SectionLabel>
          <p className="text-body-sm text-neutral-500 mt-2 mb-6">
            Color conveys meaning. Never decoration.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <ColorSwatch color="bg-signal-yellow" label="Yellow" hex="#FFD700" usage="Brand, primary action" />
            <ColorSwatch color="bg-signal-green" label="Green" hex="#00C853" usage="Success, active, high confidence" />
            <ColorSwatch color="bg-signal-orange" label="Orange" hex="#FF6B00" usage="Warning, attention needed" />
            <ColorSwatch color="bg-signal-red" label="Red" hex="#E53535" usage="Error, destructive, low confidence" />
            <ColorSwatch color="bg-signal-blue" label="Blue" hex="#2979FF" usage="Info, links, navigation" />
            <ColorSwatch color="bg-signal-violet" label="Violet" hex="#7C4DFF" usage="AI/intelligence indicator" />
          </div>

          <div className="grid grid-cols-6 gap-2 mt-8">
            {['bg-black', 'bg-neutral-900', 'bg-neutral-800', 'bg-neutral-700', 'bg-neutral-600', 'bg-neutral-500'].map((bg, i) => (
              <div key={i} className="space-y-1">
                <div className={`h-12 ${bg}`} />
                <p className="text-micro text-neutral-400 font-mono">{['black', '900', '800', '700', '600', '500'][i]}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {['bg-neutral-400', 'bg-neutral-300', 'bg-neutral-200', 'bg-neutral-100', 'bg-neutral-50', 'bg-white'].map((bg, i) => (
              <div key={i} className="space-y-1">
                <div className={`h-12  border border-neutral-200 ${bg}`} />
                <p className="text-micro text-neutral-400 font-mono">{['400', '300', '200', '100', '50', 'white'][i]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ———————— BUTTONS ———————— */}
        <section>
          <SectionLabel>Buttons</SectionLabel>

          <div className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <div className="flex items-center gap-3">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* ———————— INPUTS ———————— */}
        <section>
          <SectionLabel>Inputs</SectionLabel>

          <div className="space-y-4 mt-6 max-w-md">
            <Input label="Artist Name" placeholder="Enter artist name" />
            <Input label="Email" placeholder="you@label.com" hint="We'll use this for your account" />
            <Input label="Genre" placeholder="Required" error="Genre is required" />
            <Input label="Search" placeholder="Search projects..." disabled />
          </div>
        </section>

        {/* ———————— BADGES ———————— */}
        <section>
          <SectionLabel>Badges</SectionLabel>

          <div className="flex flex-wrap items-center gap-2 mt-6">
            <Badge>Default</Badge>
            <Badge variant="yellow">In Progress</Badge>
            <Badge variant="green">Active</Badge>
            <Badge variant="red">Error</Badge>
            <Badge variant="orange">Warning</Badge>
            <Badge variant="blue">Info</Badge>
            <Badge variant="violet">AI Generated</Badge>
          </div>
        </section>

        {/* ———————— SIGNALS ———————— */}
        <section>
          <SectionLabel>Signals</SectionLabel>
          <p className="text-body-sm text-neutral-500 mt-2 mb-6">
            Status at a glance. No words needed.
          </p>

          <div className="space-y-3">
            <Signal color="green" label="Online" />
            <Signal color="yellow" label="Processing" pulse />
            <Signal color="red" label="Failed" />
            <Signal color="violet" label="AI Analysis Running" pulse />
          </div>

          <div className="flex items-center gap-6 mt-6">
            <Signal color="green" shape="bar" label="Research" />
            <Signal color="yellow" shape="bar" label="Prompting" />
            <Signal color="blue" shape="bar" label="Analysis" />
            <Signal color="neutral" shape="bar" label="Draft" />
          </div>
        </section>

        {/* ———————— CONFIDENCE ———————— */}
        <section>
          <SectionLabel>Confidence Meters</SectionLabel>

          <div className="space-y-4 mt-6 max-w-md">
            <ConfidenceMeter value={92} label="Genre Match" />
            <ConfidenceMeter value={74} label="Market Viability" />
            <ConfidenceMeter value={55} label="Audience Reach" />
            <ConfidenceMeter value={28} label="Saturation Risk" />
          </div>

          <div className="space-y-2 mt-6 max-w-md">
            <p className="text-caption text-neutral-400">Compact variant</p>
            <ConfidenceMeter value={87} label="Overall" size="sm" />
          </div>
        </section>

        {/* ———————— CARDS ———————— */}
        <section>
          <SectionLabel>Cards</SectionLabel>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card hoverable>
              <CardHeader>
                <CardTitle>MMe.</CardTitle>
                <Badge variant="green">Active</Badge>
              </CardHeader>
              <CardDescription>
                Symphonic meets beat-driven. Ólafur Arnalds meets The Prodigy.
              </CardDescription>
              <div className="mt-4 space-y-2">
                <ConfidenceMeter value={87} label="Research Score" size="sm" />
              </div>
            </Card>

            <Card hoverable>
              <CardHeader>
                <CardTitle>New Project</CardTitle>
                <Badge variant="yellow">Draft</Badge>
              </CardHeader>
              <CardDescription>
                Concept in development. No research data yet.
              </CardDescription>
              <div className="mt-4 flex items-center gap-3">
                <Signal color="yellow" label="Awaiting concept" />
              </div>
            </Card>
          </div>
        </section>

        {/* ———————— DIVIDERS ———————— */}
        <section>
          <SectionLabel>Dividers</SectionLabel>

          <div className="space-y-6 mt-6">
            <Divider />
            <Divider label="Section Break" />
            <Divider label="Instrument 2" />
          </div>
        </section>

        {/* ———————— SPACING ———————— */}
        <section>
          <SectionLabel>Spacing Scale</SectionLabel>
          <p className="text-body-sm text-neutral-500 mt-2 mb-6">
            4px base grid. Everything aligns.
          </p>

          <div className="space-y-2">
            {[
              { name: '1', px: '4px' },
              { name: '2', px: '8px' },
              { name: '3', px: '12px' },
              { name: '4', px: '16px' },
              { name: '6', px: '24px' },
              { name: '8', px: '32px' },
              { name: '10', px: '40px' },
              { name: '12', px: '48px' },
            ].map(({ name, px }) => (
              <div key={name} className="flex items-center gap-4">
                <span className="text-micro font-mono text-neutral-400 w-16">{name} / {px}</span>
                <div className="h-3 bg-black/5 border border-black/10 " style={{ width: px }} />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="pb-20">
          <Divider label="End" />
          <p className="text-caption text-neutral-400 mt-6 text-center">
            IMC Design System v0.1 — Helvetica Neue Bold × JetBrains Mono × Signal Colors
          </p>
        </div>

      </div>
    </div>
  );
}

/* ———————— Helper Components ———————— */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-micro font-bold uppercase tracking-widest text-black">
      {children}
    </h2>
  );
}

function ColorSwatch({ color, label, hex, usage }: { color: string; label: string; hex: string; usage: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-16  ${color}`} />
      <div>
        <p className="text-label font-bold text-black">{label}</p>
        <p className="text-micro font-mono text-neutral-400">{hex}</p>
        <p className="text-caption text-neutral-400 mt-0.5">{usage}</p>
      </div>
    </div>
  );
}
