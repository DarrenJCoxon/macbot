// app/layout.tsx
import { type Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeProvider from './components/ThemeProvider';
import './globals.css';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}