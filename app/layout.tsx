import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Aitoolhindi.online – Hindi AI Tools Directory & Blog',
  description: 'Explore top AI tools in Hindi, read informational AI tutorials, and submit new AI tools. Migrated seamlessly from WordPress.',
  openGraph: {
    title: 'Aitoolhindi.online – Hindi AI Tools Directory & Blog',
    description: 'Explore top AI tools in Hindi, read informational AI tutorials, and submit new AI tools.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aitoolhindi.online – Hindi AI Tools Directory & Blog',
    description: 'Explore top AI tools in Hindi, read informational AI tutorials, and submit new AI tools.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-['Plus_Jakarta_Sans',sans-serif] bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
