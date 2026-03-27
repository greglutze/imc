'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, type ChecklistItem, type ChecklistSummary } from '../../../../lib/api';
import Checklist from '../../../../components/Checklist';
import ProjectNav from '../../../../components/ProjectNav';

export default function ChecklistPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>('');

  const loadChecklist = useCallback(async () => {
    try {
      const data = await api.getChecklist(projectId);
      setItems(data.items);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChecklist();
    // Also load project name
    api.getProject(projectId).then((p) => {
      setProjectName(p.artist_name || 'Untitled');
    }).catch(console.error);
  }, [projectId, loadChecklist]);

  if (loading || !summary) {
    return (
      <div className="animate-fade-in">
        <div className="border-b border-neutral-200 px-8 py-10">
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Instrument 00
          </p>
          <div className="h-16 w-96 bg-neutral-100 rounded-sm animate-pulse" />
        </div>
        <div className="px-8 py-8 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 bg-neutral-50 rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ProjectNav projectId={projectId} artistName={projectName} activePage="checklist" />

      {/* Checklist component */}
      <div className="max-w-[1400px]">
        <Checklist
          projectId={projectId}
          items={items}
          summary={summary}
          onUpdate={loadChecklist}
        />
      </div>
    </div>
  );
}
