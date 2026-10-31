import { MetadataRoute } from 'next';
import { fetchBlogPostsFromDisk, getStoredBlogPostsSync } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aitoolhindi.online';

  const staticRoutes = [
    '',
    '/about-us',
    '/contact-us',
    '/privacy-policy',
    '/terms-conditions',
    '/disclaimer',
    '/correction-policy',
    '/fact-checking-policy',
    '/dmca-policy',
    '/dnpa-code-of-ethics',
  ];

  const staticPages = staticRoutes.map((route) => ({
    url: route === '' ? `${baseUrl}/` : `${baseUrl}${route}/`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let blogPosts: any[] = [];
  let deletedCategories: string[] = [];
  try {
    const { db } = await import('@/lib/firebase');
    const { getDocs, collection, getDoc, doc } = await import('firebase/firestore');
    if (db) {
      const snap = await getDocs(collection(db, 'blogPosts'));
      snap.forEach(d => {
        blogPosts.push(d.data());
      });
      const catDoc = await getDoc(doc(db, 'settings', 'categories'));
      if (catDoc.exists()) {
        const data = catDoc.data();
        if (data.deletedCategories && Array.isArray(data.deletedCategories)) {
          deletedCategories = data.deletedCategories;
        }
      }
    }
  } catch {}

  if (blogPosts.length === 0) {
    try {
      blogPosts = await fetchBlogPostsFromDisk();
    } catch {
      blogPosts = getStoredBlogPostsSync();
    }
  }

  const activePosts = blogPosts.filter(p => p.status !== 'draft' && (!p.category || !deletedCategories.includes(p.category)));

  const categories = Array.from(new Set(activePosts.map(p => p.category).filter(Boolean)))
    .filter(cat => !deletedCategories.includes(cat));

  const categoryPages = categories.map((cat: any) => ({
    url: `${baseUrl}/${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const blogUrls = activePosts.map((post) => ({
    url: `${baseUrl}/${post.slug}/`,
    lastModified: new Date(post.createdAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...blogUrls];
}
