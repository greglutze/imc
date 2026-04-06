'use client';

interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className = '' }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-[#E8E8E8]" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">{label}</span>
        <div className="flex-1 h-px bg-[#E8E8E8]" />
      </div>
    );
  }

  return <div className={`h-px bg-[#E8E8E8] ${className}`} />;
}
