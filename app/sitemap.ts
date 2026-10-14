import { MetadataRoute } from 'next';
import { fetchBlogPostsFromFirestore, getStoredBlogPostsSync } from '@/lib/storage';

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
    '/admin-panel',
  ];

  const staticPages = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let blogPosts: any[] = [];
  try {
    blogPosts = await fetchBlogPostsFromFirestore();
  } catch {
    blogPosts = getStoredBlogPostsSync();
  }

  const categories = Array.from(new Set(blogPosts.map(p => p.category).filter(Boolean)));
  const categoryPages = categories.map((cat: any) => ({
    url: `${baseUrl}/${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const blogUrls = blogPosts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...blogUrls];
}
