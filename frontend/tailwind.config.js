/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        surface: '#0d1526',
        card: '#111827',
        border: '#1e2d45',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        muted: '#64748b',
        subtle: '#1a2540',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}