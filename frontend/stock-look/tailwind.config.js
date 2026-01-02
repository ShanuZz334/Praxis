/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        stocky: "#1E2BFF", // 🔵 Stocky brand blue
      },
      boxShadow: {
        stocky: "0 0 20px rgba(30,43,255,0.45)", // optional glow
      },
    },
  },

  plugins: [],
};
