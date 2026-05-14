import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        plex: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
