const dotenv = require("dotenv");
dotenv.config();

console.log("Environment Variables Loaded:", process.env.VITE_DEPLOY_INSTANCE);

const instance = process.env.VITE_DEPLOY_INSTANCE || "playground";

const instancesConfig = {
  etas: {
    "--brand-primary": "219 74% 33%", // Blue for etas
    "--brand-secondary": "307 96% 27%", // Purple for etas
    "--brand-accent": "307 96% 27%", // Purple for etas
  },
  playground: {
    "--brand-primary": "198 100% 22%", // digital.auto blue
    "--brand-secondary": "67 54% 48%", // digital.auto green
    "--brand-accent": "67 54% 48%", // digital.auto green
  },
  covesa: {
    "--brand-primary": "211 45% 37%", // covesa blue
    "--brand-secondary": "186 100% 38%", // covesa teal blue
    "--brand-accent": "295 31% 46%",
  },
};

const activeInstance = instancesConfig[instance] || instancesConfig["playground"];

/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        brand: {
          primary: `hsl(${activeInstance["--brand-primary"]})`,
          secondary: `hsl(${activeInstance["--brand-secondary"]})`,
          accent: `hsl(${activeInstance["--brand-accent"]})`,
        },
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
  plugins: [
    require("tailwindcss-animate"),
    function ({ addBase }) {
      addBase({
        ":root": {
          "--brand-primary": `hsl(${activeInstance["--brand-primary"]})`,
          "--brand-secondary": `hsl(${activeInstance["--brand-secondary"]})`,
          "--brand-secondary": `hsl(${activeInstance["--brand-accent"]})`,
        },
      });
    },
    function ({ addUtilities }) {
      const generateGradientUtilities = () => {
        const utilities = {};

        // Create utilities for sizes from 10px to 300px, incremented by 10px.
        for (let i = 10; i <= 800; i += 10) {
          utilities[`.text-custom-gradient-${i}`] = {
            backgroundImage: `linear-gradient(to right, hsl(${activeInstance["--brand-primary"]}), hsl(${activeInstance["--brand-secondary"]}))`,
            backgroundSize: `${i}px`,
            "-webkit-background-clip": "text",
            "-moz-background-clip": "text",
            "background-clip": "text",
            color: "transparent",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0% 50%",
          };
        }
        return utilities;
      };
      addUtilities(generateGradientUtilities(), ["responsive", "hover"]);
    },
    function ({ addUtilities }) {
      const generateBgGradientUtilities = () => {
        const utilities = {
          ".bg-custom-gradient": {
            backgroundImage: `linear-gradient(to right, hsl(${activeInstance["--brand-primary"]}), hsl(${activeInstance["--brand-secondary"]}))`,
          },
        };

        // Create utilities for sizes from 10px to 800px, incremented by 10px.
        for (let i = 10; i <= 800; i += 10) {
          utilities[`.bg-custom-gradient-${i}`] = {
            backgroundImage: `linear-gradient(to right, hsl(${activeInstance["--brand-primary"]}), hsl(${activeInstance["--brand-secondary"]}))`,
            backgroundSize: `${i}px ${i}px`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0% 50%",
          };
        }
        return utilities;
      };

      addUtilities(generateBgGradientUtilities(), ["responsive", "hover"]);
    },
  ],
};
