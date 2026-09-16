import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1524",        // ღრმა ცის ფერი — ფონი
        "ink-2": "#141D33",
        brass: "#C9A24B",      // ძველი ვარსკვლავური რუკის ბრინჯაო
        "brass-2": "#E4C878",
        parchment: "#F3EEE1",  // ტექსტი / სინათლის ზედაპირი
        "parchment-dim": "#CFC6AE",
        line: "#2A3550",
        ember: "#B5563C",      // მითითებები, ცდომილება, აქცენტი
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        "radial-stars": "radial-gradient(circle at 50% 0%, rgba(201,162,75,0.10), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
