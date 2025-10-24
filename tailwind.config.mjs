/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2d3f7b', // deep blue
        'secondary': '#d1d6e5', // lighter blue
        'accent': '#3b82f6', // medium blue
        'background': '#f0f9ff', // very light blue
        'card': '#ffffff',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      animation: {
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}