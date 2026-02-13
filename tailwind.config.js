// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // overwrite the default 'sans' to start with Prompt
        sans: ['Prompt', ...defaultTheme.fontFamily.sans],
        // you can also expose it under its own name:
        prompt: ['Prompt', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
