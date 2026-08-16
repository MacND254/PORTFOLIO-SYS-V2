/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      '3xs': '320px',   // Galaxy S5, iPhone 4/5 — minimum supported width
      'xs':  '480px',   // Large phones (iPhone SE landscape, Galaxy A series)
      'sm':  '640px',   // TW default
      'md':  '768px',   // TW default
      'lg':  '1024px',  // TW default
      'xl':  '1280px',  // TW default
      '2xl': '1536px',  // TW default
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
      },
      animation: {
        'fade-in':       'fade-in 0.35s ease both',
        'fade-in-scale': 'fade-in-scale 0.35s ease both',
        'float':         'float 4s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-indigo': '0 0 32px 4px rgba(99, 102, 241, 0.12)',
        'glow-purple': '0 0 32px 4px rgba(168, 85, 247, 0.12)',
        'glow-emerald':'0 0 32px 4px rgba(16, 185, 129, 0.10)',
      },
    },
  },
  plugins: [],
};
