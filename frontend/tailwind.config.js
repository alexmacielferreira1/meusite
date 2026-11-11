import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--folios-font-body)", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        serif: ["'Fraunces'", "Georgia", "serif"],
      },
      colors: {
        brand: { 50: "#FAF8FD", 100: "#E9D9FF", 200: "#dec3ff", 400: "#C896FF", 500: "#8F3FF6", 600: "#6A11CB", 700: "#570ca8", 900: "#2e0952" },
        plum: { 900: "#170F25", 800: "#2a1648" },
        ink: { 950: "#0b0d12", 900: "#12151c", 800: "#1b1f29", 700: "#272c39" },
      },
    },
  },
  plugins: [containerQueries],
};
