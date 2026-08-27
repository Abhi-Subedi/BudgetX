/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        sunken: "var(--color-sunken)",
        line: "var(--color-line)",
        ink: "var(--color-ink)",
        ink2: "var(--color-ink2)",
        ink3: "var(--color-ink3)",
        brand: {
          DEFAULT: "#10B981",
          strong: "#34D399",
          tint: "#0A2E1C",
          fade: "#072315"
        },
        pos: "#22C55E",
        neg: "#EF4444",
        negtint: "#1C1013",
        warn: "#F59E0B",
        warntint: "#1C1710",
        info: "#3B82F6"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif"
        ],
        display: [
          "Manrope",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem" }]
      },
      boxShadow: {
        line: "inset 0 0 0 1px var(--color-line)",
        lift: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)",
        modal: "0 8px 40px rgba(0,0,0,.55)"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        popIn: {
          from: { opacity: "0", transform: "scale(.97) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        drawIn: {
          from: { strokeDashoffset: "1200" },
          to: { strokeDashoffset: "0" }
        }
      },
      animation: {
        "fade-in": "fadeIn .18s ease-out both",
        "rise-in": "riseIn .22s ease-out both",
        "pop-in": "popIn .18s cubic-bezier(.2,.9,.3,1.2) both",
        "draw-in": "drawIn .9s ease-out both"
      }
    }
  },
  plugins: []
};
