'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import StepWelcome from './steps/StepWelcome';
import StepExperience from './steps/StepExperience';
import StepName from './steps/StepName';
import StepGenre from './steps/StepGenre';
import StepVision from './steps/StepVision';
import StepImages from './steps/StepImages';
import StepArtists from './steps/StepArtists';
import StepShape from './steps/StepShape';
import StepBuilding from './steps/StepBuilding';

// ── Types ──────────────────────────────────────────

export type ExperienceLevel = 'explorer' | 'vibe' | 'professional';
export type ProjectShape = 'single' | 'ep' | 'album';

export interface OnboardingData {
  experienceLevel: ExperienceLevel | null;
  projectName: string;
  genres: string[];
  visionText: string;
  moodChips: string[];
  selectedImageIds: string[];
  referenceArtists: string[];
  projectShape: ProjectShape | null;
  customTrackCount?: number;
}

export interface CuratedImage {
  id: string;
  src: string;
  thumbnail_src: string;
  mood_tags: string[];
  genre_affinity: Record<string, number>;
  palette: string[];
  category: string;
}

type StepId =
  | 'welcome'
  | 'experience'
  | 'name'
  | 'genre'
  | 'vision'
  | 'images'
  | 'artists'
  | 'shape'
  | 'building';

interface StepDef {
  id: StepId;
  progress: number;
  condition?: (data: OnboardingData) => boolean;
}

// ── Step definitions with conditional logic ──────────

const ALL_STEPS: StepDef[] = [
  { id: 'welcome', progress: 0 },
  { id: 'experience', progress: 10 },
  { id: 'name', progress: 20 },
  { id: 'genre', progress: 30, condition: (d) => d.experienceLevel === 'explorer' },
  { id: 'vision', progress: 40 },
  { id: 'images', progress: 60 },
  { id: 'artists', progress: 75 },
  { id: 'shape', progress: 85 },
  { id: 'building', progress: 90 },
];

function getActiveSteps(data: OnboardingData): StepDef[] {
  return ALL_STEPS.filter((s) => !s.condition || s.condition(data));
}

// ── Progress Bar ──────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#E8E8E8]">
      <div
        className="h-full bg-[#1A1A1A] transition-all duration-700 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ── Main Flow ─────────────────────────────────────────

