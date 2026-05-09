/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background:     '#0a0f1e',
        surface:        '#0d1526',
        card:           '#111827',
        border:         '#1e2d45',
        accent:         '#3b82f6',
        'accent-hover': '#2563eb',
        danger:         '#ef4444',
        success:        '#22c55e',
        warning:        '#f59e0b',
        muted:          '#64748b',
        subtle:         '#1a2540',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
        'count-up':   'countUp 0.4s ease-out',
      },
      boxShadow: {
        'glow-success': '0 0 20px rgba(34,197,94,0.15)',
        'glow-danger':  '0 0 20px rgba(239,68,68,0.15)',
        'glow-accent':  '0 0 20px rgba(59,130,246,0.15)',
      },
    },
  },
  plugins: [],
}