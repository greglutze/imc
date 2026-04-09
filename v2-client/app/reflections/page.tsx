'use client';

import AppShell from '../../components/AppShell';

export default function ReflectionsPage() {
  return (
    <AppShell>
      <div className="max-w-[960px] mx-auto px-8 py-10">
        <p className="text-label font-medium text-neutral-400 uppercase tracking-wider mb-1">Reflections</p>
        <h1 className="text-heading-lg font-semibold text-black mb-2">Pattern recognition</h1>
        <p className="text-body text-neutral-500">
          IMC surfaces connections across your archive. The more you bring in, the sharper this gets.
        </p>
        <div className="mt-16 text-center py-20 border border-dashed border-neutral-200 rounded-md">
          <p className="text-body text-neutral-300">Reflections emerge as your archive grows.</p>
        </div>
      </div>
    </AppShell>
  );
}
