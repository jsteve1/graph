/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Dark mode (Cursor IDE-inspired)
        dark: {
          bg: '#1E1E1E',
          text: '#D4D4D4',
          primary: '#818CF8',
          secondary: '#6366F1',
          accent: '#4F46E5',
          surface: '#252525',
          border: '#404040'
        },
        // Light mode
        light: {
          bg: '#FFFFFF',
          text: '#18181B',
          primary: '#6366F1',
          secondary: '#818CF8',
          accent: '#4F46E5',
          surface: '#F4F4F5',
          border: '#E4E4E7'
        }
      },
      maxWidth: {
        'container': '1200px'
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}

