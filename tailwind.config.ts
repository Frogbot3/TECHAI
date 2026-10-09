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
        admin: Object.fromEntries(
          [
            "page",
            "surface",
            "subtle",
            "border",
            "text",
            "muted",
            "primary",
            "primary-hover",
            "on-primary",
            "selected",
            "success",
            "success-bg",
            "warning",
            "warning-bg",
            "danger",
            "danger-bg",
            "info",
            "info-bg",
          ].map((name) => [name, `var(--admin-${name})`]),
        ),
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
