export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#020617',
        graphite: '#111827',
        panel: '#162033',
        neon: '#38bdf8',
        emerald: '#34d399',
        mist: '#e5edf8'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.22)'
      }
    }
  },
  plugins: []
};
