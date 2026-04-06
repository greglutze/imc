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
            className="block text-label font-semibold text-[#8A8A8A] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 px-3
            bg-white text-black text-body-sm
            border border-[#E8E8E8]
            placeholder:text-neutral-400
            hover:border-[#1A1A1A]
            focus:border-black focus:ring-0 focus:outline-none
            transition-colors duration-150
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
          <p className="text-caption text-neutral-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
