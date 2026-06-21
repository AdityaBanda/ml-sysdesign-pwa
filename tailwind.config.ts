import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Duolingo-inspired palette
        duo: {
          green: "#58cc02",
          greenDark: "#46a302",
          blue: "#1cb0f6",
          purple: "#ce82ff",
          orange: "#ff9600",
          red: "#ff4b4b",
          gold: "#ffc800",
          gray: "#777777",
          bg: "#0f1115",
          card: "#1a1d24",
          border: "#2a2f3a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        pop: "pop 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
