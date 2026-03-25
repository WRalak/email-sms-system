/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Clash Display', 'DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e2e1ff',
          200: '#cac8ff',
          300: '#a9a3ff',
          400: '#8875ff',
          500: '#6f4dff',
          600: '#5e2bff',
          700: '#4f1bef',
          800: '#4117c8',
          900: '#3715a3',
          950: '#1f0a6b',
        },
        surface: {
          50:  '#f8f8fc',
          100: '#f0f0f8',
          200: '#e4e4f0',
          800: '#1a1a2e',
          900: '#0f0f1e',
          950: '#080810',
        },
      },
      animation: {
        'fade-in':     'fadeIn .3s ease',
        'slide-up':    'slideUp .4s cubic-bezier(.16,1,.3,1)',
        'slide-right': 'slideRight .4s cubic-bezier(.16,1,.3,1)',
        'pulse-slow':  'pulse 3s cubic-bezier(.4,0,.6,1) infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },                    to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'none' } },
        glow:       { from: { boxShadow: '0 0 20px rgba(111,77,255,.3)' }, to: { boxShadow: '0 0 40px rgba(111,77,255,.6)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'inner-lg': 'inset 0 2px 20px 0 rgba(0,0,0,.15)',
        'brand':    '0 8px 32px -4px rgba(111,77,255,.4)',
        'card':     '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
};
