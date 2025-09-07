/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        educanvas: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bbd9ff',
          300: '#7fb8ff',
          400: '#3b94ff',
          500: '#0070f3',
          600: '#0761d1',
          700: '#0952a5',
          800: '#0d4488',
          900: '#133a70',
          950: '#0a1f3a',
        }
      },
    },
  },
  plugins: [],
}

