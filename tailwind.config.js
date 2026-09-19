/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#0b0f17',         // Main clean dark background
          card: '#131926',       // Modern card background
          cardHover: '#182030',  // Hover card state
          border: '#20293a',     // Subtle border
          accent: '#3b82f6',     // Primary blue accent
          accentHover: '#2563eb',
        },
        traffic: {
          free: '#10b981',       // 🟢 Free / Improving
          moderate: '#f59e0b',   // 🟡 Moderate
          heavy: '#f97316',      // 🟠 Heavy
          critical: '#f43f5e',   // 🔴 Critical
        },
      },
    },
  },
  plugins: [],
}
