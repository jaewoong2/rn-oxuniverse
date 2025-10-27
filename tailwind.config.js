/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090b11',
        surface: '#11131a',
        card: '#181c25',
        accent: '#5b8cf7',
        success: '#22c55e',
        warning: '#facc15',
        danger: '#ef4444',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple SD Gothic Neo',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
