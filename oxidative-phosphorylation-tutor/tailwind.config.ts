import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122022",
        panel: "#f7fbfb",
        marine: "#176b87",
        mint: "#37a987",
        amber: "#f2a93b",
        coral: "#e46a5d"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(18, 32, 34, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
