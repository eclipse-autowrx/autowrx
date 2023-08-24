/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "aiot-blue": "#005072",
        "aiot-green": "#aebd38"
      },
    },
  },
  plugins: [],
}
