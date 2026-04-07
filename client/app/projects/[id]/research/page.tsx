'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ResearchReport from '../../../../components/ResearchReport';
import ProjectNav from '../../../../components/ProjectNav';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import type { I1Report, I1Confidence } from '../../../../lib/api';
import { ButtonV2 } from '../../../../components/ui';
import NextStepBanner from '../../../../components/NextStepBanner';

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [report, setReport] = useState<{ report: I1Report; confidence: I1Confidence } | null>(null);
  const [researchRunning, setResearchRunning] = useState(false);
  const [reportVersion, setReportVersion] = useState(1);
  const [totalVersions, setTotalVersions] = useState(1);
  const [conceptReady, setConceptReady] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const autoResearchTriggered = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load project + report data
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const load = async () => {
      try {
        const proj = await api.getProject(id);
        setArtistName(proj.artist_name || 'Untitled');
        setProjectImage(proj.image_url || null);

        if (proj.concept?.genre_primary) {
          setConceptReady(true);
        }

        if (proj.status !== 'draft') {
          try {
            const reportData = await api.getReport(id);
            setReport({ report: reportData.report, confidence: reportData.confidence });
            setReportVersion(reportData.version);
            setTotalVersions(reportData.version);
          } catch {
            // No report yet — that's fine
          }
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [isAuthenticated, id]);

  // Run research
  const handleRunResearch = useCallback(async () => {
    if (!id) return;
    setResearchRunning(true);
    try {
      const reportData = await api.runResearch(id);
      setReport({ report: reportData.report, confidence: reportData.confidence });
      setReportVersion(reportData.version);
      setTotalVersions(reportData.version);
    } catch (err) {
      console.error('Failed to run research:', err);
    } finally {
      setResearchRunning(false);
    }
  }, [id]);

  // Auto-run research when concept ready but no report
  useEffect(() => {
    if (
      conceptReady &&
      !report &&
      !researchRunning &&
      !pageLoading &&
      !autoResearchTriggered.current &&
      id
    ) {
      autoResearchTriggered.current = true;
      handleRunResearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptReady, report, researchRunning, pageLoading, id]);

  // Load a specific version
  const handleVersionChange = useCallback(async (version: number) => {
    if (!id) return;
    try {
      const reportData = await api.getReportVersion(id, version);
      setReport({ report: reportData.report, confidence: reportData.confidence });
      setReportVersion(version);
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  }, [id]);

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in">
        <div className="px-10 py-16 max-w-2xl">
          <div className="h-12 w-64 bg-[#F7F7F5] animate-pulse" />
          <div className="h-4 w-96 bg-[#F7F7F5] animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <ProjectNav
        projectId={id}
        artistName={artistName}
        imageUrl={projectImage}
        activePage="research"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {researchRunning && (
            <div className="px-10 py-16 max-w-2xl">
              <p className="text-[40px] leading-[1.1] font-medium text-black mt-4 tracking-tight">
                Researching Your Market
              </p>
              <p className="text-[16px] text-[#8A8A8A] mt-5 max-w-sm">
                Pulling Spotify data, mapping comparable artists, and building your market intelligence report. This usually takes about a minute.
              </p>
              <div className="mt-8 flex items-center gap-2">
                <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          {!researchRunning && !report && !conceptReady && (
            <div className="px-10 py-16 max-w-2xl">
              <p className="text-[40px] leading-[1.1] font-medium text-black mt-4 tracking-tight">
                Concept Not Ready
              </p>
              <p className="text-[16px] text-[#8A8A8A] mt-5 max-w-sm">
                Your project concept needs to be defined before research can run. This happens automatically during project creation.
              </p>
            </div>
          )}

          {!researchRunning && report && (
            <>
              <div className="px-10 pt-6 pb-0 flex items-center justify-between max-w-[1400px]">
                <div />
                <ButtonV2
                  onClick={() => {
                    autoResearchTriggered.current = false;
                    handleRunResearch();
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Regenerate
                </ButtonV2>
              </div>
              <ResearchReport
                report={report.report}
                confidence={report.confidence}
                version={reportVersion}
                totalVersions={totalVersions}
                artistName={artistName}
                createdAt={new Date().toISOString()}
                onVersionChange={handleVersionChange}
              />
              <NextStepBanner
                completedLabel="Research complete"
                primary={{ label: 'Open Sonic Engine', href: `/projects/${id}/prompts` }}
                secondary={{ label: 'Back to overview', href: `/projects/${id}` }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
