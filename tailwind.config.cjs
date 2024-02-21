/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      scrollBehavior: ['smooth'],
      colors: {
        "aiot-blue": "#005072",
        'aiot-blue-md': '#0d596e',
        'aiot-blue-m': '#1c6269',
        'aiot-blue-ml': '#2c6c64',
        'aiot-blue-l': '#437a5c',
        'aiot-green-l': '#558556',
        'aiot-green-ml': '#6c944e',
        'aiot-green-m': '#91ab42',
        "aiot-green": "#aebd38"
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const generateGradientUtilities = () => {
        const utilities = {};

        // Create utilities for sizes from 10px to 300px, incremented by 10px.
        // Adjust as needed.
        for (let i = 10; i <= 800; i += 10) {
          utilities[`.text-aiot-gradient-${i}`] = {
            backgroundImage: 'linear-gradient(to right, #005072, #aebd38)',
            backgroundSize: `${i}px`,
            '-webkit-background-clip': 'text',
            '-moz-background-clip': 'text',
            'background-clip': 'text',
            color: 'transparent',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0% 50%',
          };
        }
        return utilities;
      };
      addUtilities(generateGradientUtilities(), ['responsive', 'hover'])
    },
    function ({ addUtilities }) {
      const gradientUtilities = {
        '.bg-aiot-gradient': {
          backgroundImage: 'linear-gradient(to right, #005072, #aebd38)',
        },
        '.bg-aiot-gradient-1': {
          backgroundImage: 'linear-gradient(to right, #0d596e, #558556)',
        },
        '.bg-aiot-gradient-2': {
          backgroundImage: 'linear-gradient(to right, #1c6269, #6c944e)',
        },
        '.bg-aiot-gradient-3': {
          backgroundImage: 'linear-gradient(to right, #2c6c64, #91ab42)',
        },
        '.bg-aiot-gradient-4': {
          backgroundImage: 'linear-gradient(to right, #437a5c, #aebd38)',
        },
        '.bg-aiot-gradient-5': {
          backgroundImage: 'linear-gradient(to right, #0d596e, #437a5c)',
        },
        '.bg-aiot-gradient-6': {
          backgroundImage: 'linear-gradient(to right, #005072, #2c6c64)',
        }
      };
      addUtilities(gradientUtilities, ['responsive', 'hover'])
    },
  ],
}
