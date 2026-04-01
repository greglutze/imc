'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api, type ChecklistItem, type ChecklistCategory, type ChecklistSummary } from '../lib/api';
import { Button } from './ui';

/* ———————— Category metadata ———————— */

const CATEGORIES: Array<{
  key: ChecklistCategory;
  label: string;
  number: string;
}> = [
  { key: 'creative', label: 'Creative', number: '01' },
  { key: 'legal', label: 'Legal', number: '02' },
  { key: 'business', label: 'Business', number: '03' },
  { key: 'distribution', label: 'Distribution', number: '04' },
];

/* ———————— Props ———————— */

interface ChecklistProps {
  projectId: string;
  items: ChecklistItem[];
  summary: ChecklistSummary;
  onUpdate: () => void;
}

/* ———————— Main Checklist Component ———————— */

export default function Checklist({ projectId, items, summary, onUpdate }: ChecklistProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const percent = summary.total > 0 ? Math.round((summary.checked / summary.total) * 100) : 0;

  // Progress copy — never punitive, always forward-looking
  const progressCopy = () => {
    if (summary.checked === 0) return "Let's get you launch-ready";
    if (percent >= 100) return 'Launch-ready';
    if (percent >= 80) return 'Almost there';
    return `${summary.checked} items done`;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-10">
        <p className="text-micro font-bold uppercase tracking-widest text-neutral-400 mb-2">
          Instrument 00
        </p>
        <h2 className="text-[64px] leading-[0.9] font-bold tracking-tight text-black">
          Launch Checklist
        </h2>
        <p className="text-body-lg text-neutral-500 mt-4 max-w-md">
          {progressCopy()}
        </p>
      </div>

      {/* Global progress bar */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-caption text-neutral-400 uppercase tracking-widest font-bold">
            Overall Progress
          </p>
          <p className="text-caption font-bold text-black font-mono">
            {summary.checked} / {summary.total}
          </p>
        </div>
        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Completion celebration */}
      {percent >= 100 && (
        <div className="border-b border-neutral-200 px-8 py-8 bg-neutral-50">
          <p className="text-heading font-bold text-black">Launch-ready</p>
          <p className="text-body text-neutral-500 mt-1">
            Every item is checked. You&apos;re ready to release.
          </p>
        </div>
      )}

      {/* Categories */}
      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        const catSummary = summary.by_category[cat.key];
        const isCollapsed = collapsed[cat.key] || false;

        return (
          <CategorySection
            key={cat.key}
            projectId={projectId}
            category={cat}
            items={catItems}
            summary={catSummary}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => toggleCategory(cat.key)}
            onUpdate={onUpdate}
          />
        );
      })}
    </div>
  );
}

/* ———————— Category Section ———————— */

interface CategorySectionProps {
  projectId: string;
  category: { key: ChecklistCategory; label: string; number: string };
  items: ChecklistItem[];
  summary: { total: number; checked: number };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: () => void;
}

