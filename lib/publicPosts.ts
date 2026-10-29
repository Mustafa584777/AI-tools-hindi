import { BlogPost } from './types';
import articlesBackup from '../data/posts.json';
import { stripTableOfContents } from './utils';

export const INITIAL_BLOG_POSTS: BlogPost[] = ((articlesBackup as unknown as BlogPost[]) || []).map(p => ({
  ...p,
  content: stripTableOfContents(p.content)
}));

const PUBLIC_CACHE_KEY = 'aitoolhindi_public_posts_v5';

/**
 * Public consumer site loader:
 * Strictly reads from posts.json (API or disk backup).
 * NEVER touches Firebase, ensuring zero latency, zero quota, and pure posts.json delivery.
 */
export async function fetchBlogPostsFromDisk(): Promise<BlogPost[]> {
  try {
    const res = await fetch('/api/articles?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(data.posts));
          } catch {}
        }
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('API fetch warning:', err);
  }

  // Fallback to client localStorage cache if offline or API unreachable
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PUBLIC_CACHE_KEY);
      if (cached) {
        const parsed: BlogPost[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  return INITIAL_BLOG_POSTS;
}

export function getStoredBlogPostsSync(): BlogPost[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PUBLIC_CACHE_KEY);
      if (cached) {
        const posts: BlogPost[] = JSON.parse(cached);
        if (posts.length > 0) return posts;
      }
    } catch {}
  }
  return INITIAL_BLOG_POSTS;
}
