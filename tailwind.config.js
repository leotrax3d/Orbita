/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#faf9f5',
        accent: '#d97757',
        'accent-dark': '#c45f3f',
        edge: '#e8e6dc',
        ink: '#2d2a26',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Lora', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
