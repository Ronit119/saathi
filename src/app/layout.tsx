import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/context';
import { LanguageProvider } from '@/i18n/context';
import { AccessibilityProvider } from '@/features/accessibility/context';
import { SkipLink } from '@/components/layout/SkipLink';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'SAATHI — Senior-First Multilingual Digital Companion',
  description:
    'A patient, capable, multilingual digital companion that older adults can confidently use in English, Hindi, Punjabi, Bengali, Marathi, Gujarati, Tamil, and Telugu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="text-size-normal">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#131b26] selection:bg-amber-200">
        <AuthProvider>
          <LanguageProvider>
            <AccessibilityProvider>
              <SkipLink />
              <Header />
              <Navigation />
              <main
                id="main-content"
                tabIndex={-1}
                className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 outline-none mb-16 sm:mb-0"
              >
                {children}
              </main>
              <footer className="w-full border-t border-stone-200 bg-white py-6 text-center text-stone-600 text-sm sm:text-base hidden sm:block">
                <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <p>
                    <strong>SAATHI</strong> — Built with patience and care for older adults
                  </p>
                  <p className="text-stone-500 text-xs sm:text-sm">
                    Multilingual GenAI & Voice Companion
                  </p>
                </div>
              </footer>
            </AccessibilityProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
