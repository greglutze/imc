'use client';

import { useState, useCallback } from 'react';

type BadgeVariant = 'default' | 'yellow' | 'green' | 'red' | 'orange' | 'blue' | 'violet' | 'action';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  onClick?: () => void;
  /** When set, clicking copies this text and briefly shows "Copied" */
  copyText?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F7F7F5] text-[#8A8A8A]',
  yellow: 'bg-signal-yellow/10 text-signal-yellow',
  green: 'bg-signal-green/10 text-signal-green',
  red: 'bg-signal-red/10 text-signal-red',
  orange: 'bg-signal-orange/10 text-signal-orange',
  blue: 'bg-signal-blue/10 text-signal-blue',
  violet: 'bg-signal-violet/10 text-signal-violet',
  action: 'bg-transparent text-[#C4C4C4] border border-[#E8E8E8] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors duration-150 cursor-pointer',
};

export default function Badge({ children, variant = 'default', className = '', onClick, copyText }: BadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    if (copyText) {
      navigator.clipboard.writeText(copyText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {});
    }
    onClick?.();
  }, [copyText, onClick]);

  const isInteractive = variant === 'action' || onClick || copyText;

  return (
    <span
      onClick={isInteractive ? handleClick : undefined}
      className={`
        inline-flex items-center
        h-5 px-2
        text-[11px] font-semibold uppercase tracking-wide
        rounded-full
        ${variantStyles[variant]}
        ${isInteractive ? 'cursor-pointer select-none' : ''}
        ${className}
      `}
    >
      {copied ? '✓ Copied' : children}
    </span>
  );
}
