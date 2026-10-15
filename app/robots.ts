import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://aitoolhindi.online';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/blog/',
      ],
      disallow: [
        '/admin-panel/',
        '/api/',
        '/firebase-applet-config.json',
        '/firebase-blueprint.json',
        '/firestore.rules',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
