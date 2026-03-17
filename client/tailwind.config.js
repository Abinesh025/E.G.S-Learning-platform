/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f4f0',
          100: '#e8e6e0',
          200: '#d0cdc4',
          300: '#b0aca0',
          400: '#8c887a',
          500: '#6e6a5c',
          600: '#56524a',
          700: '#403e38',
          800: '#2a2824',
          900: '#1a1916',
          950: '#0e0d0b',
        },
        lime: {
          300: '#c8f04a',
          400: '#b5e035',
          500: '#9acc1f',
        },
        sky: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        }
      }
    }
  },
  plugins: []
}
