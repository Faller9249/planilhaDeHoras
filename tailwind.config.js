/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        geocapex: {
          // Cor principal - Cinza azulado (PANTONE 7545 C)
          dark: '#3B505A',
          'dark-rgb': 'rgb(59, 80, 90)',
          // Amarelo (PANTONE 116 C)
          yellow: '#FFCB05',
          'yellow-rgb': 'rgb(255, 203, 5)',
          // Laranja (PANTONE 165 C)
          orange: '#F15D22',
          'orange-rgb': 'rgb(241, 93, 34)',
        },
      },
      fontFamily: {
        'baloo': ['"Baloo Chettan 2"', 'system-ui', 'sans-serif'],
        'tahoma': ['Tahoma', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
