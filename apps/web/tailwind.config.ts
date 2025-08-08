import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#FAFAFA", // Slightly off-white for ultra-clean feel
        foreground: "#1A1A1A", // Softer black
        primary: {
          DEFAULT: "#007AFF", // iOS-style blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F5F7", // Very subtle gray
          foreground: "#6E6E73", // Muted text
        },
        muted: {
          DEFAULT: "#F5F5F7",
          foreground: "#8E8E93", // Even more muted
        },
        accent: {
          DEFAULT: "#F2F2F7", // Ultra-subtle hover
          foreground: "#6E6E73",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        // Ultra-clean color system
        "text-primary": "#1A1A1A",
        "text-secondary": "#6E6E73",
        "text-tertiary": "#8E8E93",
        "border-subtle": "#F2F2F7",
        "border-light": "#E5E5EA",
        "accent-blue": "#007AFF",
        "accent-blue-hover": "#0056CC",
        "status-online": "#30D158", // iOS green
        "status-offline": "#8E8E93",
      },
      borderRadius: {
        lg: "12px", // More generous rounding
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0, 0, 0, 0.04)", // Ultra-subtle shadow
        card: "0 2px 8px rgba(0, 0, 0, 0.04)", // Card elevation
        "input-focus": "0 0 0 3px rgba(0, 122, 255, 0.1)", // Subtle focus ring
      },
      fontSize: {
        xs: "11px",
        sm: "13px",
        base: "15px", // Slightly larger base
        lg: "17px",
        xl: "19px",
        "2xl": "24px",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
