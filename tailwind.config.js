/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fides: {
          primary: '#1e3a5f',
          secondary: '#2d5a87',
          accent: '#f59e0b',
          light: '#e8f4fc',
        }
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

