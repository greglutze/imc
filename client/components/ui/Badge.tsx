'use client';

type BadgeVariant = 'default' | 'yellow' | 'green' | 'red' | 'orange' | 'blue' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F7F7F5] text-[#666]',
  yellow: 'bg-signal-yellow/10 text-signal-yellow',
  green: 'bg-signal-green/10 text-signal-green',
  red: 'bg-signal-red/10 text-signal-red',
  orange: 'bg-signal-orange/10 text-signal-orange',
  blue: 'bg-signal-blue/10 text-signal-blue',
  violet: 'bg-signal-violet/10 text-signal-violet',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        h-5 px-2
        text-[11px] font-semibold uppercase tracking-wide
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
