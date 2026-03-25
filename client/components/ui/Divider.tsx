'use client';

interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className = '' }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-micro font-bold uppercase tracking-widest text-neutral-400">{label}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
    );
  }

  return <div className={`h-px bg-neutral-200 ${className}`} />;
}
