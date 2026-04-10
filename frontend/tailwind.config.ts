import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        municipal: {
          50: '#f3f7f5',
          100: '#e3ece8',
          200: '#c5d8d0',
          300: '#9fbcae',
          400: '#769b89',
          500: '#567b69',
          600: '#406354',
          700: '#324e44',
          800: '#2a4038',
          900: '#243630',
        },
        arena: '#f5f1e8',
        terracota: '#b85c38',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(36, 54, 48, 0.08)',
      },
      backgroundImage: {
        municipal:
          'linear-gradient(135deg, rgba(243,247,245,1) 0%, rgba(227,236,232,1) 48%, rgba(245,241,232,1) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
