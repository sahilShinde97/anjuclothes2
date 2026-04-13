/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#d4a95f',
        champagne: '#f4dfb1',
        charcoal: '#0b0b0c',
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'serif'],
        body: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 45px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
