import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        accent: '#58a6ff',
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
        'high-contrast': '#ffffff',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      ringWidth: {
        DEFAULT: '3px',
      },
      ringColor: {
        focus: '#eab308',
      },
      animation: {
        'toast-enter': 'toastEnter 0.3s ease-out forwards',
        'toast-exit': 'toastExit 0.3s ease-in forwards',
      },
      keyframes: {
        toastEnter: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastExit: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
