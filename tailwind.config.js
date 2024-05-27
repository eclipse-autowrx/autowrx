/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
module.exports = {
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--da-gray-medium))",
        "da-primary": {
          100: "hsl(var(--da-primary-100))",
          300: "hsl(var(--da-primary-300))",
          500: "hsl(var(--da-primary-500))",
        },
        "da-accent": {
          100: "hsl(var(--da-accent-100))",
          300: "hsl(var(--da-accent-300))",
          500: "hsl(var(--da-accent-500))",
        },
        "da-white": "hsl(var(--da-white))",
        "da-black": "hsl(var(--da-black))",
        'da-gray-light': 'hsl(var(--da-gray-light))',
        'da-gray-medium': 'hsl(var(--da-gray-medium))',
        'da-gradient-from': 'hsl(var(--da-gradient-from))',
        'da-gradient-to': 'hsl(var(--da-gradient-to))',
        primary: colors.teal,
        secondary: colors.gray,
        accent: colors.orange,
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      // keyframes: {
      //   "accordion-down": {
      //     from: { height: "0" },
      //     to: { height: "var(--radix-accordion-content-height)" },
      //   },
      //   "accordion-up": {
      //     from: { height: "var(--radix-accordion-content-height)" },
      //     to: { height: "0" },
      //   },
      // },
      // animation: {
      //   "accordion-down": "accordion-down 0.2s ease-out",
      //   "accordion-up": "accordion-up 0.2s ease-out",
      // },
      maxHeight: {
        'xs': '20rem', // Same as tailwind defined value
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")
  ],
};
