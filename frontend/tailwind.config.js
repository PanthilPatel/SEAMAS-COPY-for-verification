/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#0a0a0f',
          50:  '#12121a',
          100: '#16161f',
          200: '#1c1c28',
          300: '#252533',
          400: '#2e2e40',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)',
      },
      animation: {
        'shimmer':         'shimmer 2.5s linear infinite',
        'float':           'float 6s ease-in-out infinite',
        'glow-pulse':      'glow-pulse 3s ease-in-out infinite',
        'slide-up':        'slide-up 0.4s cubic-bezier(0.22,1,0.36,1)',
        'slide-in-right':  'slide-in-right 0.3s cubic-bezier(0.22,1,0.36,1)',
        'fade-in':         'fade-in 0.3s ease-out',
        'card-enter':      'card-enter 0.4s cubic-bezier(0.22,1,0.36,1)',
        'spin-slow':       'spin 3s linear infinite',
        'ping-slow':       'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'orbit':           'orbit 8s linear infinite',
        'typewriter':      'typewriter 3s steps(40) infinite alternate',
        'progress':        'progress 1.8s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          to:   { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        progress: {
          '0%':   { width: '0%' },
          '70%':  { width: '85%' },
          '100%': { width: '95%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-indigo': '0 0 30px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.1)',
        'glow-violet': '0 0 30px rgba(139,92,246,0.25), 0 0 60px rgba(139,92,246,0.1)',
        'glow-sm':     '0 0 12px rgba(99,102,241,0.2)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 12px 48px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.15)',
        'drawer':      '0 0 80px rgba(0,0,0,0.8), -20px 0 60px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
