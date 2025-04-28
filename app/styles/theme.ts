// app/styles/theme.ts
import { DefaultTheme } from 'styled-components';

const theme: DefaultTheme = {
  colors: {
    // Primary colors
    primary: '#3a1e1c', // Deep, dark red (blood motif)
    primaryLight: '#6d3935', // Lighter version of primary
    primaryDark: '#2a1615', // Darker version of primary
    
    // Secondary colors
    secondary: '#473080', // Royal purple
    secondaryLight: '#6a52a2', // Lighter purple
    secondaryDark: '#2b1d4e', // Darker purple
    
    // Background colors
    background: '#f8f4e9', // Parchment color
    backgroundDark: '#e8dfc2', // Darker parchment
    
    // Text colors
    text: '#2d2416', // Dark brown text
    textLight: '#59463a', // Lighter text
    
    // Accent colors
    gold: '#c4a747', // Muted gold (crown/royalty)
    forest: '#2a4c34', // Forest green (Scottish highlands)
    fog: '#ced8dc', // Misty gray (Scottish moors)
    
    // Utility colors
    error: '#911f1c', // Error red
    success: '#2a4c34', // Success green
    border: '#59321f', // Border brown
  },
  
  fonts: {
    heading: "'EB Garamond', 'Libre Baskerville', serif",
    body: "'Cormorant', 'Times New Roman', serif",
    mono: "'Courier New', monospace",
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.2)',
    large: '0 8px 16px rgba(0, 0, 0, 0.3)',
  },
};

export default theme;