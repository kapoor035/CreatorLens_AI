import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        glass: {
          DEFAULT: "rgba(17, 25, 40, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(99, 102, 241, 0.15)",
        },
        brand: {
          youtube: "#FF0000",
          instagram: "#E1306C",
          primary: "#6366F1",   // sleek Indigo
          secondary: "#8B5CF6", // sleek Violet
          accent: "#10B981"    // sleek Emerald
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "radial-dark": "radial-gradient(circle at top, #1e1b4b 0%, #09090b 100%)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
