'use client';

/**
 * /design — Theme comparison page.
 * Shows the same representative IMC layout rendered in both
 * the current design system (V1) and the Open-influenced alternative (V2).
 *
 * This page is additive — it doesn't modify any existing code.
 */

import '../../app/theme-open.css';
import { Button, ButtonV2 } from '../../components/ui';

// ─── Fake data for the demo ───────────────────────────────

const PROJECT = {
  artist: 'Marlowe',
  genre: 'Electronic / Ambient',
  moods: ['Ethereal', 'Nocturnal', 'Wide'],
  status: 'Concept locked',
  date: 'Mar 2026',
  confidence: 87,
};

const TRACKS = [
  { id: '1', num: '01', title: 'Dissolve', format: 'WAV', duration: '3:42', plays: 128 },
  { id: '2', num: '02', title: 'Half Light', format: 'WAV', duration: '4:18', plays: 94 },
  { id: '3', num: '03', title: 'Undertow', format: 'FLAC', duration: '5:01', plays: 67 },
  { id: '4', num: '04', title: 'Slow Vertigo', format: 'WAV', duration: '3:55', plays: 41 },
];

const BRIEF_TEXT =
  'An ambient-electronic landscape that moves between stillness and slow momentum. The production should feel cavernous and wide — reverb-heavy pads layered beneath crisp, minimal percussion. Think late-night drives through fog. The vocal treatment should be processed and distant, more texture than lyric.';

const PALETTE = [
  { hex: '#1A1A2E', pct: 35 },
  { hex: '#16213E', pct: 25 },
  { hex: '#0F3460', pct: 20 },
  { hex: '#533483', pct: 12 },
  { hex: '#E94560', pct: 8 },
];


// ─── Page ─────────────────────────────────────────────────

