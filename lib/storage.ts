import { BlogPost } from './types';
import { db } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import articlesBackup from '../data/posts.json';

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

const CACHE_KEY = 'aitoolhindi_posts_cache_v4';

// Instant load for both Admin and Main Site using posts.json & localStorage (0 network wait for Firestore)
export async function fetchBlogPostsFromFirestore(_forceRefresh = false): Promise<BlogPost[]> {
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, 'blogPosts'));
      const firestorePostsMap = new Map<string, BlogPost>();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as BlogPost;
        if (data && (data.id || data.slug)) {
          firestorePostsMap.set(data.id || data.slug, data);
        }
      });
      if (firestorePostsMap.size > 0) {
        const posts = Array.from(firestorePostsMap.values());
        posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
        }
        return posts;
      }
    }
  } catch (e) {
    console.warn('Firestore fetch warning:', e);
  }

  if (typeof window !== 'undefined' && !_forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: BlogPost[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch('/api/articles?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.posts));
        }
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('API fetch warning:', err);
  }

  return INITIAL_BLOG_POSTS;
}

export async function fetchBlogPostsFromDisk(_forceRefresh = false): Promise<BlogPost[]> {
  return fetchBlogPostsFromFirestore(_forceRefresh);
}

export function extractFirstImageAndAlt(
  content: string, 
  fallbackImage?: string, 
  fallbackAlt?: string,
  fallbackTitle?: string
): { image: string; imageAlt: string } {
  if (!content) {
    return {
      image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
      imageAlt: fallbackAlt || fallbackTitle || 'AI tutorial featured image'
    };
  }

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let firstValidImage: { image: string; imageAlt: string } | null = null;
  let firstAnyImage: { image: string; imageAlt: string } | null = null;

  while ((match = imgRegex.exec(content)) !== null) {
    const rawSrc = match[1];
    const imgTag = match[0];
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const cleanSrc = rawSrc.trim().replace(/[\\\"\']+$/, '');
    const cleanAlt = altMatch && altMatch[1] && altMatch[1].trim()
      ? altMatch[1].trim()
      : (fallbackAlt || fallbackTitle || 'AI tutorial featured image');

    if (!firstAnyImage && cleanSrc) {
      firstAnyImage = { image: cleanSrc, imageAlt: cleanAlt };
    }

    if (!firstValidImage && cleanSrc && !cleanSrc.includes('img.youtube.com') && !cleanSrc.includes('i.ytimg.com')) {
      firstValidImage = { image: cleanSrc, imageAlt: cleanAlt };
      break;
    }
  }

  const selected = firstValidImage || firstAnyImage;
  if (selected) {
    return selected;
  }

  return {
    image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
    imageAlt: fallbackAlt || fallbackTitle || 'AI tutorial featured image'
  };
}

// Save post instantly to posts.json / cache AND sync to Firebase in the background
export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  const { image, imageAlt } = extractFirstImageAndAlt(post.content, post.image, post.imageAlt, post.title);
  const postWithTime: BlogPost = {
    ...post,
    image,
    imageAlt,
    id: post.id || ('blog-' + (post.slug || Date.now())),
    createdAt: post.createdAt || Date.now()
  };

  let allPosts: BlogPost[] = [];
  // 1. Update localStorage cache instantly
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      let posts: BlogPost[] = cached ? JSON.parse(cached) : INITIAL_BLOG_POSTS;
      const index = posts.findIndex(p => p.id === postWithTime.id || p.slug === postWithTime.slug);
      if (index >= 0) {
        posts[index] = postWithTime;
      } else {
        posts.unshift(postWithTime);
      }
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
      allPosts = posts;
    } catch {}
  }

  // 2. Instantly update posts.json on server disk with full array
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allPosts.length > 0 ? allPosts : postWithTime)
    });
  } catch (apiErr) {
    console.warn('Server disk backup update error:', apiErr);
  }

  // 3. Background Firebase sync
  setDoc(doc(db, 'blogPosts', postWithTime.id), postWithTime).catch(() => {});
  if (postWithTime.slug && postWithTime.slug !== postWithTime.id) {
    setDoc(doc(db, 'blogPosts', postWithTime.slug), postWithTime).catch(() => {});
  }
}

// Restore backup posts instantly to posts.json / cache AND sync to Firebase
export async function restoreBackupPosts(
  importedPosts: any[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const validPosts: BlogPost[] = importedPosts.map((p, idx) => {
    const { image, imageAlt } = extractFirstImageAndAlt(p.content, p.image, p.imageAlt, p.title);
    return {
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
      image,
      imageAlt,
      imageSlug: p.imageSlug || 'ai-tutorial-featured',
      status: p.status || 'published',
      noIndex: p.noIndex || false,
      createdAt: p.createdAt || Date.now()
    };
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validPosts));
    } catch {}
  }

  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPosts)
    });
  } catch (e) {
    console.warn('Server disk backup update error during restore:', e);
  }

  let completed = 0;
  for (const post of validPosts) {
    setDoc(doc(db, 'blogPosts', post.id), post).catch(() => {});
    completed++;
    if (onProgress) {
      onProgress(completed, validPosts.length);
    }
  }

  return validPosts.length;
}

// Delete post instantly from cache & posts.json AND sync to Firebase
export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        let posts: BlogPost[] = JSON.parse(cached);
        posts = posts.filter(p => p.id !== id && p.slug !== id);
        localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
      }
    } catch {}
  }

  try {
    await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
  } catch (e) {
    console.warn('Server disk backup delete error:', e);
  }

  deleteDoc(doc(db, 'blogPosts', id)).catch(() => {});
}

export function getStoredBlogPostsSync(): BlogPost[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const posts: BlogPost[] = JSON.parse(cached);
        if (posts.length > 0) return posts;
      }
    } catch {}
  }
  return INITIAL_BLOG_POSTS;
}

export async function downloadPostsJsonFile(): Promise<void> {
  try {
    let posts: BlogPost[] = [];

    // 1. Fetch directly from Firebase Firestore as primary source of truth
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'blogPosts'));
        const firestorePostsMap = new Map<string, BlogPost>();
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as BlogPost;
          if (data && (data.id || data.slug)) {
            firestorePostsMap.set(data.id || data.slug, data);
          }
        });
        if (firestorePostsMap.size > 0) {
          posts = Array.from(firestorePostsMap.values());
        }
      }
    } catch (e) {
      console.warn('Firestore fetch for download warning:', e);
    }

    // 2. Fallback to localStorage / local sync if Firestore returned empty
    if (posts.length === 0) {
      posts = getStoredBlogPostsSync();
    }

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 3. Sync to server disk before downloading
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posts)
      });
    } catch {}

    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error downloading posts.json:', e);
  }
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
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
