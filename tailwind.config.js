/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        foreground: "#09090B",
        card: "#FFFFFF",
        "card-foreground": "#09090B",
        muted: "#F1F0F2",
        "muted-foreground": "#71717A",
        border: "#E3E1E6",
        input: "#E3E1E6",
        secondary: "#F1F0F2",
        "secondary-foreground": "#18181B",
        primary: "#4F46E5",
        "primary-foreground": "#FFFFFF",
        destructive: "#E5484D",
        "destructive-foreground": "#FFFFFF",
        ring: "#4F46E5",
      },
    },
  },
  plugins: [],
}
