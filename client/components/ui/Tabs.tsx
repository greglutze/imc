'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id);
  const active = activeTab ?? internalActive;

  const handleChange = (id: string) => {
    setInternalActive(id);
    onTabChange?.(id);
  };

  return (
    <div className={`flex items-center gap-0 border-b border-neutral-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={`
            relative px-5 py-3 text-label font-bold uppercase tracking-widest transition-colors duration-fast
            ${active === tab.id
              ? 'text-black'
              : 'text-neutral-400 hover:text-neutral-600'
            }
          `}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                text-micro font-mono px-1.5 py-0.5 rounded-sm
                ${active === tab.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'}
              `}>
                {tab.count}
              </span>
            )}
          </span>
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
      ))}
    </div>
  );
}
