/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS and JSX files in src/ for Tailwind classes
    "./public/index.html",         // Scan public/index.html as well
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Define custom font family
      },
      colors: {
        // Define any custom colors if needed, e.g.,
        // primary: '#4a90e2',
        // secondary: '#6a5acd',
      },
    },
  },
  plugins: [],
};
