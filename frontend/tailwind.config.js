/** @type {import('tailwindcss').Config} */

// ─── UniCampus Color Remapping ────────────────────────────────────────────────
// We remap `indigo` and `purple` to the UniCampus orange+warm-neutral system
// so that all existing page classes (bg-indigo-500, text-purple-600, etc.)
// automatically render brand-correct colors across 200+ files without
// touching each component individually.
// ─────────────────────────────────────────────────────────────────────────────

const campusOrange = {
  50:  '#FFF2EA',
  100: '#FFE2CC',
  200: '#FFC69A',
  300: '#FFA468',
  400: '#FF8640',
  500: '#F36C21',  // ← primary brand accent
  600: '#E05B10',
  700: '#C04A08',
  800: '#963900',
  900: '#6E2A00',
  950: '#3D1600',
};

// Purple remapped to a warm amber/honey palette (semantic: "featured/highlight")
const warmAmber = {
  50:  '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#D97706',  // ← warm amber, not purple
  600: '#B45309',
  700: '#92400E',
  800: '#78350F',
  900: '#451A03',
  950: '#1C0A00',
};

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
        // ── REMAP indigo → UniCampus Orange (fixes 150+ page classes at once) ──
        indigo: campusOrange,

        // ── REMAP purple → Warm Amber (fixes 50+ page classes at once) ────────
        purple: warmAmber,

        // ── REMAP violet → same as amber (avoids any remaining violet refs) ───
        violet: warmAmber,

        // ── Slate 850 custom tone for dark mode cards ──────────────────────
        slate: {
          ...require('tailwindcss/colors').slate,
          850: '#151E2E',
        },

        // ── UniCampus Brand Accent ──────────────────────────────────────────
        campus: {
          orange:     '#F36C21',
          orangeHover:'#E05B10',
          orangeSoft: '#FFF2EA',
          orangeGlow: 'rgba(243, 108, 33, 0.25)',
        },

        // ── Surface / Layout Tokens ─────────────────────────────────────────
        surface: {
          canvas:       '#F7F8FA',
          card:         '#FFFFFF',
          sidebar:      '#F7F8FA',    // ← OFF-WHITE light sidebar
          sidebarActive:'rgba(243, 108, 33, 0.10)',
          border:       '#E5E8ED',
          divider:      '#EDF0F5',
        },

        // ── Ink / Typography Tokens ─────────────────────────────────────────
        ink: {
          heading: '#11141A',
          body:    '#394150',
          muted:   '#6F7887',
        },

        // ── Semantic State Tokens ───────────────────────────────────────────
        state: {
          success:   '#0E9F6E',
          successBg: '#E8F8F0',
          warning:   '#D97706',
          warningBg: '#FEF3C7',
          danger:    '#E02424',
          dangerBg:  '#FDE8E8',
        },

        // ── Legacy brand tokens (kept for backward compat) ──────────────────
        brand: {
          orange:  '#F36C21',
          accent:  '#F36C21',
          success: '#0E9F6E',
          warning: '#D97706',
          danger:  '#E02424',
        },
        accent:  { DEFAULT: '#F36C21', hover: '#E05B10' },
        success: { DEFAULT: '#0E9F6E', light: '#E8F8F0' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger:  { DEFAULT: '#E02424', light: '#FDE8E8' },
        bg:      { light: '#F7F8FA',  dark: '#0F172A' },
        card:    { light: '#FFFFFF',  dark: '#1E293B' },
        text: {
          heading: { light: '#11141A', dark: '#F8FAFC' },
          body:    { light: '#394150', dark: '#CBD5E1' },
          muted:   { light: '#6F7887', dark: '#94A3B8' },
          primary: { light: '#11141A', dark: '#F8FAFC' },
        },
        border: { light: '#E5E8ED', dark: '#334155' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '20px',
        input: '12px',
        badge: '9999px',
        'xl':  '14px',
        '2xl': '18px',
        '3xl': '20px',
      },
      boxShadow: {
        // UniCampus neutral carbon shadows — NO purple tint
        'campus-card':  '0 2px 12px -2px rgba(17, 20, 26, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'campus-hover': '0 8px 24px -4px rgba(17, 20, 26, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'campus-orange':'0 4px 14px 0 rgba(243, 108, 33, 0.32)',
        // Legacy aliases
        'soft':  '0 4px 20px -2px rgba(17, 20, 26, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'hover': '0 10px 30px -4px rgba(17, 20, 26, 0.09), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: { sm: '8px' },
    },
  },
  plugins: [],
};
