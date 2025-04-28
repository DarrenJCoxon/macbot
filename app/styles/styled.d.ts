// app/styles/styled.d.ts
import 'styled-components';

// Extend the DefaultTheme interface
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryLight: string;
      primaryDark: string;
      secondary: string;
      secondaryLight: string;
      secondaryDark: string;
      background: string;
      backgroundDark: string;
      text: string;
      textLight: string;
      gold: string;
      forest: string;
      fog: string;
      error: string;
      success: string;
      border: string;
    };
    
    fonts: {
      heading: string;
      body: string;
      mono: string;
    };
    
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      round: string;
    };
    
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
  }
}