/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grape: {
          50: '#FFF8E7',
          100: '#FFF4D6',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C3AED',
          800: '#5B21B6',
          900: '#32145F',
          950: '#24104F',
        },
        teal: {
          400: '#F9A8D4',
          500: '#EC4899',
          600: '#DB2777',
        },
        amber: {
          400: '#FDE68A',
          500: '#FACC15',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
