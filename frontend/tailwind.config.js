/** @type {import('tailwindcss').Config} */
const tokenColors = (name) => {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return Object.fromEntries(shades.map((shade, index) => [shade, `rgb(var(--theme-${name}-${index}) / <alpha-value>)`]));
};

const brandColors = tokenColors('brand');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--theme-font-sans)'],
        mono: ['var(--theme-font-mono)'],
      },
      colors: {
        brand: brandColors,
        gray: tokenColors('neutral'),
        green: tokenColors('success'),
        red: tokenColors('danger'),
        orange: tokenColors('warning'),
        lime: tokenColors('accent'),
      },
    },
  },
  plugins: [],
}
