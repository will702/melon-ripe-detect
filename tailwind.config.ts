import type { Config } from 'tailwindcss'
import { colors } from './src/design/theme'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ground: colors.ground,
        ink: colors.ink,
        'green-deep': colors.greenDeep,
        'green-sage': colors.greenSage,
        coral: colors.coral,
        gold: colors.gold,
        sick: colors.sick,
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        button: '0.5rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(42, 42, 36, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
