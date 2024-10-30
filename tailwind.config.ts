import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
    colors: {
      dark: "rgba(27 29 40)",
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black:"#000000",
      orange: "#F68615",
      purple: "#3f3cbb",
      midnight: "#121063",
      metal: "#565584",
      tahiti: "#3ab7bf",
      silver: "#ecebff",
      "bubble-gum": "#ff77e9",
      bermuda: "#78dcca",
      pink:"#FE0BEE",
      placeHolder: "#6A6A6A",
      bgColor: {
        dark: "#16171B",
        ghost: "#4F334D",
        lime:"#2EE91A",
        teal:"#09D2FB",
        pink:"#FE0BEE",
        stroke: "#292B2E",
        stroke2: "#3F3F3F",
        light: "#1C243E",
        white:"#EAEAEA",
      },
    },
    fontFamily: {
      Hadenut: "Hadenut",
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
export default config;
