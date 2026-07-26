/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366F1', dark: '#4F46E5' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        orange: '#F97316',
        purple: '#8B5CF6',
        bg: { light: '#F8FAFC', dark: '#0F172A' },
        card: { light: '#FFFFFF', dark: '#1E293B' },
        text: {
          primary: { light: '#0F172A', dark: '#F8FAFC' },
          muted: { light: '#64748B', dark: '#94A3B8' },
        },
        border: { light: '#E2E8F0', dark: '#334155' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { card: '12px', input: '8px', badge: '20px' },
      backdropBlur: { sm: '8px' },
    },
  },
  plugins: [],
};
