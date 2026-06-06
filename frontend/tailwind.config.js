/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#050d1a",
          800: "#0a1628",
          700: "#0f2040",
          600: "#162a52",
        },
        neon: {
          green: "#00ff88",
          purple: "#a855f7",
          red: "#ff4560",
          blue: "#00b4ff",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,255,136,0.3)",
        "neon-red": "0 0 20px rgba(255,69,96,0.3)",
        "neon-purple": "0 0 20px rgba(168,85,247,0.3)",
      },
    },
  },
  plugins: [],
};
