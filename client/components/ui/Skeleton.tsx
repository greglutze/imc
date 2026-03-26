'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'block' | 'circle';
}

export default function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  const base = 'bg-neutral-100 animate-pulse rounded-sm';

  if (variant === 'circle') {
    return <div className={`${base} w-8 h-8 rounded-full ${className}`} />;
  }

  if (variant === 'block') {
    return <div className={`${base} w-full h-32 ${className}`} />;
  }

  return <div className={`${base} w-full h-4 ${className}`} />;
}
