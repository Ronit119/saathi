import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/context';
import { AccessibilityProvider } from '@/features/accessibility/context';
import { SkipLink } from '@/components/layout/SkipLink';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'SAATHI — Your Everyday Digital Companion',
  description:
    'An accessible, patient, and intelligent digital companion designed to help senior citizens navigate everyday digital tasks with confidence, clarity, and ease.',
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
      <body className="min-h-screen flex flex-col bg-stone-50/50 text-stone-900 selection:bg-amber-200">
        <AuthProvider>
          <AccessibilityProvider>
            <SkipLink />
            <Header />
            <Navigation />
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 outline-none"
            >
              {children}
            </main>
            <footer className="w-full border-t border-stone-200 bg-white py-6 text-center text-stone-600 text-sm sm:text-base">
              <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>
                  <strong>SAATHI</strong> — Designed with care for senior citizens
                </p>
                <p className="text-stone-500 text-xs sm:text-sm">
                  Powered by Google Gemini GenAI
                </p>
              </div>
            </footer>
          </AccessibilityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
