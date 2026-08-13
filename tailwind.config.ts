import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0B5ED7",
          "blue-dark": "#073B8C",
          red: "#D62828",
          "red-light": "#FDECEC",
          bg: "#F5F8FC",
          text: "#102033",
        },
      },
    },
  },
  plugins: [],
};
export default config;