export default function DesignComparison() {
  return (
    <div className="min-h-screen bg-neutral-100 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-10 py-8">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
          Design System
        </p>
        <h1 className="text-heading-lg font-bold tracking-tight text-black">
          Theme Comparison
        </h1>
        <p className="text-body text-neutral-500 mt-2 max-w-xl">
          The same IMC layout rendered in two design languages. V1 (current) on the left, V2 (Open-influenced) on the right.
        </p>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-6 p-6 max-w-[1800px] mx-auto">
        {/* ═══ V1: Current Design ═══ */}
        <div className="bg-white overflow-hidden border border-neutral-200">
          <div className="bg-black text-white px-6 py-3">
            <span className="text-micro font-bold uppercase tracking-widest">V1 — Current</span>
          </div>
          <V1Demo />
        </div>

        {/* ═══ V2: Open-Influenced ═══ */}
        <div className="theme-open bg-white overflow-hidden border border-neutral-200">
          <div style={{ background: '#1A1A1A', color: '#fff', padding: '12px 24px' }}>
            <span style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>V2 — Open</span>
          </div>
          <V2Demo />
        </div>
      </div>

      {/* Button showcase */}
      <div className="grid grid-cols-2 gap-6 px-6 pb-12 max-w-[1800px] mx-auto">
        {/* V1 buttons */}
        <div className="bg-white overflow-hidden border border-neutral-200 p-8">
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-6">V1 Buttons</p>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-ghost">Danger Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="media" size="sm" data-active>
              <span className="text-[10px]">▶</span>
            </Button>
            <Button variant="media" size="md" data-active>
              <span className="text-[11px]">▶</span>
            </Button>
            <Button variant="media" size="lg" data-active>
              <span className="text-[12px]">▶</span>
            </Button>
          </div>
        </div>

        {/* V2 buttons */}
        <div className="theme-open bg-white overflow-hidden border border-neutral-200 p-8">
          <p className="t-label" style={{ color: 'var(--color-muted)', marginBottom: 24 }}>V2 Buttons</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <ButtonV2>Primary</ButtonV2>
            <ButtonV2 variant="secondary">Secondary</ButtonV2>
            <ButtonV2 variant="ghost">Ghost</ButtonV2>
            <ButtonV2 variant="danger">Danger</ButtonV2>
            <ButtonV2 variant="danger-ghost">Danger Ghost</ButtonV2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <ButtonV2 size="sm">Small</ButtonV2>
            <ButtonV2 size="md">Medium</ButtonV2>
            <ButtonV2 size="lg">Large</ButtonV2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ButtonV2 variant="media" size="sm">
              <span style={{ fontSize: 10 }}>▶</span>
            </ButtonV2>
            <ButtonV2 variant="media" size="md">
              <span style={{ fontSize: 11 }}>▶</span>
            </ButtonV2>
            <ButtonV2 variant="media" size="lg">
              <span style={{ fontSize: 12 }}>▶</span>
            </ButtonV2>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// V1 — Current design system
// ═══════════════════════════════════════════════════════════════

function V1Demo() {
  return (
    <div>
      {/* Hero */}
      <div className="px-8 pt-10 pb-8 border-b border-neutral-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
            {PROJECT.status}
          </span>
          <Button variant="secondary" size="sm" className="ml-auto">
            Export Brief
          </Button>
        </div>
        <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
          {PROJECT.artist}
        </h2>
        <div className="flex items-center gap-6 mt-6">
          <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">
            {PROJECT.genre}
          </span>
          <span className="text-micro uppercase tracking-widest text-neutral-300">
            {PROJECT.moods.join(' / ')}
          </span>
        </div>
        <span className="text-micro font-mono text-neutral-300 mt-2 block">{PROJECT.date}</span>
      </div>

      {/* Sonic Brief */}
      <div className="px-8 py-8 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-label font-bold uppercase tracking-widest text-black">
            Sonic Brief
          </span>
          <Button variant="ghost" size="sm">Regenerate</Button>
        </div>
        <p className="text-body-lg text-black leading-relaxed max-w-xl">
          {BRIEF_TEXT}
        </p>
      </div>

      {/* Color palette */}
      <div className="px-8 py-6 border-b border-neutral-200">
        <span className="text-label font-bold uppercase tracking-widest text-neutral-400 mb-3 block">
          Color Palette
        </span>
        <div className="flex gap-0 overflow-hidden h-10">
          {PALETTE.map((c) => (
            <div key={c.hex} style={{ backgroundColor: c.hex, flex: c.pct }} />
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-label font-bold uppercase tracking-widest text-neutral-400">
            Tracks ({TRACKS.length})
          </span>
        </div>
        <div className="space-y-1">
          {TRACKS.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3 border border-neutral-200 hover:border-neutral-300 transition-colors duration-fast">
              <Button variant="media" size="sm">
                <span className="text-[10px] leading-none">▶</span>
              </Button>
              <span className="text-caption font-mono text-neutral-300 w-5 text-center">{t.num}</span>
              <span className="text-body font-bold text-black flex-1 truncate">{t.title}</span>
              <span className="text-micro text-neutral-300 uppercase tracking-widest">{t.format}</span>
              <span className="text-micro text-neutral-400">{t.plays} plays</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// V2 — Open-influenced design system
// ═══════════════════════════════════════════════════════════════

function V2Demo() {
  return (
    <div>
      {/* Hero — editorial serif display, generous spacing */}
      <div style={{ padding: '48px 40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
          <span className="t-label" style={{ color: 'var(--color-muted)' }}>
            {PROJECT.status}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <ButtonV2 variant="secondary" size="sm">Export Brief</ButtonV2>
          </div>
        </div>

        <h2 className="t-display" style={{ color: 'var(--color-fg)' }}>
          {PROJECT.artist}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
          <span className="t-caption" style={{ color: 'var(--color-muted)' }}>
            {PROJECT.genre}
          </span>
          <span style={{ color: 'var(--color-faint)', fontSize: 10 }}>|</span>
          <span className="t-caption" style={{ color: 'var(--color-faint)' }}>
            {PROJECT.moods.join(' / ')}
          </span>
        </div>
        <span className="t-mono" style={{ color: 'var(--color-faint)', marginTop: 8, display: 'block' }}>
          {PROJECT.date}
        </span>
      </div>

      {/* Divider */}
      <div style={{ margin: '0 40px', borderTop: '1px solid var(--color-border)' }} />

      {/* Sonic Brief */}
      <div style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span className="t-label" style={{ color: 'var(--color-muted)' }}>
            Sonic Brief
          </span>
          <ButtonV2 variant="ghost" size="sm" arrow={false}>Regenerate</ButtonV2>
        </div>
        <p className="t-body-lg" style={{ color: 'var(--color-fg)', maxWidth: 540 }}>
          {BRIEF_TEXT}
        </p>
      </div>

      {/* Divider */}
      <div style={{ margin: '0 40px', borderTop: '1px solid var(--color-border)' }} />

      {/* Color palette — softer radius */}
      <div style={{ padding: '24px 40px' }}>
        <span className="t-label" style={{ color: 'var(--color-muted)', display: 'block', marginBottom: 12 }}>
          Color Palette
        </span>
        <div style={{ display: 'flex', gap: 3, overflow: 'hidden', height: 40 }}>
          {PALETTE.map((c) => (
            <div key={c.hex} style={{ backgroundColor: c.hex, flex: c.pct }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {PALETTE.map((c) => (
            <span key={c.hex} className="tag-open" style={{ fontSize: 10, padding: '2px 8px' }}>
              {c.hex}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: '0 40px', borderTop: '1px solid var(--color-border)' }} />

      {/* Tracks — cleaner, more air */}
      <div style={{ padding: '24px 40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span className="t-label" style={{ color: 'var(--color-muted)' }}>
            Tracks ({TRACKS.length})
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TRACKS.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 16px',
                border: '1px solid var(--color-border)',
                transition: 'border-color 150ms',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
            >
              <ButtonV2 variant="media" size="sm" data-active="false">
                <span style={{ fontSize: 10, lineHeight: 1 }}>▶</span>
              </ButtonV2>
              <span className="t-mono" style={{ color: 'var(--color-faint)', width: 20, textAlign: 'center' }}>{t.num}</span>
              <span className="t-body" style={{ fontWeight: 600, color: 'var(--color-fg)', flex: 1 }}>{t.title}</span>
              <span className="t-caption">{t.format}</span>
              <span className="t-caption">{t.plays} plays</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
