import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F1A",
        "ink-2": "#111827",
        brass: "#A78BFA",
        "brass-2": "#C4B5FD",
        parchment: "#E5E7EB",
        "parchment-dim": "#94A3B8",
        line: "#263247",
        ember: "#E06B61",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        "radial-stars": "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
