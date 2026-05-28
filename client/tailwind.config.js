export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        void: '#0C0C16',
        electric: '#5B4EF5',
        amber: { DEFAULT: '#F0A030', light: '#FEF3DC' },
        mint: { DEFAULT: '#06C49A', light: '#E0FAF4' },
        ember: { DEFAULT: '#E85454', light: '#FEECEC' },
        bgbase: '#F7F7FB',
      },
      borderRadius: { DEFAULT: '8px', md: '8px', lg: '12px', xl: '16px' },
      boxShadow: {
        xs: '0 1px 2px rgba(14,14,26,0.04)',
        sm: '0 1px 4px rgba(14,14,26,0.07)',
        md: '0 4px 16px rgba(14,14,26,0.08)',
        electric: '0 4px 20px rgba(91,78,245,0.25)',
      },
      animation: { fadeUp: 'fadeUp 0.25s ease forwards' },
      keyframes: { fadeUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } } },
    },
  },
  plugins: [],
}
