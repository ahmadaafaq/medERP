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
          purpleDark: '#221C5C',
          header: '#2D2575',
          sidebar: '#2D2575',
          primary: '#5B4BFF',
          secondary: '#7867FF',
          accent: '#F36C21',
          success: '#00C48C',
          warning: '#FFB020',
          danger: '#F04438',
        },
        primary: {
          DEFAULT: '#5B4BFF',
          dark: '#4838DF',
          light: '#7867FF',
          50: '#F5F4FF',
          100: '#ECE9FE',
          200: '#DDD8FE',
          500: '#5B4BFF',
          600: '#4838DF',
          700: '#382BBF',
        },
        accent: {
          DEFAULT: '#F36C21',
          hover: '#E05B10',
          light: '#FFEDD5',
        },
        success: {
          DEFAULT: '#00C48C',
          light: '#E6F9F3',
          dark: '#00A374',
        },
        warning: {
          DEFAULT: '#FFB020',
          light: '#FFF8E6',
          dark: '#E09815',
        },
        danger: {
          DEFAULT: '#F04438',
          light: '#FEECEB',
          dark: '#D92D20',
        },
        bg: {
          light: '#F6F8FC',
          page: '#F6F8FC',
          dark: '#0F172A',
          card: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        text: {
          heading: {
            DEFAULT: '#1B1E28',
            light: '#1B1E28',
            dark: '#F8FAFC',
          },
          body: {
            DEFAULT: '#4E5969',
            light: '#4E5969',
            dark: '#CBD5E1',
          },
          muted: {
            DEFAULT: '#7B8794',
            light: '#7B8794',
            dark: '#94A3B8',
          },
        },
        border: {
          DEFAULT: '#E7EAF3',
          light: '#E7EAF3',
          dark: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        input: '16px',
        sidebar: '32px',
        header: '24px',
        pill: '9999px',
        badge: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(45, 37, 117, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        hover: '0 12px 32px -4px rgba(45, 37, 117, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'glow-primary': '0 0 20px rgba(91, 75, 255, 0.35)',
        'glow-accent': '0 0 20px rgba(243, 108, 33, 0.4)',
      },
      backdropBlur: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
