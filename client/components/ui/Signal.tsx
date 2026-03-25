'use client';

type SignalColor = 'yellow' | 'green' | 'red' | 'orange' | 'blue' | 'violet' | 'neutral';
type SignalShape = 'dot' | 'bar';

interface SignalProps {
  color?: SignalColor;
  shape?: SignalShape;
  pulse?: boolean;
  label?: string;
  className?: string;
}

const colorMap: Record<SignalColor, string> = {
  yellow: 'bg-signal-yellow',
  green: 'bg-signal-green',
  red: 'bg-signal-red',
  orange: 'bg-signal-orange',
  blue: 'bg-signal-blue',
  violet: 'bg-signal-violet',
  neutral: 'bg-neutral-300',
};

export default function Signal({ color = 'neutral', shape = 'dot', pulse = false, label, className = '' }: SignalProps) {
  if (shape === 'bar') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-1 h-4 rounded-full ${colorMap[color]} ${pulse ? 'animate-pulse-subtle' : ''}`} />
        {label && <span className="text-caption text-neutral-500">{label}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${colorMap[color]} ${pulse ? 'animate-pulse-subtle' : ''}`} />
      {label && <span className="text-caption text-neutral-500">{label}</span>}
    </div>
  );
}
