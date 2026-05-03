/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00E5FF',
          violet: '#7C3AED',
          dark: '#0A0A1A',
          card: 'rgba(255,255,255,0.05)',
        },
      },
    },
  },
  plugins: [],
}
