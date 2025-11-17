import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Polkadot-inspired color palette
        primary: '#E6007A',        // Polkadot signature pink
        'primary-light': '#FF1F8F', // Lighter pink for hover
        'primary-dark': '#D5006D',  // Darker pink
        secondary: '#552BBF',       // Polkadot purple
        accent: '#00B2FF',          // Bright blue accent
        surface: '#000000',         // Pure black background
        'surface-light': '#0F0F0F', // Slightly lighter black
        'glass': 'rgba(15, 15, 17, 0.6)',
      },
      backgroundImage: {
        'gradient-polkadot': 'linear-gradient(135deg, #E6007A 0%, #552BBF 50%, #00B2FF 100%)',
        'gradient-pink': 'linear-gradient(90deg, #E6007A 0%, #FF1F8F 100%)',
        'gradient-radial-pink': 'radial-gradient(circle, rgba(230, 0, 122, 0.15) 0%, transparent 70%)',
      }
    }
  },
  plugins: []
}

export default config

