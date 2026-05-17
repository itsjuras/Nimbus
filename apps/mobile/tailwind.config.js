/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        plex: ['"IBM Plex Mono"', 'monospace'],
        'plex-medium': ['"IBMPlexMono_500Medium"'],
        'plex-bold': ['"IBMPlexMono_700Bold"'],
      },
    },
  },
  plugins: [],
}
