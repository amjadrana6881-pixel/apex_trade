/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0d14',
          800: '#0e121b',
          700: '#121722',
          600: '#182030',
          500: '#232d3f',
        },
        primary: {
          500: '#2563eb',
          400: '#3b82f6',
        },
        'neon-blue': '#00d2ff',
      },
    },
  },
  plugins: [],
}
