/**
 * Project Brief PDF Generator
 *
 * Generates a clean, editorial PDF combining concept, palette, research highlights,
 * and tracklist. Uses jsPDF for client-side PDF creation.
 */

import jsPDF from 'jspdf';
import type { ProjectConcept, I1Report, I1Confidence } from './api';
import type { ExtractedColor } from './colorExtract';

interface BriefData {
  artistName: string;
  createdDate: string;
  concept: ProjectConcept | null;
  report: { report: I1Report; confidence: I1Confidence } | null;
  palette: ExtractedColor[];
  trackNames: string[];
  moodboardBrief?: string | null;
}

// Design tokens
const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Colors
const BLACK = '#000000';
const GRAY_400 = '#a3a3a3';
const GRAY_200 = '#e5e5e5';

function setFont(doc: jsPDF, style: 'label' | 'heading' | 'body' | 'title' | 'caption') {
  switch (style) {
    case 'label':
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRAY_400);
      break;
    case 'caption':
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(GRAY_400);
      break;
    case 'heading':
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BLACK);
      break;
    case 'title':
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BLACK);
      break;
    case 'body':
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BLACK);
      break;
  }
}

function drawSectionLabel(doc: jsPDF, y: number, label: string): number {
  setFont(doc, 'label');
  doc.text(label.toUpperCase(), MARGIN, y);
  return y + 14;
}

function drawHorizontalRule(doc: jsPDF, y: number): number {
  doc.setDrawColor(GRAY_200);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 16;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN + 20;
  }
  return y;
}

