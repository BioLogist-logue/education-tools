/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'bg-purple-200',
    'bg-purple-300',
    'bg-purple-400',
    'bg-purple-500',
    'bg-yellow-100',
    'bg-yellow-200',
    'bg-yellow-300',
    'bg-yellow-400',
    'bg-orange-200',
    'bg-orange-300',
    'bg-orange-400'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};
