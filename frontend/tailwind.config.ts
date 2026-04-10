import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        municipal: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        arena: '#f3f4f6',
        terracota: '#6b7280',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(17, 24, 39, 0.10)',
      },
      backgroundImage: {
        municipal:
          'linear-gradient(135deg, rgba(249,250,251,1) 0%, rgba(243,244,246,1) 48%, rgba(229,231,235,1) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
