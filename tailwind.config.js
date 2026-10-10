/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.js"],
  theme: {
    extend: {
      colors: {
        bg: "#fbf9f5", bg2: "#f2ece4", card: "#ffffff", bd: "#e5ddd3",
        tx: "#191614", tx2: "#6e6862", hi: "#f59e0b",
        mo: "#fde68a", af: "#e0e7ff", ev: "#d1fae5",
        br: "#3d6473", df: "#e8592a", ebg: "#fef3c7", efg: "#b45309", ok: "#15803d",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
