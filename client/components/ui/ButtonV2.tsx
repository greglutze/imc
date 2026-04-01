'use client';

import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from 'react';

/**
 * ButtonV2 — Open-influenced alternative button system
 *
 * Uses CSS classes from theme-open.css instead of Tailwind utilities,
 * so styling adapts when the theme-open class is applied.
 *
 * HIERARCHY (same roles as v1, different aesthetics):
 *   primary      → pill, filled black. Main action.
 *   secondary    → pill, thin border. Supporting action.
 *   ghost        → text only, with animated arrow →. Tertiary.
 *   danger       → pill, red filled. Destructive confirm.
 *   danger-ghost → text only, red on hover. Destructive trigger.
 *   media        → circular play/pause button.
 *
 * SIZES:
 *   sm  → 32px height
 *   md  → 38px height (default)
 *   lg  → 44px height
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'media';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  arrow?: boolean;   // ghost variant: show → arrow
  fullWidth?: boolean;
  as?: 'button' | 'a';
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & { as?: 'button' };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & { as: 'a' };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const ButtonV2 = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      loading = false,
      arrow = false,
      fullWidth = false,
      as = 'button',
      className = '',
      children,
      ...rest
    } = props;

    const classes = [
      'btn-v2',
      `btn-v2--${variant}`,
      `btn-v2--${size}`,
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ');

    const showArrow = arrow || (variant === 'ghost' && !loading);

    const content = (
      <>
        {loading && (
          <span
            className="inline-block w-4 h-4 border-[1.5px] border-current border-t-transparent rounded-full animate-spin"
            style={{ flexShrink: 0 }}
          />
        )}
        {children}
        {showArrow && !loading && (
          <span className="btn-arrow" aria-hidden="true">→</span>
        )}
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

ButtonV2.displayName = 'ButtonV2';
export default ButtonV2;
