// app/layout.tsx - Updated with proper styled-components setup
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import StyledComponentsRegistry from './lib/registry';
import ThemeProvider from './components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Macbot - Your Macbeth Study Assistant',
  description: 'AI-powered chatbot to help students study Shakespeare\'s Macbeth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}