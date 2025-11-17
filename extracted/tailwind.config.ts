import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B4FF39',
        surface: '#0B0B0C'
      }
    }
  },
  plugins: []
}

export default config

