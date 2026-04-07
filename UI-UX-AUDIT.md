# IMC Platform — UI/UX Consistency Audit

**Date:** April 2, 2026
**Perspective:** Senior UI/UX Designer
**Core User Feedback:** "People don't understand what to do after each step, or where to go."

---

## 1. WAYFINDING & NEXT STEPS — Critical Priority

The single biggest issue. Users complete an action and hit a dead end with no indication of what comes next. The platform has a clear sequential workflow (Concept → Audio/Visuals → Research → Sonic Engine → LyriCol → Tracks) but this progression is only visible from the project home "Toolkit" grid. Once inside any instrument, users are on their own.

### What's missing

**After completing Concept (interview chat):**
- Concept locks in and a "Concept Extracted" badge appears, but there is zero guidance telling the user to go to Audio/Visuals or Research next. The chat just sits there.
- **Fix:** Add a "next step" banner below the concept card: "Your concept is locked in. Next: upload visual references in Audio/Visuals, or jump straight to Research." with CTA buttons.

**After uploading moodboard images (Audio/Visuals):**
- Images upload, palette extracts, brief generates — then nothing. No signal that the user should move to Research.
- **Fix:** Once the sonic brief is generated, show a "Ready for Research" prompt with a link to the Research tab.

**After Research completes:**
- The report renders with a Regenerate button. No mention that Sonic Engine is the next step, or that it auto-generates when you visit it.
- **Fix:** Add a persistent "Next: Sonic Engine →" CTA at the bottom of the report, or a banner at the top.

**After Sonic Engine generates (prompts page):**
- Style Profile, Demo Prompts, and Vocalist Persona tabs are available. No guidance on what the user should do with this information, or that LyriCol and Tracks are the next steps.
- **Fix:** Add a footer section: "Your production intelligence is ready. Start writing lyrics in LyriCol, or create a share link in Tracks."

**After a LyriCol session:**
- The lyrics session page (`lyrics/[sessionId]`) is completely untouched by the Open design update and has no forward navigation.
- **Fix:** After a writing session, surface a "Back to themes" or "Create another session" CTA, plus a link to Tracks.

**After creating a share link (Tracks):**
- The share detail page (`share/[shareId]`) is also completely untouched. No celebratory "you did it" moment or checklist nudge.
- **Fix:** Link back to the Checklist or project home with a completion signal.

### What's working well

- The **project home Toolkit grid** has excellent status labels ("Start Here", "Ready to Run", "Needs Concept", "Locked In") that clearly communicate prerequisites and progress.
- The **Sonic Engine** has good prerequisite blocking: "Start With Your Concept" message when no concept exists.
- The **Research** tab auto-runs when concept is ready — good progressive automation.
- The **Lyrics page** has strong wayfinding: "Start Writing →" CTAs on theme cards, prerequisite blocking ("Define your artist concept first...").
- The **Checklist** component has progress-based messaging ("Let's get you launch-ready" → "Almost there" → "Launch-ready").

### Recommended pattern

Every instrument page should have a persistent footer bar or "up next" section:

```
┌─────────────────────────────────────────────────────┐
│  ✓ Concept locked in          Next: Audio/Visuals → │
│  Step 1 of 6                                        │
└─────────────────────────────────────────────────────┘
```

---

## 2. TYPOGRAPHY CONSISTENCY

The app is mid-migration between two systems. Old custom classes and new inline Open tokens coexist, creating visual inconsistency.

### Old classes still in use (should be migrated)

| Old Class | New Equivalent | Files Using Old |
|-----------|---------------|-----------------|
| `text-micro` | `text-[11px] font-medium uppercase tracking-wide` | page.tsx (home), ProjectNav, Checklist, ShowreelPlayer, TrackAnnotations, SharePreview, checklist/page.tsx |
| `text-body` | `text-[14px]` or `text-[16px]` | page.tsx (home), Checklist |
| `text-body-sm` | `text-[13px]` | page.tsx (home), Checklist, ShowreelPlayer, TrackAnnotations |
| `text-body-lg` | `text-[16px]` or `text-[18px]` | page.tsx (home — research loading) |
| `text-caption` | `text-[13px] font-mono` | page.tsx (home) |
| `text-label` | `text-[11px] font-semibold uppercase tracking-wide` | page.tsx (home), TrackAnnotations |
| `text-heading` | `text-[22px] font-medium` | Checklist, checklist/page.tsx |
| `t-display` | `text-[40px] leading-[1.1] font-medium tracking-tight` | (home empty state) |

