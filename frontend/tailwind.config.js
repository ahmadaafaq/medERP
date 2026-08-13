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
        brand: {
          purple: '#2D2575',
          header: '#2D2575',
          sidebar: '#2D2575',
          primary: '#5B4BFF',
          secondary: '#7867FF',
          accent: '#F36C21',
          success: '#00C48C',
          warning: '#FFB020',
          danger: '#F04438',
        },
        primary: { DEFAULT: '#5B4BFF', dark: '#4F46E5', light: '#5B4BFF' },
        accent: { DEFAULT: '#F36C21', hover: '#E05B10' },
        success: { DEFAULT: '#00C48C', light: '#E6F9F3' },
        warning: { DEFAULT: '#FFB020', light: '#FFF8E6' },
        danger: { DEFAULT: '#F04438', light: '#FEECEB' },
        bg: { light: '#F6F8FC', dark: '#0F172A' },
        card: { light: '#FFFFFF', dark: '#1E293B' },
        text: {
          heading: { light: '#1B1E28', dark: '#F8FAFC' },
          body: { light: '#4E5969', dark: '#CBD5E1' },
          muted: { light: '#7B8794', dark: '#94A3B8' },
          primary: { light: '#1B1E28', dark: '#F8FAFC' },
        },
        border: { light: '#E7EAF3', dark: '#334155' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { card: '22px', input: '12px', badge: '9999px' },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(45, 37, 117, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        hover: '0 10px 30px -4px rgba(45, 37, 117, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: { sm: '8px' },
    },
  },
  plugins: [],
};
