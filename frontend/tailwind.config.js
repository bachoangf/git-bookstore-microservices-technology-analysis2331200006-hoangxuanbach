/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};

