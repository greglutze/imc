'use client';

import AppShell from '../../components/AppShell';

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="max-w-[960px] mx-auto px-8 py-10">
        <p className="text-label font-medium text-neutral-400 uppercase tracking-wider mb-1">Projects</p>
        <h1 className="text-heading-lg font-semibold text-black mb-2">Workspaces</h1>
        <p className="text-body text-neutral-500">
          Projects draw from your archive as context. Coming soon.
        </p>
        <div className="mt-16 text-center py-20 border border-dashed border-neutral-200 rounded-md">
          <p className="text-body text-neutral-300">Build the archive first. Projects come next.</p>
        </div>
      </div>
    </AppShell>
  );
}
