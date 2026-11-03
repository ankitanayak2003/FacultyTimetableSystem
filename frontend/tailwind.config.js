/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#702536',
          dark: '#530e21',
          hover: '#5a1e2b',
          light: '#ffd9dd',
          subtle: '#fff0f2',
          container: '#702536',
        },
        canvas: {
          DEFAULT: '#fff8f2',
          muted: '#f5ebdd',
          dim: '#e2d9cb',
          paper: '#fbf5ee',
        },
        surface: {
          DEFAULT: '#ffffff',
          container: '#f7edde',
          'container-high': '#f1e7d9',
          'container-highest': '#ebe1d3',
        },
        accent: {
          teal: '#167d83',
          'teal-dark': '#00696e',
          'teal-light': '#97eef4',
          'teal-subtle': '#e0f7f8',
          violet: '#7762a8',
          'violet-dark': '#311b5e',
          'violet-light': '#eaddff',
          'violet-subtle': '#f3efff',
        },
        border: {
          beige: '#e7d9c8',
          subtle: '#eadcda',
        },
        ink: {
          DEFAULT: '#231b1b',
          muted: '#645450',
          light: '#877274',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          text: '#93000a',
        },
        success: {
          DEFAULT: '#1b6b3e',
          container: '#d1f4e0',
          text: '#0b4724',
        }
      },
      fontFamily: {
        headline: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'crisp-sm': '0 1px 2px 0 rgba(83, 14, 33, 0.04)',
        'crisp': '0 2px 4px 0 rgba(83, 14, 33, 0.06), 0 1px 2px -1px rgba(83, 14, 33, 0.04)',
        'crisp-md': '0 4px 12px -2px rgba(83, 14, 33, 0.08), 0 2px 6px -2px rgba(83, 14, 33, 0.04)',
        'crisp-lg': '0 10px 25px -4px rgba(83, 14, 33, 0.10), 0 4px 10px -3px rgba(83, 14, 33, 0.05)',
      },
      borderRadius: {
        'base': '0.25rem',
        'card': '0.5rem',
      }
    },
  },
  plugins: [],
}
