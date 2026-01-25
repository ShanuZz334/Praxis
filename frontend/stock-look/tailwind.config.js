import { colors } from './src/shared/global/styles/palette.js';
import { fonts } from './src/shared/global/styles/fonts.js';

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
        ...colors, // Spread palette colors into tailwind theme
      },
      fontFamily: {
        sans: [fonts.primary],
        brand: [fonts.brand],
        mono: [fonts.mono],
      },
      boxShadow: {
        stocky: "0 0 20px rgba(30,43,255,0.45)", // optional glow
      },
    },
  },

  plugins: [],
};
