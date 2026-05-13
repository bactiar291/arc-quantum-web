import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quantum: {
          black: '#0A0A0A',
          panel: '#111111',
          ink: '#FFFFFF',
          yellow: '#FFE500',
          cyan: '#00FFE5',
          red: '#FF2D55',
          green: '#7CFF6B'
        }
      },
      boxShadow: {
        brutal: '5px 5px 0 #FFE500',
        brutalCyan: '5px 5px 0 #00FFE5',
        brutalRed: '5px 5px 0 #FF2D55'
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace']
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-110%)' },
          '100%': { transform: 'translateY(110%)' }
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseBorder: {
          '0%, 100%': { boxShadow: '5px 5px 0 #FFE500' },
          '50%': { boxShadow: '5px 5px 0 #00FFE5' }
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 2px)' }
        },
        float3d: {
          '0%, 100%': { transform: 'translateY(0) rotateX(58deg) rotateZ(42deg)' },
          '50%': { transform: 'translateY(-10px) rotateX(58deg) rotateZ(50deg)' }
        }
      },
      animation: {
        scan: 'scan 1.4s linear infinite',
        reveal: 'reveal 360ms ease-out both',
        pulseBorder: 'pulseBorder 1.8s ease-in-out infinite',
        glitch: 'glitch 420ms steps(2, end) infinite',
        float3d: 'float3d 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config
