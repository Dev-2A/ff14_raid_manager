/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FF14 테마 색상
        'ff14-blue': {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0066cc',  // 메인 파란색
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        'ff14-gold': {
          50: '#fffbf0',
          100: '#fff0cc',
          200: '#ffe5a8',
          300: '#ffdb85',
          400: '#ffd061',
          500: '#ffc53d',  // 메인 금색
          600: '#cc9e31',
          700: '#997625',
          800: '#664f19',
          900: '#33270c',
        },
        'ff14-dark': {
          100: '#2a2a2a',
          200: '#1f1f1f',
          300: '#141414',
          400: '#0a0a0a',
          500: '#000000',
        }
      },
      fontFamily: {
        'game': ['Orbitron', 'sans-serif'],  // 게임스러운 폰트
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          'from': { 
            textShadow: '0 0 10px #0066cc, 0 0 20px #0066cc, 0 0 30px #0066cc' 
          },
          'to': { 
            textShadow: '0 0 20px #0066cc, 0 0 30px #0066cc, 0 0 40px #0066cc' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-game': 'linear-gradient(135deg, #0066cc 0%, #004499 50%, #002966 100%)',
        'gradient-gold': 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffc53d 100%)',
      },
      boxShadow: {
        'game': '0 4px 20px rgba(0, 102, 204, 0.3)',
        'gold': '0 4px 20px rgba(255, 197, 61, 0.3)',
        'inner-game': 'inset 0 2px 4px 0 rgba(0, 102, 204, 0.2)',
      },
    },
  },
  plugins: [],
}