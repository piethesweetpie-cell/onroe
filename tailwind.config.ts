import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#207fc5",
        "primary-container": "#dcecf8",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#154f7b",
        surface: "#FFFFFF",
        background: "#F9FAFB",
        "on-surface": "#111827",
        "on-surface-variant": "#4B5563",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F3F4F6",
        "surface-container": "#E5E7EB",
        outline: "#9CA3AF",
        "outline-variant": "#D1D5DB",
      },
      fontFamily: {
        headline: ["var(--font-plus-jakarta)", "var(--font-noto-sans-kr)", "sans-serif"],
        body: ["var(--font-noto-sans-kr)", "sans-serif"],
        label: ["var(--font-noto-sans-kr)", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1.25rem",
        xl: "2rem",
        full: "9999px",
      },
      boxShadow: {
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        premium: "0 20px 40px rgba(32, 127, 197, 0.08)",
        "btn-hover": "0 8px 30px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
}
export default config
