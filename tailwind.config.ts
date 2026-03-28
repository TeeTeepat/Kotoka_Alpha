import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1ad3e2",
        "primary-dark": "#0fb8c9",
        background: "#effbfd",
        "accent-pink": "#f9d0cc",
        "accent-lavender": "#ded6ec",
        "accent-plum": "#98739b",
        gold: "#f5c842",
        orange: "#ff8c42",
        dark: "#2d3748",
        border: "#e2ecf0",
        "card-border": "#e8f6f8",
      },
      fontFamily: {
        heading: ["var(--font-nunito)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(26,211,226,0.08), 0 1px 4px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 32px rgba(26,211,226,0.16), 0 2px 8px rgba(0,0,0,0.08)",
        "btn-aqua": "0 4px 16px rgba(26,211,226,0.35)",
        "btn-gold": "0 4px 16px rgba(245,200,66,0.35)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0px rgba(26,211,226,0.4)" },
          "50%": { boxShadow: "0 0 8px rgba(26,211,226,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