function CategorySection({
  projectId,
  category,
  items,
  summary,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
}: CategorySectionProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingItem && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingItem]);

  const handleAddItem = async () => {
    const label = newItemLabel.trim();
    if (!label) return;

    try {
      await api.addChecklistItem(projectId, category.key, label);
      setNewItemLabel('');
      setAddingItem(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
    if (e.key === 'Escape') {
      setAddingItem(false);
      setNewItemLabel('');
    }
  };

  return (
    <div className="border-b border-neutral-200">
      {/* Category header — clickable to collapse */}
      <button
        onClick={onToggleCollapse}
        className="w-full px-8 py-6 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-heading font-bold font-mono text-neutral-200">
            {category.number}
          </span>
          <h3 className="text-heading font-bold text-black">{category.label}</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-body-sm font-mono text-neutral-400">
            {summary.checked} / {summary.total}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isCollapsed ? '' : 'rotate-180'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Items — collapsible */}
      {!isCollapsed && (
        <div className="px-8 pb-6">
          {/* Per-category progress bar */}
          <div className="mb-4">
            <div className="h-0.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                style={{
                  width: summary.total > 0 ? `${(summary.checked / summary.total) * 100}%` : '0%',
                }}
              />
            </div>
          </div>

          {/* Item list */}
          <div className="space-y-0">
            {items.map((item) => (
              <ChecklistItemRow key={item.id} item={item} onUpdate={onUpdate} />
            ))}
          </div>

          {/* Add custom item */}
          <div className="mt-4">
            {addingItem ? (
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newItemLabel.trim()) {
                      setAddingItem(false);
                    }
                  }}
                  placeholder="What needs to happen?"
                  className="flex-1 text-body text-black bg-transparent border-b border-neutral-300 pb-1 outline-none focus:border-black transition-colors placeholder:text-neutral-300"
                />
                <Button onClick={handleAddItem} variant="ghost" size="sm">
                  Add
                </Button>
              </div>
            ) : (
              <Button onClick={() => setAddingItem(true)} variant="ghost" size="sm">
                + Add item
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ———————— Individual Checklist Item ———————— */

function ChecklistItemRow({
  item,
  onUpdate,
}: {
  item: ChecklistItem;
  onUpdate: () => void;
}) {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const [showGuide, setShowGuide] = useState(false);
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = useCallback(async () => {
    try {
      await api.toggleChecklistItem(item.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  }, [item.id, onUpdate]);

  const saveNotes = useCallback(
    async (value: string) => {
      setSaving(true);
      try {
        await api.updateChecklistNotes(item.id, value);
        // No need to call onUpdate for notes — just save silently
      } catch (err) {
        console.error('Failed to save notes:', err);
      } finally {
        setSaving(false);
      }
    },
    [item.id]
  );

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);

    // Auto-save 800ms after last keystroke (per PRD spec)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNotes(value), 800);
  };

  const handleNotesBlur = () => {
    // Save immediately on blur
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (notes !== item.notes) {
      saveNotes(notes);
    }
  };

  const handleDelete = useCallback(async () => {
    try {
      await api.deleteChecklistItem(item.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }, [item.id, onUpdate]);

  const hasGuide = item.guide && item.guide.length > 0;

  return (
    <div className="group border-b border-neutral-100 last:border-b-0">
      {/* Main row */}
      <div className="flex items-start gap-4 py-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${
            item.is_checked
              ? 'bg-black border-black'
              : 'border-neutral-300 hover:border-black'
          }`}
          aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
        >
          {item.is_checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Label + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p
              className={`text-body cursor-pointer select-none transition-colors ${
                item.is_checked ? 'line-through text-neutral-400' : 'text-black'
              }`}
              onClick={handleToggle}
            >
              {item.label}
            </p>

            {/* Info toggle arrow */}
            {hasGuide && (
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="mt-1 flex-shrink-0 w-4 h-4 flex items-center justify-center text-neutral-300 hover:text-black transition-colors"
                aria-label={showGuide ? 'Hide info' : 'More info'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Guide text — expandable */}
          {showGuide && hasGuide && (
            <p className="text-body-sm text-neutral-500 mt-2 leading-relaxed max-w-xl">
              {item.guide}
            </p>
          )}

          {/* Notes toggle + delete for custom items */}
          <div className="flex items-center gap-4 mt-1">
            {!showNotes && (
              <Button onClick={() => setShowNotes(true)} variant="ghost" size="sm">
                {item.notes ? 'Edit note' : 'Add note'}
              </Button>
            )}
            {!item.is_default && (
              <Button onClick={handleDelete} variant="danger-ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Saving indicator */}
        {saving && (
          <span className="text-micro text-neutral-300 mt-1">Saving...</span>
        )}
      </div>

      {/* Notes area */}
      {showNotes && (
        <div className="pl-9 pb-3">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
            placeholder="Add a note..."
            rows={2}
            className="w-full text-body-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-sm px-3 py-2 outline-none focus:border-neutral-400 transition-colors resize-none placeholder:text-neutral-300"
          />
        </div>
      )}
    </div>
  );
}
