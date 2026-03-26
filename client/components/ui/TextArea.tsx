'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-label font-bold uppercase tracking-widest text-neutral-500 block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-white border rounded-sm px-4 py-3
            text-body text-black placeholder-neutral-300
            transition-colors duration-fast resize-none
            focus:outline-none focus:ring-1
            ${error
              ? 'border-signal-red focus:ring-signal-red'
              : 'border-neutral-200 focus:border-black focus:ring-black'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-caption text-signal-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-neutral-400">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;
