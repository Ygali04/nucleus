import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';
import { NewCampaignModal } from '@/components/campaigns/NewCampaignModal';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/layout/Toolbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Nucleus Pipeline',
  description: 'Recursive neuromarketing video engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]`}
      >
        <div className="min-h-screen">
          <Header />
          <Toolbar />
          <main className="min-h-[calc(100vh-92px)]">{children}</main>
          <NewCampaignModal />
        </div>
      </body>
    </html>
  );
}
