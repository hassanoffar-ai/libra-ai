import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          950: "#2E1065", // Deep Imperial Purple (Sidebar & Nav gradient start)
          900: "#3B0764", // Deep Royal Velvet
          800: "#4C1D95", // Primary Royal Purple
          700: "#5B21B6", // Primary Hover
          600: "#6D28D9", // Interactive Buttons & Accents
          500: "#7C3AED",
          400: "#A78BFA",
          300: "#C4B5FD", // Active rail indicator & highlights
          200: "#DDD6FE",
          100: "#EDE9FE",
          50: "#F5F3FF",
        },
        canvas: "#F7F5FC", // Soft Alabaster-Lilac main background
        surface: {
          DEFAULT: "#FFFFFF",
          border: "#E4E0F0", // Institutional thin border
          muted: "#F7F5FC",
        },
      },
    },
  },
  plugins: [],
};

export default config;

