/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: { 950: "#0A1628", 900: "#0F2040", 800: "#16305C", 700: "#1E4277" },
        teal: { DEFAULT: "#0D9488" },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "#0F766E", foreground: "#FFFFFF" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      },
      borderRadius: { lg: "0.9rem", md: "0.65rem", sm: "0.45rem" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], display: ["'Fraunces', Georgia, serif"] },
      boxShadow: { soft: "0 20px 60px -20px rgba(10,22,40,.25)", card: "0 8px 30px -12px rgba(10,22,40,.18)" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        pulseSoft: { "0%,100%": { opacity: ".55" }, "50%": { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: { float: "float 7s ease-in-out infinite", pulseSoft: "pulseSoft 3s ease-in-out infinite" },
    },
  },
  plugins: [],
};
