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
        foreground: "hsl(var(--foreground))",
        'da-primary-100': 'hsl(var(--da-primary-100))',
        'da-primary-300': 'hsl(var(--da-primary-300))',
        'da-primary-500': 'hsl(var(--da-primary-500))',
        'da-accent-100': 'hsl(var(--da-accent-100))',
        'da-accent-300': 'hsl(var(--da-accent-300))',
        'da-accent-500': 'hsl(var(--da-accent-500))',
        'da-white': 'hsl(var(--da-white))',
        'da-black': 'hsl(var(--da-black))',
        'da-gray-light': 'hsl(var(--da-gray-light))',
        'da-gray-dark': 'hsl(var(--da-gray-dark))',
        'da-gradient-from': 'hsl(var(--da-gradient-from))',
        'da-gradient-to': 'hsl(var(--da-gradient-to))',
        // primary: {
        //   50: "#fdf8f6",
        //   100: "#f2e8e5",
        //   200: "#eaddd7",
        //   300: "#e0cec7",
        //   400: "#d2bab0",
        //   500: "#bfa094",
        //   600: "#a18072",
        //   700: "#977669",
        //   800: "#846358",
        //   900: "#43302b",
        // },
        // primary: colors.teal,
        secondary: colors.gray,
        accent: colors.orange,
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        'da-txt-small': 'var(--font-size-small)',
        'da-txt-regular': 'var(--font-size-regular)',
        'da-txt-medium': 'var(--font-size-medium)',
        'da-txt-large': 'var(--font-size-large)',
        'da-txt-huge': 'var(--font-size-huge)',
      },
      fontWeight: {
        'thin': 'var(--font-weight-thin)',
        'regular': 'var(--font-weight-regular)',
        'medium': 'var(--font-weight-medium)',
        'bold': 'var(--font-weight-bold)',
        'huge': 'var(--font-weight-huge)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"),
  function ({ addUtilities, theme }) {
    const newUtilities = {
      '.da-txt-small': {
        fontSize: theme('fontSize.da-txt-small'),
        fontWeight: 'var(--font-weight-regular)',
      },
      '.da-txt-bold-small': {
        fontSize: theme('fontSize.da-txt-small'),
        fontWeight: 'var(--font-weight-bold)',
      },
      '.da-txt-thin-small': {
        fontSize: theme('fontSize.da-txt-small'),
        fontWeight: 'var(--font-weight-thin)',
      },
      '.da-txt-regular': {
        fontSize: theme('fontSize.da-txt-regular'),
        fontWeight: 'var(--font-weight-regular)',
      },
      '.da-txt-bold-regular': {
        fontSize: theme('fontSize.da-txt-regular'),
        fontWeight: 'var(--font-weight-bold)',
      },
      '.da-txt-thin-regular': {
        fontSize: theme('fontSize.da-txt-regular'),
        fontWeight: 'var(--font-weight-thin)',
      },
      '.da-txt-medium': {
        fontSize: theme('fontSize.da-txt-medium'),
        fontWeight: 'var(--font-weight-regular)',
      },
      '.da-txt-bold-medium': {
        fontSize: theme('fontSize.da-txt-medium'),
        fontWeight: 'var(--font-weight-bold)',
      },
      '.da-txt-thin-medium': {
        fontSize: theme('fontSize.da-txt-medium'),
        fontWeight: 'var(--font-weight-thin)',
      },
      '.da-txt-large': {
        fontSize: theme('fontSize.da-txt-large'),
        fontWeight: 'var(--font-weight-regular)',
      },
      '.da-txt-bold-large': {
        fontSize: theme('fontSize.da-txt-large'),
        fontWeight: 'var(--font-weight-bold)',
      },
      '.da-txt-huge': {
        fontSize: theme('fontSize.da-txt-huge'),
        fontWeight: 'var(--font-weight-regular)',
      },
      '.da-txt-bold-huge': {
        fontSize: theme('fontSize.da-txt-huge'),
        fontWeight: 'var(--font-weight-bold)',
      },
    }

    addUtilities(newUtilities, ['responsive', 'hover'])
  }
  ],
};
