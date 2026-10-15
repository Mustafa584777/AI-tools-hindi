import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Aitoolhindi.online – भारत का नंबर 1 हिंदी AI ट्यूटोरियल और टूल्स गाइड',
  description: 'हिंदी में सीखें आर्टिफिशियल इंटेलिजेंस, ChatGPT, Midjourney, AI टूल्स और प्रॉम्प्ट इंजीनियरिंग की पूरी जानकारी।',
  openGraph: {
    title: 'Aitoolhindi.online – भारत का नंबर 1 हिंदी AI ट्यूटोरियल और टूल्स गाइड',
    description: 'हिंदी में सीखें आर्टिफिशियल इंटेलिजेंस, ChatGPT, Midjourney, AI टूल्स और प्रॉम्प्ट इंजीनियरिंग की पूरी जानकारी।',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aitoolhindi.online – भारत का नंबर 1 हिंदी AI ट्यूटोरियल और टूल्स गाइड',
    description: 'हिंदी में सीखें आर्टिफिशियल इंटेलिजेंस, ChatGPT, Midjourney, AI टूल्स और प्रॉम्प्ट इंजीनियरिंग की पूरी जानकारी।',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RRHCK8H04T"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RRHCK8H04T');
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-['Plus_Jakarta_Sans',sans-serif] bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
