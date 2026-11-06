import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1C2230", soft: "#4B5468", mute: "#6B7488" },
        paper: "#F4F5F9",
        line: "#E3E6EE",
        brand: { 50: "#EEF1FF", 100: "#DDE3FF", 200: "#BCC7FF", 500: "#4056E0", 600: "#3345C7", 700: "#2937A3" },
        pencil: { 100: "#FFF3CC", 300: "#FFD966", 400: "#FFC93C", 500: "#F5B300" },
        correct: { DEFAULT: "#15803D", hover: "#166534", light: "#DCFCE7", dark: "#14532D" },
        wrong: { DEFAULT: "#B91C1C", hover: "#991B1B", light: "#FEE2E2", dark: "#7F1D1D" },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-fredoka)", "var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      keyframes: {
        pop: { "0%": { transform: "scale(0.9)", opacity: "0" }, "60%": { transform: "scale(1.04)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%": { transform: "translateX(-10px)" }, "40%": { transform: "translateX(10px)" }, "60%": { transform: "translateX(-6px)" }, "80%": { transform: "translateX(6px)" } },
        slideIn: { "0%": { transform: "translateY(14px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        floatUp: { "0%": { transform: "translateY(0) scale(1)", opacity: "1" }, "100%": { transform: "translateY(-34px) scale(1.25)", opacity: "0" } },
        confetti: { "0%": { transform: "translate3d(0,-10vh,0) rotate(0deg)", opacity: "1" }, "100%": { transform: "translate3d(var(--dx),105vh,0) rotate(var(--rot))", opacity: "0.9" } },
      },
      animation: {
        pop: "pop 0.35s ease-out both",
        shake: "shake 0.45s ease-in-out both",
        "slide-in": "slideIn 0.3s ease-out both",
        "float-up": "floatUp 1s ease-out both",
        confetti: "confetti var(--dur) linear var(--delay) forwards",
      },
    },
  },
  plugins: [],
};

export default config;