import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quantum: {
          black: '#08111F',
          panel: '#101B2D',
          ink: '#FFF9ED',
          yellow: '#FFD166',
          cyan: '#32D9FF',
          red: '#FF5578',
          green: '#6DFFB1',
          purple: '#B884FF',
          orange: '#FF9F1C'
        }
      },
      boxShadow: {
        brutal: '5px 5px 0 #FFD166',
        brutalCyan: '5px 5px 0 #32D9FF',
        brutalRed: '5px 5px 0 #FF5578'
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
          '0%, 100%': { boxShadow: '5px 5px 0 #FFD84A' },
          '50%': { boxShadow: '5px 5px 0 #38DFF4' }
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
        },
        logo3d: {
          '0%, 100%': { transform: 'rotateX(-18deg) rotateY(28deg) rotateZ(-4deg)' },
          '50%': { transform: 'rotateX(-10deg) rotateY(42deg) rotateZ(4deg)' }
        }
      },
      animation: {
        scan: 'scan 1.4s linear infinite',
        reveal: 'reveal 360ms ease-out both',
        pulseBorder: 'pulseBorder 1.8s ease-in-out infinite',
        glitch: 'glitch 420ms steps(2, end) infinite',
        float3d: 'float3d 4s ease-in-out infinite',
        logo3d: 'logo3d 5s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config