**Total:** ~283 instances across 26 files.

### Action items

- **High priority:** Migrate `page.tsx` (project home) — it's the most-visited page and has 11 old typography classes.
- **High priority:** Migrate `ProjectNav.tsx` — seen on every page, uses `text-micro` and `text-body`.
- **Medium:** Migrate Checklist.tsx (7 old classes), ShowreelPlayer (5), TrackAnnotations (6).
- **Low:** SharePreview (1 — public-facing component, may have intentional styling).

---

## 3. COLOR TOKEN CONSISTENCY

Same mid-migration issue. Tailwind `neutral-*` classes should be replaced with explicit hex Open tokens.

### Token mapping

| Old Tailwind | Open Token |
|-------------|------------|
| `text-neutral-500` | `text-[#8A8A8A]` |
| `text-neutral-400` | `text-[#8A8A8A]` or `text-[#C4C4C4]` |
| `text-neutral-300` | `text-[#C4C4C4]` |
| `text-neutral-200` | `text-[#C4C4C4]` |
| `text-neutral-100` | `text-[#E8E8E8]` |
| `bg-neutral-100` | `bg-[#EEEDEB]` or `bg-[#F7F7F5]` |
| `bg-neutral-50` | `bg-[#F7F7F5]` |
| `border-neutral-100` | `border-[#E8E8E8]` |
| `border-neutral-300` | `border-[#E8E8E8]` |

**Total:** ~323 instances across 27 files.

### Worst offenders

| File | Old neutral-* Count |
|------|-------------------|
| `projects/[id]/page.tsx` (home) | 29 |
| `share/[shareId]/page.tsx` | 24 |
| `lyrics/[sessionId]/page.tsx` | 18 |
| Checklist.tsx | 15 |
| SharePreview.tsx | 11 |

---

## 4. BUTTON CONSISTENCY

Three different button patterns exist simultaneously.

### Current state

| Pattern | Where Used | Style |
|---------|-----------|-------|
| **ButtonV2** (correct) | Concept, Share, Sonic Engine, Lyrics, Checklist | CSS class-based from theme-open.css, `rounded-full` |
| **Custom inline pill** | Toolkit cards (home), VisualMoodboard regenerate | `rounded-full border border-[#E8E8E8]` — visually similar but not using ButtonV2 |
| **Old custom buttons** | `projects/new/page.tsx` submit, research loading states | `rounded-md bg-black` — wrong radius, wrong color |

### Action items

- **`projects/new/page.tsx`:** Replace submit button `rounded-md bg-black` → ButtonV2 primary. Replace inputs `border border-[#E8E8E8] rounded-md` → `bg-[#F7F7F5] border-none rounded-lg`.
- **Toolkit card CTAs (home):** These custom pill buttons are fine visually but should use ButtonV2 `variant="secondary"` for consistency.
- **VisualMoodboard regenerate button:** Already pill-styled but handcrafted. Switch to ButtonV2 `variant="ghost"`.

---

## 5. BORDER RADIUS CONSISTENCY

| Pattern | Usage | Correct? |
|---------|-------|----------|
| `rounded-lg` | Cards, inputs, containers | ✓ Open standard |
| `rounded-full` | Buttons, pills, tags | ✓ Open standard |
| `rounded-2xl` | Auth cards (login/register) | ✓ Intentional for frosted glass |
| `rounded-md` | ~64 instances in app/ | ✗ Should be `rounded-lg` |
| `rounded-sm` | Sonic Engine skeletons | ✓ Acceptable for tiny elements |

### Files with `rounded-md` to fix

- `projects/[id]/page.tsx` — hero image, skeleton loaders, moodboard grid, instrument card skeletons (14 instances)
- `share/[shareId]/page.tsx` — throughout (26 instances)
- `lyrics/[sessionId]/page.tsx` — throughout (18 instances)
- `projects/new/page.tsx` — inputs, buttons
- Checklist.tsx — checkbox, textarea (2)
- ShowreelPlayer.tsx — player container (1)
- TrackAnnotations.tsx — container (1)
- SharePreview.tsx — artwork containers (2)

---

## 6. LOADING & SKELETON STATES

### Current inconsistencies

**Three different skeleton color schemes:**
1. `bg-neutral-100` with `rounded-md` — old pattern (home page, Checklist, prompts page nav skeleton)
2. `bg-[#EEEDEB]` with `rounded-lg` — new Open pattern (share/page.tsx, some updated components)
3. `bg-[#F7F7F5]` with `rounded-lg` — also new but lighter (lyrics page theme skeletons)

