'use client';

interface ConfidenceMeterProps {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

function getColor(value: number): string {
  if (value >= 80) return 'bg-signal-green';
  if (value >= 60) return 'bg-signal-yellow';
  if (value >= 40) return 'bg-signal-orange';
  return 'bg-signal-red';
}

function getTextColor(value: number): string {
  if (value >= 80) return 'text-signal-green';
  if (value >= 60) return 'text-signal-yellow';
  if (value >= 40) return 'text-signal-orange';
  return 'text-signal-red';
}

export default function ConfidenceMeter({
  value,
  label,
  showValue = true,
  size = 'md',
  className = '',
}: ConfidenceMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const height = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-caption text-neutral-500">{label}</span>
          )}
          {showValue && (
            <span className={`text-caption font-mono font-bold ${getTextColor(clampedValue)}`}>
              {clampedValue}
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-neutral-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor(clampedValue)} rounded-full transition-all duration-150`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
