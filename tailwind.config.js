/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#EAF4EC",
        coral: {
          DEFAULT: "#3F8F5F",
          dark: "#2F7048",
          light: "#D8EEDD",
        },
        plum: "#22322A",
        sage: {
          DEFAULT: "#5B9AA0",
          light: "#DCEEF0",
        },
        gold: "#F0B429",
        tan: "#CFE0D2",
      },
      fontFamily: {
        display: ["'Gowun Dodum'", "sans-serif"],
        body: ["'Gowun Dodum'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        warm: "0 4px 20px -4px rgba(34, 50, 42, 0.12)",
        "warm-lg": "0 8px 30px -6px rgba(34, 50, 42, 0.18)",
      },
    },
  },
  plugins: [],
};