export default function OnboardingFlow() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentStepId, setCurrentStepId] = useState<StepId>('welcome');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [transitioning, setTransitioning] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    experienceLevel: null,
    projectName: '',
    genres: [],
    visionText: '',
    moodChips: [],
    selectedImageIds: [],
    referenceArtists: [],
    projectShape: null,
  });

  // Building screen state
  const [buildStage, setBuildStage] = useState(0);
  const [buildProgress, setBuildProgress] = useState(85);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Update a field in onboarding data
  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  // Navigation helpers
  const activeSteps = getActiveSteps(data);
  const currentIndex = activeSteps.findIndex((s) => s.id === currentStepId);
  const currentStep = activeSteps[currentIndex];

  const goTo = useCallback(
    (stepId: StepId) => {
      const targetIndex = activeSteps.findIndex((s) => s.id === stepId);
      setDirection(targetIndex > currentIndex ? 'forward' : 'back');
      setTransitioning(true);
      // Let the exit animation play, then swap
      setTimeout(() => {
        setCurrentStepId(stepId);
        setTransitioning(false);
      }, 250);
    },
    [activeSteps, currentIndex]
  );

  const goNext = useCallback(() => {
    if (currentIndex < activeSteps.length - 1) {
      goTo(activeSteps[currentIndex + 1].id);
    }
  }, [activeSteps, currentIndex, goTo]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      goTo(activeSteps[currentIndex - 1].id);
    }
  }, [activeSteps, currentIndex, goTo]);

  // Handle the building pipeline — populates EVERY instrument
  const startBuilding = useCallback(async () => {
    goTo('building');

    // Small delay so the building screen renders first
    await new Promise((r) => setTimeout(r, 600));

    let projectId = '';

    try {
      // ── Stage 1: Create project ──
      setBuildStage(1);
      setBuildProgress(86);
      const projectResult = await api.createProject(
        data.projectName || undefined,
        undefined
      );
      projectId = (projectResult as any).project?.id || projectResult.id;

      // ── Stage 2: Extract concept ──
      // The concept AI requires a conversation — it emits CONCEPT_READY
      // when it has enough signal. We send a rich first message with all
      // onboarding data, then keep nudging until conceptReady = true.
      setBuildStage(2);
      setBuildProgress(88);

      const conceptMessage = buildConceptMessage(data);
      let conceptResult = await api.sendConceptMessage(projectId, conceptMessage);

      // If the AI asks follow-up questions instead of extracting immediately,
      // keep responding until concept is locked in (max 4 rounds to be safe)
      let rounds = 0;
      while (!conceptResult.conceptReady && rounds < 4) {
        rounds++;
        setBuildProgress(88 + rounds); // subtle progress movement

        // Send increasingly direct confirmation messages
        const followUps = [
          'Yes, that all sounds right. I\'m happy with this direction — please extract and lock in my concept.',
          'That covers everything. Please finalize the concept now with all the details I\'ve shared.',
          'Perfect. Lock it in exactly as described.',
          'Confirmed. Extract the concept now.',
        ];
        conceptResult = await api.sendConceptMessage(
          projectId,
          followUps[Math.min(rounds - 1, followUps.length - 1)]
        );
      }

      if (!conceptResult.conceptReady) {
        console.warn('Concept extraction did not complete after 4 rounds — continuing anyway');
      }

      // ── Stage 3: Build moodboard + generate sonic brief ──
      setBuildStage(3);
      setBuildProgress(91);
      if (data.selectedImageIds.length > 0) {
        try {
          // Use the curated image URLs directly as moodboard images.
          // The existing upload endpoint accepts image data strings —
          // we pass the CDN URLs which the server stores as image_data.
          const { CURATED_IMAGES } = await import('./curatedImages');
          const selectedImages = CURATED_IMAGES.filter(
            (img) => data.selectedImageIds.includes(img.id)
          );
          const imageUrls = selectedImages.map((img) => img.src);

          await api.uploadMoodboardImages(projectId, imageUrls);

          // Analyze the moodboard to generate the sonic brief
          // (creates MoodboardBrief with sonic references, visual palette, prose)
          await api.analyzeMoodboard(projectId);
        } catch (err) {
          console.warn('Moodboard population skipped:', err);
        }
      }

      // ── Stage 4: Run market research ──
      setBuildStage(4);
      setBuildProgress(93);
      try {
        await api.runResearch(projectId);
      } catch (err) {
        console.warn('Research generation skipped:', err);
      }

      // ── Stage 5: Generate sonic engine (style profile + vocalist + track prompts) ──
      setBuildStage(5);
      setBuildProgress(95);
      try {
        await api.generatePrompts(projectId);
      } catch (err) {
        console.warn('Prompt generation skipped:', err);
      }

      // ── Stage 6: Seed a LyriCol writing session ──
      setBuildStage(6);
      setBuildProgress(97);
      try {
        const vibeContext = [
          data.visionText,
          data.moodChips.length > 0 ? `Mood: ${data.moodChips.join(', ')}` : '',
          data.referenceArtists.length > 0 ? `Inspired by: ${data.referenceArtists.join(', ')}` : '',
        ].filter(Boolean).join('. ');

        const session = await api.createLyricSession(projectId, {
          entry_mode: 'vibe',
          title: 'First Draft',
          vibe_context: vibeContext,
        });

        // Send an opening message to kickstart the session with content
        const visionSummary = data.visionText
          ? data.visionText.slice(0, 200)
          : data.moodChips.length > 0
          ? `a ${data.moodChips.join(', ').toLowerCase()} vibe`
          : 'my creative direction';
        await api.sendAdvisorMessage(
          projectId,
          session.id,
          `I just set up this project. Based on my vision — ${visionSummary} — give me a strong opening lyric concept with a hook idea and a first verse direction.`,
          'chat'
        );
      } catch (err) {
        console.warn('LyriCol session skipped:', err);
      }

      // ── Stage 7: Initialize checklist ──
      setBuildStage(7);
      setBuildProgress(99);
      try {
        // Fetching the checklist auto-populates default items
        await api.getChecklist(projectId);
      } catch (err) {
        console.warn('Checklist initialization skipped:', err);
      }

      // ── Stage 8: Done — everything is built ──
      setBuildStage(8);
      setBuildProgress(100);

      // Let the completion moment breathe
      await new Promise((r) => setTimeout(r, 1500));
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Onboarding pipeline failed:', err);
      // Even on failure, navigate to whatever was created
      if (projectId) {
        router.push(`/projects/${projectId}`);
      }
    }
  }, [data, goTo, router]);

  // Render nothing while auth is loading
  if (authLoading) return null;

  // Compute visual progress value
  const progress = currentStep?.progress ?? 0;

  // Animation classes
  const stepClass = transitioning
    ? direction === 'forward'
      ? 'animate-step-exit-left'
      : 'animate-step-exit-right'
    : direction === 'forward'
    ? 'animate-step-enter-right'
    : 'animate-step-enter-left';

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      {currentStepId !== 'building' && <ProgressBar value={progress} />}

      {/* Back button */}
      {currentIndex > 0 && currentStepId !== 'building' && (
        <button
          onClick={goBack}
          className="fixed top-6 left-6 z-40 text-[13px] text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150 flex items-center gap-1.5"
        >
          <span className="text-[16px]">&larr;</span> Back
        </button>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div key={currentStepId} className={stepClass}>
          {currentStepId === 'welcome' && (
            <StepWelcome onContinue={goNext} />
          )}
          {currentStepId === 'experience' && (
            <StepExperience
              value={data.experienceLevel}
              onChange={(level) => {
                updateData({ experienceLevel: level });
                // Slight delay so the user sees their selection highlight
                setTimeout(goNext, 300);
              }}
            />
          )}
          {currentStepId === 'name' && (
            <StepName
              value={data.projectName}
              onChange={(name) => updateData({ projectName: name })}
              onContinue={goNext}
              onSkip={() => {
                updateData({ projectName: '' });
                goNext();
              }}
            />
          )}
          {currentStepId === 'genre' && (
            <StepGenre
              selected={data.genres}
              onChange={(genres) => updateData({ genres })}
              onContinue={goNext}
            />
          )}
          {currentStepId === 'vision' && (
            <StepVision
              experienceLevel={data.experienceLevel!}
              visionText={data.visionText}
              moodChips={data.moodChips}
              onChangeText={(text) => updateData({ visionText: text })}
              onChangeChips={(chips) => updateData({ moodChips: chips })}
              onContinue={goNext}
            />
          )}
          {currentStepId === 'images' && (
            <StepImages
              selectedIds={data.selectedImageIds}
              onChange={(ids) => updateData({ selectedImageIds: ids })}
              onContinue={goNext}
              onSkip={
                data.experienceLevel === 'professional'
                  ? () => {
                      updateData({ selectedImageIds: [] });
                      goNext();
                    }
                  : undefined
              }
            />
          )}
          {currentStepId === 'artists' && (
            <StepArtists
              selected={data.referenceArtists}
              onChange={(artists) => updateData({ referenceArtists: artists })}
              onContinue={goNext}
              experienceLevel={data.experienceLevel!}
              genres={data.genres}
            />
          )}
          {currentStepId === 'shape' && (
            <StepShape
              value={data.projectShape}
              experienceLevel={data.experienceLevel!}
              customTrackCount={data.customTrackCount}
              onChange={(shape, count) => {
                updateData({ projectShape: shape, customTrackCount: count });
                setTimeout(() => startBuilding(), 300);
              }}
            />
          )}
          {currentStepId === 'building' && (
            <StepBuilding
              stage={buildStage}
              progress={buildProgress}
              selectedImageIds={data.selectedImageIds}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

/**
 * Build a rich, natural-language concept message from the onboarding data.
 * This is sent as the first user message in the concept conversation.
 * The AI uses it to extract genre, mood, influences, creative direction,
 * and everything else needed for a full ProjectConcept.
 *
 * The message is structured to feel like a real person describing their
 * project, not a form dump — this gives the AI better context for
 * generating nuanced, personalized output.
 */
function buildConceptMessage(data: OnboardingData): string {
  const parts: string[] = [];

  // Open with the name if they have one
  if (data.projectName) {
    parts.push(`I'm working on a project called "${data.projectName}".`);
  }

  // Experience-level context helps the AI calibrate its responses
  if (data.experienceLevel === 'explorer') {
    parts.push("I'm pretty new to music creation and exploring what's possible.");
  } else if (data.experienceLevel === 'professional') {
    parts.push("I'm an experienced musician with a clear vision for this project.");
  }

  // Genre selections
  if (data.genres.length > 0) {
    parts.push(`I'm drawn to ${data.genres.join(', ')}.`);
  }

  // The core vision — this is the most important piece
  if (data.visionText) {
    parts.push(`Here's my vision: ${data.visionText}`);
  }

  // Mood chips add emotional texture
  if (data.moodChips.length > 0) {
    parts.push(`The mood I'm going for is ${data.moodChips.join(', ').toLowerCase()}.`);
  }

  // Reference artists
  if (data.referenceArtists.length > 0) {
    if (data.referenceArtists.length === 1) {
      parts.push(`My main influence is ${data.referenceArtists[0]}.`);
    } else {
      const last = data.referenceArtists[data.referenceArtists.length - 1];
      const rest = data.referenceArtists.slice(0, -1).join(', ');
      parts.push(`My influences include ${rest} and ${last}.`);
    }
  }

  // Project scope
  if (data.projectShape) {
    const shapes: Record<string, string> = {
      single: "I want to create a single — one track, fully realized.",
      ep: "I'm thinking an EP — around 4 to 6 tracks, a tight collection.",
      album: "I want to make a full album — 8 to 14 tracks, the complete vision.",
    };
    if (data.customTrackCount) {
      parts.push(`I want exactly ${data.customTrackCount} tracks.`);
    } else {
      parts.push(shapes[data.projectShape] || '');
    }
  }

  // Selected image count gives context about visual direction
  if (data.selectedImageIds.length > 0) {
    parts.push(`I've also selected ${data.selectedImageIds.length} visual references that capture the atmosphere I'm going for.`);
  }

  // Target audience — the concept AI requires this as one of its six areas.
  // Infer from the data if not explicitly provided.
  if (data.genres.length > 0 || data.referenceArtists.length > 0) {
    const audienceHint = data.referenceArtists.length > 0
      ? `fans of ${data.referenceArtists.slice(0, 2).join(' and ')}`
      : `listeners who love ${data.genres.slice(0, 2).join(' and ')}`;
    parts.push(`My target audience is ${audienceHint} — people who appreciate this kind of sound and aesthetic.`);
  }

  // Close with explicit instructions to extract the concept NOW.
  // The concept AI is designed for multi-turn conversation, but during onboarding
  // all the data is available — we need to push it to extract immediately.
  parts.push(
    "I've given you everything: genre, mood, creative direction, reference artists, target audience, and track count. " +
    "This is all the info you need. Please extract and lock in my concept now — output the full CONCEPT_READY block with my complete creative brief. " +
    "Don't ask any follow-up questions, just finalize it."
  );

  return parts.join(' ');
}
