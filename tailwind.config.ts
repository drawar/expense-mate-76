
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        // Moss Dark UI font family
        moss: ['var(--font-family-base)'],
      },
      scale: {
        '102': '1.02',
      },
      spacing: {
        // Moss Dark UI spacing tokens
        'moss-xs': 'var(--space-xs)',
        'moss-sm': 'var(--space-sm)',
        'moss-md': 'var(--space-md)',
        'moss-lg': 'var(--space-lg)',
        'moss-xl': 'var(--space-xl)',
        'moss-2xl': 'var(--space-2xl)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // Moss Dark UI shadows
        'moss-card-mobile': 'var(--shadow-card-mobile)',
        'moss-card-desktop': 'var(--shadow-card-desktop)',
        'moss-card-hover': 'var(--shadow-card-hover)',
        'moss-glow-accent': 'var(--shadow-glow-accent)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add olive-green color for the grid components
        "olive-green": "#606c38",
        // Moss Dark UI colors
        moss: {
          bg: "var(--color-bg)",
          card: "var(--color-card-bg)",
          surface: "var(--color-surface)",
          border: "var(--color-border)",
          track: "var(--color-track)",
          text: "var(--color-text)",
          "text-secondary": "var(--color-text-secondary)",
          "text-muted": "var(--color-text-muted)",
          accent: "var(--color-accent)",
          "accent-glow": "var(--color-accent-glow)",
          "accent-subtle": "var(--color-accent-subtle)",
          danger: "var(--color-danger)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Moss Dark UI border radius
        'moss-card': "var(--radius-card)",
        'moss-input': "var(--radius-input)",
        'moss-pill': "var(--radius-pill)",
        'moss-sm': "var(--radius-sm)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)" },
          to: { transform: "scale(1)" },
        },
        "scale-out": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(0.95)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
