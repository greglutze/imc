import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        black: '#000000',
        white: '#FFFFFF',

        // Neutral scale — Swiss precision
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },

        // Signal colors — Dieter Rams functional color
        // Each color exists to convey meaning, not decoration
        signal: {
          yellow: '#FFD700',   // Brand accent, primary action
          orange: '#FF6B00',   // Warning, attention
          red: '#E53535',      // Error, destructive
          green: '#00C853',    // Success, active, confidence
          blue: '#2979FF',     // Info, link, navigation
          violet: '#7C4DFF',   // AI/intelligence indicator
        },

        // Surface colors — light mode
        surface: {
          primary: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#F5F5F5',
          elevated: '#FFFFFF',
          overlay: 'rgba(0, 0, 0, 0.08)',
        },
      },

      fontFamily: {
        // Instrument Sans — clean, contemporary grotesque
        sans: [
          'Instrument Sans',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        // JetBrains Mono for technical/data elements
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },

      fontSize: {
        // Open typographic scale — cleaner proportions, less aggressive tracking
        'micro': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
        'caption': ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'label': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'small': ['13px', { lineHeight: '20px', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '20px', letterSpacing: '0' }],
        'body': ['15px', { lineHeight: '24px', letterSpacing: '-0.005em' }],
        'body-lg': ['17px', { lineHeight: '28px', letterSpacing: '-0.005em' }],
        'heading-sm': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
        'heading': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        'heading-lg': ['36px', { lineHeight: '42px', letterSpacing: '-0.025em' }],
        'display': ['48px', { lineHeight: '52px', letterSpacing: '-0.035em' }],
        'display-lg': ['64px', { lineHeight: '68px', letterSpacing: '-0.035em' }],
      },

      spacing: {
        // 4px base grid
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },

      borderRadius: {
        'none': '0',
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'full': '9999px',
      },

      boxShadow: {
        'elevated': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'step-enter-right': 'stepEnterRight 0.35s ease-out forwards',
        'step-enter-left': 'stepEnterLeft 0.35s ease-out forwards',
        'step-exit-left': 'stepExitLeft 0.25s ease-in forwards',
        'step-exit-right': 'stepExitRight 0.25s ease-in forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'press': 'press 0.15s ease-out',
        'card-enter': 'cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'content-reveal': 'contentReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        stepEnterRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        stepEnterLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        stepExitLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-30px)' },
        },
        stepExitRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(30px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        cardEnter: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        contentReveal: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      transitionDuration: {
        'fast': '120ms',
        'normal': '200ms',
        'slow': '320ms',
      },
    },
  },
  plugins: [],
};

export default config;
