import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import SmoothScroll from '@/components/SmoothScroll';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CLOUDMAR — Monochromatic File Storage',
  description: 'Ultra-modern black & white file and picture storage hub.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-black text-white font-sans antialiased min-h-screen flex flex-col selection:bg-white selection:text-black">
        <SmoothScroll>
          {children}
        </SmoothScroll>

        {/* Custom Black & White Modern Toasts */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#09090b',
              color: '#ffffff',
              border: '1px solid #27272a',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 16px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)',
            },
            success: {
              iconTheme: {
                primary: '#ffffff',
                secondary: '#000000',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
