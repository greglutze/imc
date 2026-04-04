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

  // Handle the building pipeline
  const startBuilding = useCallback(async () => {
    goTo('building');

    // Small delay so the building screen renders first
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Stage 1: Create project
      setBuildStage(1);
      setBuildProgress(88);
      const projectResult = await api.createProject(
        data.projectName || undefined,
        undefined
      );
      const projectId =
        (projectResult as any).project?.id || projectResult.id;

      // Stage 2: Send concept conversation to extract concept
      setBuildStage(2);
      setBuildProgress(91);

      // Build a rich concept message from all onboarding data
      const conceptMessage = buildConceptMessage(data);
      await api.sendConceptMessage(projectId, conceptMessage);

      // Stage 3: Upload selected moodboard images
      setBuildStage(3);
      setBuildProgress(94);
      if (data.selectedImageIds.length > 0) {
        // Upload curated image selections
        try {
          await api.uploadOnboardingImages(projectId, data.selectedImageIds);
        } catch {
          // Non-critical — moodboard can be populated later
          console.warn('Moodboard population skipped');
        }
      }

      // Stage 4: Run research
      setBuildStage(4);
      setBuildProgress(96);
      try {
        await api.runResearch(projectId);
      } catch {
        console.warn('Research generation skipped');
      }

      // Stage 5: Generate prompts
      setBuildStage(5);
      setBuildProgress(98);
      try {
        await api.generatePrompts(projectId);
      } catch {
        console.warn('Prompt generation skipped');
      }

      // Stage 6: Done
      setBuildStage(6);
      setBuildProgress(100);

      // Brief pause to show completion, then navigate
      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Onboarding pipeline failed:', err);
      // Fallback: redirect to project home even on partial failure
      // The user can re-run any failed instruments from the home page
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

function buildConceptMessage(data: OnboardingData): string {
  const parts: string[] = [];

  if (data.visionText) {
    parts.push(data.visionText);
  }

  if (data.genres.length > 0) {
    parts.push(`Genres: ${data.genres.join(', ')}`);
  }

  if (data.moodChips.length > 0) {
    parts.push(`Mood: ${data.moodChips.join(', ')}`);
  }

  if (data.referenceArtists.length > 0) {
    parts.push(`Influences: ${data.referenceArtists.join(', ')}`);
  }

  if (data.projectShape) {
    const shapes: Record<string, string> = {
      single: '1 track (single)',
      ep: '5 tracks (EP)',
      album: '10 tracks (album)',
    };
    parts.push(
      `Project scope: ${shapes[data.projectShape] || `${data.customTrackCount} tracks`}`
    );
  }

  return parts.join('\n\n');
}
