import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
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
        signal: {
          yellow: '#0044FF',
          orange: '#FF6B00',
          red: '#E53535',
          green: '#00FF00',
          blue: '#2979FF',
          violet: '#7C4DFF',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#F5F5F5',
          elevated: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'micro': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
        'caption': ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'label': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'small': ['13px', { lineHeight: '20px', letterSpacing: '0' }],
        'body': ['15px', { lineHeight: '24px', letterSpacing: '-0.005em' }],
        'body-lg': ['17px', { lineHeight: '28px', letterSpacing: '-0.005em' }],
        'heading-sm': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
        'heading': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        'heading-lg': ['36px', { lineHeight: '42px', letterSpacing: '-0.025em' }],
        'display': ['48px', { lineHeight: '52px', letterSpacing: '-0.035em' }],
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
      },
    },
  },
  plugins: [],
};

export default config;
