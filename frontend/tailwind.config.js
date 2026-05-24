/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["ui-serif", "Charter", "Georgia", "serif"],
      },
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          400: "#7d7d85",
          600: "#46464d",
          800: "#1f1f23",
          900: "#0f0f12",
        },
        accent: {
          50: "#EEEDFE",
          500: "#5b53d9",
          700: "#3C3489",
        },
        // confidence tiers (results UI)
        tier: {
          high: "#dc2626",     // red — most concerning match
          medium: "#f59e0b",   // amber
          low: "#eab308",      // yellow
          none: "#9ca3af",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,15,18,0.04), 0 1px 0 rgba(15,15,18,0.04)",
      },
    },
  },
  plugins: [],
};
