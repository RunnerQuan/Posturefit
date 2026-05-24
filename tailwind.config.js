/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['PingFang SC', 'Microsoft YaHei', 'Heiti SC', 'Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        blush: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        mist: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
        },
      },
      boxShadow: {
        'card':        '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover':  '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'bubble':      '0 8px 32px rgba(196, 132, 252, 0.25), 0 0 60px rgba(244, 114, 182, 0.15)',
        'glow':        '0 0 40px rgba(244, 114, 182, 0.4)',
        'soft':        '0 4px 20px rgba(167, 139, 250, 0.15)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      fontSize: {
        hero:  ['3.5rem',  { lineHeight: '1.2',  letterSpacing: '-0.02em' }],
        h1:    ['2.5rem',  { lineHeight: '1.3',  letterSpacing: '-0.02em' }],
        h2:    ['1.875rem',{ lineHeight: '1.3',  letterSpacing: '-0.01em' }],
        h3:    ['1.5rem',  { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        h4:    ['1.25rem', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
