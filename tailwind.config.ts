import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcd9ff",
          300: "#8ec0ff",
          400: "#599cff",
          500: "#3478f6",
          600: "#1f59e0",
          700: "#1a46b8",
          800: "#1c3d93",
          900: "#1d3874",
          950: "#152348"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.06)",
        card: "0 8px 30px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