export function generateProjectBrief(data: BriefData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let y = MARGIN;

  // ── COVER / HEADER ──
  setFont(doc, 'label');
  doc.text('PROJECT BRIEF', MARGIN, y);
  y += 8;
  setFont(doc, 'caption');
  doc.text(`Generated ${data.createdDate}`, MARGIN, y);
  y += 36;

  // Artist name
  setFont(doc, 'title');
  const nameLines = wrapText(doc, data.artistName, CONTENT_WIDTH);
  doc.text(nameLines, MARGIN, y);
  y += nameLines.length * 40 + 8;

  // Genre / mood subtitle
  if (data.concept) {
    setFont(doc, 'body');
    doc.setTextColor(GRAY_400);
    const subtitle = [
      data.concept.genre_primary,
      ...(data.concept.genre_secondary || []),
    ].filter(Boolean).join(' · ');
    if (subtitle) {
      doc.text(subtitle, MARGIN, y);
      y += 16;
    }
    if (data.concept.mood_keywords && data.concept.mood_keywords.length > 0) {
      doc.text(data.concept.mood_keywords.join(' / '), MARGIN, y);
      y += 16;
    }
  }

  y += 12;
  y = drawHorizontalRule(doc, y);

  // ── CREATIVE DIRECTION ──
  if (data.concept?.creative_direction) {
    y = drawSectionLabel(doc, y, 'Creative Direction');
    setFont(doc, 'body');
    doc.setFontSize(12);
    doc.setTextColor(BLACK);
    const dirLines = wrapText(doc, data.concept.creative_direction, CONTENT_WIDTH);
    doc.text(dirLines, MARGIN, y);
    y += dirLines.length * 16 + 20;
    y = drawHorizontalRule(doc, y);
  }

  // ── CONCEPT DETAILS ──
  if (data.concept) {
    y = checkPageBreak(doc, y, 120);
    y = drawSectionLabel(doc, y, 'Concept');

    const fields: [string, string][] = [
      ['Primary Genre', data.concept.genre_primary || '—'],
      ['Secondary', (data.concept.genre_secondary || []).join(', ') || '—'],
      ['Reference Artists', (data.concept.reference_artists || []).join(', ') || '—'],
      ['Target Audience', data.concept.target_audience || '—'],
      ['Mood', (data.concept.mood_keywords || []).join(', ') || '—'],
      ['Track Count', String(data.concept.track_count || '—')],
    ];

    for (const [label, value] of fields) {
      y = checkPageBreak(doc, y, 24);
      setFont(doc, 'label');
      doc.text(label.toUpperCase(), MARGIN, y);
      setFont(doc, 'body');
      const valLines = wrapText(doc, value, CONTENT_WIDTH - 120);
      doc.text(valLines, MARGIN + 120, y);
      y += Math.max(valLines.length * 14, 14) + 6;
    }

    y += 10;
    y = drawHorizontalRule(doc, y);
  }

  // ── COLOR PALETTE ──
  if (data.palette.length > 0) {
    y = checkPageBreak(doc, y, 80);
    y = drawSectionLabel(doc, y, 'Visual Palette');

    const swatchSize = 32;
    const gap = 8;
    const totalSwatchWidth = data.palette.length * swatchSize + (data.palette.length - 1) * gap;
    let sx = MARGIN;

    // Draw swatches
    for (const color of data.palette) {
      doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
      doc.roundedRect(sx, y, swatchSize, swatchSize, 2, 2, 'F');
      sx += swatchSize + gap;
    }
    y += swatchSize + 8;

    // Hex labels
    sx = MARGIN;
    setFont(doc, 'caption');
    doc.setFontSize(6);
    for (const color of data.palette) {
      doc.text(color.hex, sx + swatchSize / 2, y, { align: 'center' });
      sx += swatchSize + gap;
    }
    y += 20;
    y = drawHorizontalRule(doc, y);
  }

  // ── SONIC BRIEF ──
  if (data.moodboardBrief) {
    y = checkPageBreak(doc, y, 80);
    y = drawSectionLabel(doc, y, 'Sonic Brief');
    setFont(doc, 'body');
    const briefLines = wrapText(doc, data.moodboardBrief, CONTENT_WIDTH);
    doc.text(briefLines, MARGIN, y);
    y += briefLines.length * 14 + 20;
    y = drawHorizontalRule(doc, y);
  }

  // ── RESEARCH HIGHLIGHTS ──
  if (data.report) {
    const r = data.report.report;

    // Market Overview
    y = checkPageBreak(doc, y, 100);
    y = drawSectionLabel(doc, y, 'Market Intelligence');

    setFont(doc, 'body');
    if (r.market_overview.genre_landscape) {
      const overviewLines = wrapText(doc, r.market_overview.genre_landscape, CONTENT_WIDTH);
      doc.text(overviewLines, MARGIN, y);
      y += overviewLines.length * 14 + 8;
    }

    // Key trends as inline list
    if (r.market_overview.key_trends && r.market_overview.key_trends.length > 0) {
      setFont(doc, 'label');
      doc.text('KEY TRENDS', MARGIN, y);
      y += 12;
      setFont(doc, 'body');
      for (const trend of r.market_overview.key_trends.slice(0, 4)) {
        y = checkPageBreak(doc, y, 16);
        const trendLines = wrapText(doc, `— ${trend}`, CONTENT_WIDTH - 10);
        doc.text(trendLines, MARGIN + 10, y);
        y += trendLines.length * 14 + 4;
      }
      y += 8;
    }

    // Comparable artists
    if (r.comparable_artists && r.comparable_artists.length > 0) {
      y = checkPageBreak(doc, y, 60);
      setFont(doc, 'label');
      doc.text('COMPARABLE ARTISTS', MARGIN, y);
      y += 12;
      setFont(doc, 'body');
      const artistList = r.comparable_artists.slice(0, 5).map(
        a => `${a.name} (${(a.monthly_listeners / 1000).toFixed(0)}K listeners)`
      ).join(' · ');
      const artistLines = wrapText(doc, artistList, CONTENT_WIDTH);
      doc.text(artistLines, MARGIN, y);
      y += artistLines.length * 14 + 12;
    }

    // Audience
    if (r.audience_profile) {
      y = checkPageBreak(doc, y, 60);
      setFont(doc, 'label');
      doc.text('AUDIENCE PROFILE', MARGIN, y);
      y += 12;
      setFont(doc, 'body');
      const audienceStr = [
        `${r.audience_profile.primary_age_range}, ${r.audience_profile.gender_split}`,
        `Markets: ${r.audience_profile.top_markets?.slice(0, 3).join(', ')}`,
        `Platforms: ${r.audience_profile.platforms?.slice(0, 3).join(', ')}`,
      ].join(' · ');
      const audLines = wrapText(doc, audienceStr, CONTENT_WIDTH);
      doc.text(audLines, MARGIN, y);
      y += audLines.length * 14 + 12;
    }

    // Sonic Blueprint
    if (r.sonic_blueprint) {
      y = checkPageBreak(doc, y, 60);
      setFont(doc, 'label');
      doc.text('SONIC BLUEPRINT', MARGIN, y);
      y += 12;
      setFont(doc, 'body');
      const sonicParts = [
        r.sonic_blueprint.bpm_range && `BPM: ${r.sonic_blueprint.bpm_range}`,
        r.sonic_blueprint.energy_profile && `Energy: ${r.sonic_blueprint.energy_profile}`,
        r.sonic_blueprint.production_style && `Production: ${r.sonic_blueprint.production_style}`,
      ].filter(Boolean).join(' · ');
      if (sonicParts) {
        const sonicLines = wrapText(doc, sonicParts, CONTENT_WIDTH);
        doc.text(sonicLines, MARGIN, y);
        y += sonicLines.length * 14 + 8;
      }
      if (r.sonic_blueprint.sonic_signatures && r.sonic_blueprint.sonic_signatures.length > 0) {
        const sigStr = r.sonic_blueprint.sonic_signatures.join(', ');
        const sigLines = wrapText(doc, `Signatures: ${sigStr}`, CONTENT_WIDTH);
        doc.text(sigLines, MARGIN, y);
        y += sigLines.length * 14 + 8;
      }
    }

    // Top opportunities
    if (r.opportunities && r.opportunities.length > 0) {
      y = checkPageBreak(doc, y, 60);
      y += 4;
      setFont(doc, 'label');
      doc.text('OPPORTUNITIES', MARGIN, y);
      y += 12;
      setFont(doc, 'body');
      for (const opp of r.opportunities.slice(0, 3)) {
        y = checkPageBreak(doc, y, 16);
        const oppLines = wrapText(doc, `— ${opp.gap} (${Math.round(opp.success_probability * 100)}% probability)`, CONTENT_WIDTH - 10);
        doc.text(oppLines, MARGIN + 10, y);
        y += oppLines.length * 14 + 4;
      }
    }

    y += 10;
    y = drawHorizontalRule(doc, y);
  }

  // ── TRACKLIST ──
  if (data.trackNames.length > 0) {
    y = checkPageBreak(doc, y, 40 + data.trackNames.length * 18);
    y = drawSectionLabel(doc, y, 'Tracklist');

    for (let i = 0; i < data.trackNames.length; i++) {
      y = checkPageBreak(doc, y, 18);
      setFont(doc, 'caption');
      doc.setFontSize(8);
      doc.setTextColor(GRAY_400);
      doc.text(String(i + 1).padStart(2, '0'), MARGIN, y);
      setFont(doc, 'body');
      doc.text(data.trackNames[i], MARGIN + 24, y);
      y += 18;
    }
    y += 10;
  }

  // ── FOOTER ──
  y = checkPageBreak(doc, y, 40);
  doc.setDrawColor(GRAY_200);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 16;
  setFont(doc, 'caption');
  doc.setFontSize(7);
  doc.text('Generated by IMC — Instruments of Mass Creation', MARGIN, y);

  // Confidence score if available
  if (data.report?.confidence) {
    const conf = data.report.confidence;
    doc.text(
      `Research confidence: ${Math.round(conf.overall_score * 100)}% · Data completeness: ${Math.round(conf.data_completeness * 100)}%`,
      PAGE_WIDTH - MARGIN,
      y,
      { align: 'right' }
    );
  }

  // Download
  const safeName = data.artistName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`${safeName}_project_brief.pdf`);
}
