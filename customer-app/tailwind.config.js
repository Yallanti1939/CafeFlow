/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafeflow: {
          bg: '#F7F3ED',
          bgSecondary: '#EFE7DC',
          card: '#FFFDF9',
          text: '#2C1B18',
          textMuted: '#6F5B52',
          accent: '#6B4226',
          dark: '#3B261C',
          light: '#D8C3A5',
          cta: '#B77945',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Libre Baskerville', 'serif'],
        sans: ['Inter', 'DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
