'use client';

import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';

/**
 * Unified Button System — IMC Design Language
 *
 * HIERARCHY:
 *   primary    → bg-black text-white. One per view. The main action.
 *   secondary  → border outline. Supporting action alongside a primary.
 *   ghost      → text only, no border. Tertiary: edit, refresh, back, view all.
 *   danger     → red. Delete/destructive. Confirm state is filled, trigger is text.
 *   media      → circular play/pause button. Fixed sizes.
 *
 * SIZES:
 *   sm  → h-8,  compact inline actions (add, save, copy)
 *   md  → h-10, standard buttons (default)
 *   lg  → h-12, hero CTAs (landing page, empty states)
 *
 * USAGE:
 *   <Button>Create Project</Button>                         // primary md
 *   <Button variant="secondary" size="lg">Sign In</Button>  // outlined large
 *   <Button variant="ghost">Refresh brief</Button>          // text-only
 *   <Button variant="danger">Confirm Delete</Button>        // red filled
 *   <Button variant="danger-ghost">Delete</Button>          // red text trigger
 *   <Button variant="media" size="md">▶</Button>            // circular play
 *   <Button as="a" href="/projects">View All</Button>       // renders as <a>
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'media';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  as?: 'button' | 'a';
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & { as?: 'button' };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & { as: 'a' };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-black text-white hover:bg-neutral-800 active:bg-neutral-700',
  secondary:
    'border border-neutral-200 text-black hover:border-black active:bg-neutral-50',
  ghost:
    'text-neutral-400 hover:text-black',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  'danger-ghost':
    'text-neutral-400 hover:text-red-500',
  media:
    'rounded-full bg-neutral-100 text-neutral-500 hover:bg-black hover:text-white',
};

const variantActiveOverrides: Partial<Record<ButtonVariant, string>> = {
  media: 'rounded-full bg-black text-white hover:bg-neutral-800',
};

const sizeStyles: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    sm: 'h-8 px-4 text-micro',
    md: 'h-10 px-6 text-label',
    lg: 'h-12 px-8 text-label',
  },
  secondary: {
    sm: 'h-8 px-4 text-micro',
    md: 'h-10 px-6 text-label',
    lg: 'h-12 px-8 text-label',
  },
  ghost: {
    sm: 'text-micro',
    md: 'text-micro',
    lg: 'text-label',
  },
  danger: {
    sm: 'h-8 px-4 text-micro',
    md: 'h-10 px-6 text-label',
    lg: 'h-12 px-8 text-label',
  },
  'danger-ghost': {
    sm: 'text-micro',
    md: 'text-micro',
    lg: 'text-label',
  },
  media: {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  },
};

// Ghost and danger-ghost don't get these; media gets its own layout
const layoutBase = 'inline-flex items-center justify-center';
const textBase = 'font-bold uppercase tracking-widest';
const transitionBase = 'transition-colors duration-fast';
const disabledBase = 'disabled:opacity-50 disabled:cursor-not-allowed';

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      as = 'button',
      className = '',
      children,
      ...rest
    } = props;

    const isGhost = variant === 'ghost' || variant === 'danger-ghost';
    const isMedia = variant === 'media';
    const isActive = (rest as Record<string, unknown>)['data-active'] === true ||
                     (rest as Record<string, unknown>)['data-active'] === 'true';

    const baseStyle = isMedia
      ? `${layoutBase} ${transitionBase} ${disabledBase}`
      : isGhost
        ? `${textBase} ${transitionBase} ${disabledBase}`
        : `${layoutBase} ${textBase} ${transitionBase} ${disabledBase}`;

    const variantStyle = isActive && variantActiveOverrides[variant]
      ? variantActiveOverrides[variant]
      : variantStyles[variant];

    const sizeStyle = sizeStyles[variant]?.[size] || sizeStyles.primary[size];

    const classes = `
      ${baseStyle}
      ${variantStyle}
      ${sizeStyle}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.replace(/\s+/g, ' ').trim();

    const content = (
      <>
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </>
    );

    if (as === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={(rest as ButtonHTMLAttributes<HTMLButtonElement>).disabled || loading}
        className={classes}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
