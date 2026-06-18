import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#0F172A',
        'surface-low': '#0F172A',
        'surface-high': '#CBD5E1',
        'surface-highest': '#CBD5E1',
        primary: '#06B6D4',
        'primary-container': '#06B6D4',
        secondary: '#06B6D4',
        tertiary: '#CBD5E1',
        error: '#06B6D4',
        success: '#06B6D4',
        outline: '#CBD5E1',
        'outline-variant': '#CBD5E1',
        'on-surface': '#CBD5E1',
        'on-surface-variant': '#CBD5E1',
        'on-primary-container': '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Hanken Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px #06B6D4',
      },
    },
  },
  plugins: [],
};

export default config;
