'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label font-bold text-neutral-400 uppercase tracking-widest"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 px-3
            bg-neutral-900 text-white text-body-sm
            border border-neutral-700 rounded-sm
            placeholder:text-neutral-600
            hover:border-neutral-500
            focus:border-signal-yellow focus:ring-0 focus:outline-none
            transition-colors duration-fast
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? 'border-signal-red' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-caption text-signal-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
