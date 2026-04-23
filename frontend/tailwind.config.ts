import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        municipal: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        marca: {
          50: '#fffcf0',
          100: '#fff4d6',
          200: '#ffe5ab',
          300: '#ffd37d',
          400: '#ffac54',
          500: '#f98d28',
          600: '#e06e10',
          700: '#b5540d',
          800: '#90440f',
          900: '#733711',
        },
        arena: '#f1f5f9',
        terracota: '#b5540d',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 48px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        municipal:
          'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 48%, #e2e8f0 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
