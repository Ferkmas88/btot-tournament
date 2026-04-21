import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070a',
          900: '#0c0d12',
          800: '#14161d',
          700: '#1d2029',
        },
        blood: {
          DEFAULT: '#c23f32',
          dark: '#8a2a20',
          light: '#e25a4c',
        },
        amber: {
          gold: '#e8b454',
          deep: '#b88530',
        },
        cuba: {
          flag: '#cc0a2f',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.6' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(194, 63, 50, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(194, 63, 50, 0.8)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        flicker: 'flicker 3s infinite',
        scanline: 'scanline 8s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        shine: 'shine 3s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
