'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs } from '../../../components/ui';
import ConceptChat from '../../../components/ConceptChat';
import ResearchReport from '../../../components/ResearchReport';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import type { ConversationMessage, ProjectConcept, I1Report, I1Confidence, Project } from '../../../lib/api';

type ViewState = 'concept' | 'report';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ViewState>('concept');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conceptReady, setConceptReady] = useState(false);
  const [concept, setConcept] = useState<ProjectConcept | null>(null);
  const [report, setReport] = useState<{ report: I1Report; confidence: I1Confidence } | null>(null);
  const [researchRunning, setResearchRunning] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [reportVersion, setReportVersion] = useState(1);
  const [totalVersions, setTotalVersions] = useState(1);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load project data on mount
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const loadProject = async () => {
      try {
        // Fetch project details
        const proj = await api.getProject(id);
        setProject(proj);

        // If concept exists on project, set it
        if (proj.concept && proj.concept.genre_primary) {
          setConcept(proj.concept);
          setConceptReady(true);
        }

        // Fetch conversation messages
        try {
          const conv = await api.getConversation(id);
          if (conv.messages && conv.messages.length > 0) {
            setMessages(conv.messages);
          }
        } catch {
          // Conversation might not exist yet for new projects
        }

        // Fetch latest research report if status is past draft
        if (proj.status !== 'draft') {
          try {
            const reportData = await api.getReport(id);
            setReport({ report: reportData.report, confidence: reportData.confidence });
            setReportVersion(reportData.version);
            setTotalVersions(reportData.version);
            setActiveTab('report');
          } catch {
            // No report yet
          }
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadProject();
  }, [isAuthenticated, id]);

  // Send message to concept conversation via API
  const handleSendMessage = useCallback(async (content: string) => {
    if (!id) return;

    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const res = await api.sendConceptMessage(id, content);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
      }]);

      if (res.conceptReady && res.concept) {
        setConceptReady(true);
        setConcept(res.concept);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Run market research via API
  const handleRunResearch = useCallback(async () => {
    if (!id) return;

    setResearchRunning(true);
    setActiveTab('report');

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

  // Load a specific report version
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

  const artistName = project?.artist_name || 'Untitled';

  if (authLoading || pageLoading) {
    return (
      <div className="animate-fade-in px-8 py-16 max-w-2xl">
        <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
        <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
          Loading...
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'concept', label: 'Concept', count: messages.length > 0 ? Math.ceil(messages.length / 2) : undefined },
    { id: 'report', label: 'Research', count: report ? totalVersions : undefined },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Page header */}
      <div className="border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast flex items-center gap-2">
              <span className="text-body">&#8592;</span>
              IMC
            </a>
            <span className="text-neutral-200">/</span>
            <span className="text-micro font-bold uppercase tracking-widest text-black">
              {artistName}
            </span>
            {activeTab === 'report' && (
              <>
                <span className="text-neutral-200">/</span>
                <button
                  onClick={() => setActiveTab('concept')}
                  className="text-micro font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
                >
                  Concept
                </button>
                <span className="text-neutral-200">/</span>
                <span className="text-micro font-bold uppercase tracking-widest text-black">
                  Research
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/projects/${id}/checklist`}
              className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
            >
              Checklist
            </a>
            <span className="text-neutral-200">|</span>
            <a
              href={`/projects/${id}/prompts`}
              className="text-label font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors duration-fast"
            >
              Prompts
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1400px] mx-auto w-full px-10">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as ViewState)} />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'concept' && (
            <ConceptChat
              messages={messages}
              onSend={handleSendMessage}
              loading={loading}
              conceptReady={conceptReady}
              concept={concept}
              onRunResearch={handleRunResearch}
            />
          )}

          {activeTab === 'report' && (
            <>
              {researchRunning && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
                  <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
                    Running Market Research
                  </p>
                  <p className="text-body-lg text-black mt-5 max-w-sm">
                    Analyzing Spotify data, mapping comparable artists,
                    and generating your market intelligence report.
                  </p>
                  <div className="mt-8 flex items-center gap-2">
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 bg-signal-violet rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}

              {!researchRunning && !report && (
                <div className="px-8 py-16 max-w-2xl">
                  <p className="text-[120px] leading-[0.85] font-bold text-neutral-100 -ml-1">01</p>
                  <p className="text-[40px] leading-[1.1] font-bold text-black mt-4 tracking-tight">
                    No Research Yet
                  </p>
                  <p className="text-body-lg text-black mt-5 max-w-sm">
                    Complete the concept interview first, then run market research
                    to generate your intelligence report.
                  </p>
                </div>
              )}

              {!researchRunning && report && (
                <ResearchReport
                  report={report.report}
                  confidence={report.confidence}
                  version={reportVersion}
                  totalVersions={totalVersions}
                  artistName={artistName}
                  createdAt={new Date().toISOString()}
                  onVersionChange={handleVersionChange}
                  projectId={id}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
