// app/components/ThemeProvider.tsx
'use client';

import React from 'react';
import { createGlobalStyle, ThemeProvider as StyledThemeProvider } from 'styled-components';
import theme from '../styles/theme';

// Create global styles for the app
const GlobalStyle = createGlobalStyle`
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant:wght@400;500;600&display=swap');
  
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }
  
  html, body {
    max-width: 100vw;
    height: 100%;
    overflow-x: hidden;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    line-height: 1.6;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: 600;
    line-height: 1.3;
    color: ${({ theme }) => theme.colors.primary};
  }
  
  a {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.secondaryLight};
      text-decoration: underline;
    }
  }
  
  button {
    font-family: ${({ theme }) => theme.fonts.heading};
    cursor: pointer;
  }
`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </StyledThemeProvider>
  );
}