# Deploy Checklist — When Railway Is Back

## Server-side changes waiting on deployment

### 1. Lyrics generation fixes (commits d2aa339, b1166c1, b83ddda, 8827f0a)
- `server/src/services/instrument2.ts`: Rewrote prompt to generate actual song lyrics (not Udio descriptions), added `repairJsonNewlines()` for raw newlines in AI JSON output, dynamic token budget scaling (8192 + track_count * 2500, capped at 32k)
- `server/src/services/ai.ts`: Added optional `options` param to `analyze()` for token budget control
- `server/src/routes/instrument2.ts`: Backward compat for `udio_prompt` → `lyrics` field rename in GET route
- `server/src/types/index.ts`: `udio_prompt` renamed to `lyrics` in `I2Track`
- `server/src/routes/lyricAdvisor.ts`: Updated inline type
- `server/src/routes/checklist.ts`: Removed "and Udio" from guide text
- **After deploy**: Hit "Regenerate All" on Sonic Engine for existing projects to get real lyrics

### 2. Project name generation endpoint
- `server/src/routes/projects.ts`: Added `POST /generate-names` endpoint — uses Claude AI to generate 10 contextual project names based on genre, vision, moods, artists, and shape
- Client-side StepName component calls this during onboarding
- **After deploy**: Test the full onboarding flow end-to-end — name step is now the last step before building

## Client-side changes (deploy with next push)
- Onboarding step order: welcome → experience → genre → vision → images → artists → shape → **name** → building
- StepName rewritten with AI name suggestions (10 selectable cards + custom input)
- StepShape no longer says "Last step"
- TrackPrompts shows lyrics column with copy + Edit in LyriCol
- Dashboard enriched with Sonic Identity, Vocal Character, Visual World sections

## Backlog (not blocked on deploy)
- Curate audio/visual image library covering all sonic vibes
- Remove Concept and Audio/Visuals from top nav
- Build sign up, account, settings, sign out flows
- Add ability to delete a project
- Add everpresent AI conversation button (bottom-right corner)
- Remove rounded corners from images/boxes, keep pills for buttons
- Audit color consistency and in-progress/active/done states
