/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          50: '#faf5f0',
          100: '#f0e6d8',
          200: '#e0ccb0',
          300: '#cda97f',
          400: '#bd8a56',
          500: '#a87040',
          600: '#8a5a36',
          700: '#6e4730',
          800: '#5c3c2d',
          900: '#4e3428',
        },
      },
    },
  },
  plugins: [],
}