**Three different spinner patterns:**
1. Bouncing dots: `w-2 h-2 bg-signal-* rounded-full animate-pulse` with staggered delays — used for AI processing (Concept chat, Research, Sonic Engine generation)
2. Border spinner: `border-2 border-white border-t-transparent rounded-full animate-spin` — used in buttons (Lyrics page)
3. ButtonV2 built-in spinner — used wherever ButtonV2 `loading` prop is set

**Two different "generating" screen patterns:**
1. **Research:** Large "03" number + title + description + bouncing dots. Uses `text-neutral-100` for the number, `text-body-lg text-neutral-500` for description. `px-8` padding.
2. **Sonic Engine:** Same layout but with "02" number, uses Open tokens (`text-[#C4C4C4]`, `text-[#8A8A8A]`), `px-10` padding, `text-signal-blue` dots instead of `text-signal-violet`.

### Recommended standardization

- All skeletons: `bg-[#EEEDEB] rounded-lg animate-pulse` (or `bg-[#F7F7F5]` for lighter variant)
- All AI processing screens: Consistent padding (`px-10`), consistent dot color (`signal-violet`), all using Open tokens
- All button loading: Use ButtonV2 `loading` prop exclusively
- Add a `Skeleton` component (already exists in UI library but is underutilized) — use it everywhere

---

## 7. UNTOUCHED PAGES — Need Full Open Treatment

These pages have received zero design updates and will feel jarring alongside the updated pages:

| Page | Old Class Count | Priority |
|------|----------------|----------|
| `share/[shareId]/page.tsx` | 81 old classes (31 typo + 24 color + 26 radius) | **High** — users land here from Share links |
| `lyrics/[sessionId]/page.tsx` | 36 old classes (18 typo + 18 color) | **High** — core creative workflow |
| `projects/new/page.tsx` | Heavy old patterns throughout | **High** — first thing new users see |
| `projects/[id]/page.tsx` (home) | 59 old classes (11 typo + 29 color + 14 radius + partial updates) | **High** — most visited page |
| Checklist.tsx | 24 old classes | **Medium** |
| ShowreelPlayer.tsx | 13 old classes | **Medium** |
| TrackAnnotations.tsx | 15 old classes | **Medium** |
| SharePreview.tsx | 14 old classes | **Low** — public-facing, may be intentional |
| ResearchReport.tsx | Partially updated, uses `px-8` not `px-10` | **Low** — mostly functional |

---

## 8. RECOMMENDED IMPLEMENTATION ORDER

Prioritized by user impact and the "where do I go next" feedback:

### Phase 1 — Wayfinding (addresses core user feedback)
1. Add "Next Step" banners to Concept, Audio/Visuals, Research, and Sonic Engine pages
2. Add a persistent step indicator or breadcrumb showing workflow position (1 of 6)
3. Add completion CTAs to LyriCol sessions and Share detail pages

### Phase 2 — High-Traffic Page Updates
4. Migrate `projects/[id]/page.tsx` (project home) to full Open tokens
5. Migrate `projects/new/page.tsx` (new project form) to Open design
6. Migrate `ProjectNav.tsx` to Open tokens

### Phase 3 — Core Workflow Pages
7. Full Open treatment for `share/[shareId]/page.tsx`
8. Full Open treatment for `lyrics/[sessionId]/page.tsx`
9. Standardize all loading/skeleton states

### Phase 4 — Polish
10. Migrate Checklist.tsx, ShowreelPlayer.tsx, TrackAnnotations.tsx
11. Standardize all buttons to ButtonV2
12. Fix all remaining `rounded-md` → `rounded-lg`
13. Sweep remaining `neutral-*` color classes

---

## 9. QUICK WINS (< 30 min each)

- Replace `rounded-md` → `rounded-lg` globally (find and replace, with spot checks)
- Replace `px-8` → `px-10` in ResearchReport.tsx
- Add `mx-auto` to research loading state container (currently missing, content isn't centered at `max-w-[1400px]`)
- Standardize skeleton colors: `bg-neutral-100` → `bg-[#EEEDEB]` in all loading states
- Switch research loading dots from `signal-violet` to match Sonic Engine's `signal-blue` (or vice versa — pick one)
- Add `border-b border-[#E8E8E8]` divider consistency to prompts page sub-nav (already has it, but tab count badge still uses `text-neutral-300`)
