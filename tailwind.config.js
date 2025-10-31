const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./docs/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        twilight: {
          DEFAULT: "#0b1220",
          overlay: "rgba(15,23,42,0.85)",
          veil: "rgba(15,23,42,0.72)",
          ember: "#fcd34d",
          blush: "#f973af",
          lagoon: "#38bdf8",
        },
        parchment: "#fefce8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        glass: "16px",
      },
      boxShadow: {
        "glass-lg": "0 32px 60px rgba(8, 15, 25, 0.55)",
        "glass-md": "0 24px 48px rgba(8, 15, 25, 0.45)",
        "glass-sm": "0 16px 32px rgba(8, 15, 25, 0.35)",
      },
      backdropBlur: {
        lounge: "24px",
      },
      animation: {
        "aurora-drift": "auroraDrift 22s ease-in-out infinite alternate",
        breath: "breath 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2800ms ease-in-out infinite",
        "ribbon-glow": "ribbonGlow 4s ease-in-out infinite",
      },
      keyframes: {
        auroraDrift: {
          "0%": { transform: "translate3d(-2%, -3%, 0) scale(1.05)" },
          "100%": { transform: "translate3d(3%, 2%, 0) scale(1.1)" },
        },
        breath: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-2px)" },
          "100%": { transform: "translateY(0px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.65 },
          "50%": { opacity: 1 },
        },
        ribbonGlow: {
          "0%, 100%": { boxShadow: "0 12px 26px rgba(252,211,77,0.38)" },
          "50%": { boxShadow: "0 16px 34px rgba(252,211,77,0.55)" },
        },
      },
    },
  },
  plugins: [],
};
