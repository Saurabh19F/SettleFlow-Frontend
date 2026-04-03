/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        surface: {
          100: "#F8FAFC",
          900: "#080B1A"
        }
      },
      boxShadow: {
        glow: "0 0 24px rgba(56, 189, 248, 0.25)",
        glass: "0 10px 35px rgba(15, 23, 42, 0.25)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  darkMode: "class",
  plugins: []
};