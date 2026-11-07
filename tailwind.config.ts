import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0F172A", // Deep navy for sidebar
          800: "#1E293B",
        },
      },
    },
  },
  plugins: [],
};

export default config;

