/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        input: "hsl(var(--border))",
        ring: "hsl(var(--primary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--text))",
        surface: "hsl(var(--surface))",
        "elevated-surface": "hsl(var(--elevated-surface))",
        "muted-text": "hsl(var(--muted-text))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--surface))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--surface))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--text))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--surface))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-text) / 0.1)",
          foreground: "hsl(var(--muted-text))",
        },
        secondary: {
          DEFAULT: "hsl(var(--border))",
          foreground: "hsl(var(--text))",
        },
        accent: {
          DEFAULT: "hsl(var(--primary) / 0.1)",
          foreground: "hsl(var(--primary))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          'Inter',
          'sans-serif',
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}