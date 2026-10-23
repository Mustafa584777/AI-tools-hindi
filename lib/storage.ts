import { BlogPost } from './types';
import { db } from './firebase';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import articlesBackup from '../data/posts.json';

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

const BLOG_KEY = 'aitoolhindi_blog_posts_json_v3';
const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';

export async function fetchBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  // 1. Fetch from persistent server backup API (/api/articles -> posts.json)
  let serverPosts: BlogPost[] = [];
  try {
    const res = await fetch('/api/articles', { cache: forceRefresh ? 'reload' : 'default' });
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts)) {
        serverPosts = data.posts;
      }
    }
  } catch (err) {
    console.warn('Server articles API read notice:', err);
  }

  // 2. Local storage fallback
  let localPosts: BlogPost[] = [];
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(BLOG_KEY);
      if (local) localPosts = JSON.parse(local);
    } catch (e) {
      console.warn('Local read error:', e);
    }
  }

  // Union map: merge serverPosts, localPosts, INITIAL_BLOG_POSTS
  const postMap = new Map<string, BlogPost>();
  INITIAL_BLOG_POSTS.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  localPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  serverPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });

  const merged = Array.from(postMap.values());
  merged.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BLOG_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
  }

  return merged;
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_TIME_KEY);
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  const postWithTime: BlogPost = {
    ...post,
    createdAt: post.createdAt || Date.now()
  };

  // 1. Immediately update local storage
  if (typeof window !== 'undefined') {
    try {
      const posts = getStoredBlogPostsSync();
      const exists = posts.some(p => p.id === postWithTime.id || p.slug === postWithTime.slug);
      const updated = exists 
        ? posts.map(p => (p.id === postWithTime.id || p.slug === postWithTime.slug) ? postWithTime : p)
        : [postWithTime, ...posts];
      updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // 2. Persist to server disk storage via /api/articles (automatically updates posts.json)
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postWithTime)
    });
  } catch (apiErr) {
    console.warn('Server disk backup update error:', apiErr);
  }
}

export async function restoreBackupPosts(
  importedPosts: any[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const validPosts: BlogPost[] = importedPosts.map((p, idx) => ({
    id: p.id || ('blog-' + (p.slug || idx)),
    slug: p.slug || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ('imported-post-' + idx)),
    title: p.title || 'Untitled',
    excerpt: p.excerpt || '',
    metaDescription: p.metaDescription || '',
    content: p.content || '',
    category: p.category || 'AI Guides',
    author: p.author || 'Anwar',
    date: p.date || new Date().toLocaleDateString('hi-IN'),
    readTime: p.readTime || '5 min read',
    image: p.image || 'https://picsum.photos/seed/newpost/800/450',
    imageAlt: p.imageAlt || p.title || 'AI tutorial featured image',
    imageSlug: p.imageSlug || 'ai-tutorial-featured',
    status: p.status || 'published',
    noIndex: p.noIndex || false,
    createdAt: p.createdAt || Date.now()
  }));

  // 1. Persist to server disk via /api/articles
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPosts)
    });
  } catch (e) {
    console.warn('Server disk backup update error:', e);
  }

  // 2. Update local storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BLOG_KEY, JSON.stringify(validPosts));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage write warning during restore:', e);
    }
  }

  if (onProgress) {
    onProgress(validPosts.length, validPosts.length);
  }
  return validPosts.length;
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  // 1. Remove from local posts
  if (typeof window !== 'undefined') {
    try {
      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id && p.slug !== id);
      updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage delete error:', e);
    }
  }

  // 2. Delete from server disk storage (/api/articles)
  try {
    await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Server disk backup delete error:', e);
  }
}

export function getStoredBlogPostsSync(): BlogPost[] {
  if (typeof window === 'undefined') return INITIAL_BLOG_POSTS;
  try {
    const data = localStorage.getItem(BLOG_KEY);
    if (!data) return INITIAL_BLOG_POSTS;
    const posts: BlogPost[] = JSON.parse(data);
    if (posts.length === 0) return INITIAL_BLOG_POSTS;
    posts.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
    return posts;
  } catch {
    return INITIAL_BLOG_POSTS;
  }
}

export async function downloadPostsJsonFile(): Promise<void> {
  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      const posts = data.posts || [];
      const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'posts.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error('Error downloading posts.json:', e);
  }
}

const videoCache = new Map<string, string>();

export async function saveMediaVideoToFirestore(mediaId: string, base64Data: string): Promise<void> {
  videoCache.set(mediaId, base64Data);
  const CHUNK_SIZE = 700 * 1024;
  const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
  try {
    await setDoc(doc(db, 'mediaVideos', mediaId), { id: mediaId, totalChunks, createdAt: Date.now() });
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(db, 'mediaVideos', `${mediaId}_chunk_${i}`), { mediaId, chunkIndex: i, data: chunkData });
    }
  } catch (e) {
    console.warn('Media video storage notice:', e);
  }
}

export async function fetchMediaVideoFromFirestore(mediaId: string): Promise<string | null> {
  if (videoCache.has(mediaId)) return videoCache.get(mediaId)!;
  try {
    const metaDoc = await getDoc(doc(db, 'mediaVideos', mediaId));
    if (!metaDoc.exists()) return null;
    const { totalChunks } = metaDoc.data() as { totalChunks: number };
    let fullData = '';
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'mediaVideos', `${mediaId}_chunk_${i}`));
      if (chunkDoc.exists()) {
        fullData += (chunkDoc.data() as { data: string }).data;
      }
    }
    if (fullData) videoCache.set(mediaId, fullData);
    return fullData;
  } catch (e) {
    return null;
  }
}

const imageCache = new Map<string, string>();

export async function saveMediaImageToFirestore(mediaId: string, base64Data: string, slug?: string): Promise<void> {
  imageCache.set(mediaId, base64Data);
  if (slug) imageCache.set(slug, base64Data);
  const CHUNK_SIZE = 700 * 1024;
  const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
  try {
    await setDoc(doc(db, 'mediaImages', mediaId), { id: mediaId, slug: slug || mediaId, totalChunks, createdAt: Date.now() });
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(db, 'mediaImages', `${mediaId}_chunk_${i}`), { mediaId, chunkIndex: i, data: chunkData });
    }
  } catch (e) {
    console.warn('Media image storage notice:', e);
  }
}

export async function fetchMediaImageBySlug(slug: string): Promise<string | null> {
  if (imageCache.has(slug)) return imageCache.get(slug)!;
  try {
    const slugDoc = await getDoc(doc(db, 'mediaImageSlugs', slug));
    if (slugDoc.exists()) {
      const { mediaId } = slugDoc.data() as { mediaId: string };
      return await fetchMediaImageFromFirestore(mediaId);
    }
    return await fetchMediaImageFromFirestore(slug);
  } catch (e) {
    return null;
  }
}

export async function fetchMediaImageFromFirestore(mediaId: string): Promise<string | null> {
  if (imageCache.has(mediaId)) return imageCache.get(mediaId)!;
  try {
    const metaDoc = await getDoc(doc(db, 'mediaImages', mediaId));
    if (!metaDoc.exists()) return null;
    const { totalChunks } = metaDoc.data() as { totalChunks: number };
    let fullData = '';
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'mediaImages', `${mediaId}_chunk_${i}`));
      if (chunkDoc.exists()) {
        fullData += (chunkDoc.data() as { data: string }).data;
      }
    }
    if (fullData) imageCache.set(mediaId, fullData);
    return fullData;
  } catch (e) {
    return null;
  }
}

export async function compressImageBase64(base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}
