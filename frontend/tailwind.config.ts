import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#000000',
        'surface-low': '#000000',
        'surface-high': '#ffffff',
        'surface-highest': '#ffffff',
        primary: '#2563EB',
        'primary-container': '#2563EB',
        secondary: '#F59E0B',
        tertiary: '#ffffff',
        error: '#F59E0B',
        success: '#2563EB',
        outline: '#ffffff',
        'outline-variant': '#ffffff',
        'on-surface': '#ffffff',
        'on-surface-variant': '#ffffff',
        'on-primary-container': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Hanken Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px #2563EB',
      },
    },
  },
  plugins: [],
};

export default config;
