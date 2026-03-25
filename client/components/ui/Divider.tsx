'use client';

interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className = '' }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-micro font-bold uppercase tracking-widest text-neutral-500">{label}</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>
    );
  }

  return <div className={`h-px bg-neutral-800 ${className}`} />;
}
