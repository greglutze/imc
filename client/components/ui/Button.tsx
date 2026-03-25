'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-black text-white hover:bg-neutral-800 active:bg-neutral-700',
  secondary:
    'bg-white text-black border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100',
  ghost:
    'bg-transparent text-neutral-500 hover:text-black hover:bg-neutral-100 active:bg-neutral-200',
  danger:
    'bg-signal-red/5 text-signal-red border border-signal-red/15 hover:bg-signal-red/10 active:bg-signal-red/15',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-label',
  md: 'h-10 px-4 text-body-sm',
  lg: 'h-12 px-6 text-body',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-bold rounded-sm
          transition-all duration-fast
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
