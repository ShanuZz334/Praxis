import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwind(), react()],
  server: {
    host: "localhost",
    port: 5000,       // ✅ SAFE PORT
    strictPort: true,
  },
});
