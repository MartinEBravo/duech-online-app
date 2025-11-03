import type { Metadata } from 'next';
import '@/app/globals.css';
import { dictionary } from '@/components/fonts';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { isEditorMode } from '@/lib/editor-mode-server';

export const metadata: Metadata = {
  title: 'Diccionario de uso español de Chile',
  description: 'Diccionario de uso del español de Chile - DUECh Online',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const editorMode = await isEditorMode();

  return (
    <html lang="es">
      <body
        className={dictionary.className}
        style={{ backgroundColor: 'var(--background)' }}
        suppressHydrationWarning
      >
        <Header editorMode={editorMode} />
        <main className="min-h-screen bg-gray-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
