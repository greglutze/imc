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
          <label className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A8A] block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-white border px-4 py-3
            text-[14px] text-black placeholder-[#C4C4C4]
            transition-colors duration-150 resize-none
            focus:outline-none focus:ring-1
            ${error
              ? 'border-signal-red focus:ring-signal-red'
              : 'border-[#E8E8E8] focus:border-black focus:ring-black'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-signal-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-[#C4C4C4]">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;
