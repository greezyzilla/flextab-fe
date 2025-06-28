import colors from "tailwindcss/colors"

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  plugins: [],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: colors.black,
          ...colors.neutral,
        },
      }
    }
  }
}