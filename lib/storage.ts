import { BlogPost } from './types';
import { db, auth } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import articlesBackup from '../data/posts.json';
import { stripTableOfContents } from './utils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

const PUBLIC_CACHE_KEY = 'aitoolhindi_public_posts_v5';
const ADMIN_CACHE_KEY = 'aitoolhindi_admin_posts_cache_v5';

// =========================================================================
// 1. PUBLIC SITE LOADERS:
// Strictly reads from posts.json (API or disk/repo).
// NEVER touches Firebase, ensuring zero latency, zero quota, and pure posts.json delivery.
// =========================================================================
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

  return INITIAL_BLOG_POSTS;
}

export async function fetchBlogPostsFromFirestore(): Promise<BlogPost[]> {
  // Alias for public consumer pages
  return fetchBlogPostsFromDisk();
}

export function getStoredBlogPostsSync(): BlogPost[] {
  const validSlugs = new Set(INITIAL_BLOG_POSTS.map(p => p.slug));
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PUBLIC_CACHE_KEY);
      if (cached) {
        const posts: BlogPost[] = JSON.parse(cached);
        if (Array.isArray(posts) && posts.length > 0) {
          const filtered = posts.filter(p => validSlugs.has(p.slug));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
  }
  return INITIAL_BLOG_POSTS;
}

// =========================================================================
// 2. ADMIN PANEL OPERATIONS:
// Directly connected to Firebase Firestore for real-time CRUD and export.
// =========================================================================

// Fetch all posts directly from Firebase Firestore for Admin Panel
export async function fetchAdminBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  if (typeof window !== 'undefined' && !forceRefresh) {
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        const parsed: BlogPost[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  try {
    if (!db) throw new Error('Firestore DB is not initialized');
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const slugMap = new Map<string, BlogPost>();

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as BlogPost;
      const rawSlug = (data.slug || docSnap.id.replace(/^blog-/, '')).trim();
      if (!rawSlug) return;
      const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '');
      const canonicalId = 'blog-' + cleanSlug;

      const normalized: BlogPost = {
        ...data,
        id: canonicalId,
        slug: cleanSlug,
        createdAt: data.createdAt || Date.now()
      };

      const existing = slugMap.get(cleanSlug);
      if (!existing || (normalized.createdAt || 0) >= (existing.createdAt || 0)) {
        slugMap.set(cleanSlug, normalized);
      }
    });

    if (slugMap.size > 0) {
      const posts = Array.from(slugMap.values());
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(posts));
        } catch {}
      }
      return posts;
    }
  } catch (error) {
    console.error('Failed to fetch blog posts from Firestore:', error);
    handleFirestoreError(error, OperationType.LIST, 'blogPosts');
  }

  return INITIAL_BLOG_POSTS;
}

export function extractFirstImageAndAlt(
  content: string, 
  fallbackImage?: string, 
  fallbackAlt?: string,
  fallbackTitle?: string
): { image: string; imageAlt: string; imageSlug: string } {
  const defaultImg = (fallbackImage && !fallbackImage.startsWith('data:')) ? fallbackImage : 'https://picsum.photos/seed/aitoolhindi/800/450';
  const defaultAlt = fallbackAlt || fallbackTitle || 'AI tutorial featured image';
  const defaultSlug = 'ai-tutorial';

  if (!content) {
    return {
      image: defaultImg,
      imageAlt: defaultAlt,
      imageSlug: defaultSlug
    };
  }

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let firstValidImage: { image: string; imageAlt: string; imageSlug: string } | null = null;
  let firstAnyImage: { image: string; imageAlt: string; imageSlug: string } | null = null;

  while ((match = imgRegex.exec(content)) !== null) {
    const rawSrc = match[1];
    const imgTag = match[0];
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const slugMatch = imgTag.match(/data-img-slug=["']([^"']*)["']/i);
    
    let cleanSrc = rawSrc.trim().replace(/[\\\"\']+$/, '');
    if (cleanSrc.startsWith('data:') && !cleanSrc.includes('wp-content') && !cleanSrc.includes('cloudinary.com')) {
      cleanSrc = 'https://picsum.photos/seed/aitoolhindi/800/450';
    }

    const cleanAlt = altMatch && altMatch[1] && altMatch[1].trim()
      ? altMatch[1].trim()
      : (fallbackAlt || fallbackTitle || 'AI tutorial featured image');

    let rawSlug = '';
    if (slugMatch && slugMatch[1]) {
      rawSlug = slugMatch[1];
    } else {
      try {
        const urlParts = cleanSrc.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0];
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        rawSlug = nameWithoutExt;
      } catch {
        rawSlug = cleanAlt;
      }
    }

    let cleanSlug = rawSlug
      .replace(/-featured$/i, '')
      .replace(/%[0-9a-fA-F]{2}/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      cleanSlug = 'ai-tutorial';
    }

    const item = { image: cleanSrc, imageAlt: cleanAlt, imageSlug: cleanSlug };

    if (!firstAnyImage && cleanSrc) {
      firstAnyImage = item;
    }

    if (!firstValidImage && cleanSrc && !cleanSrc.includes('img.youtube.com') && !cleanSrc.includes('i.ytimg.com')) {
      firstValidImage = item;
      break;
    }
  }

  const selected = firstValidImage || firstAnyImage;
  if (selected) {
    return selected;
  }

  return {
    image: defaultImg,
    imageAlt: defaultAlt,
    imageSlug: defaultSlug
  };
}

export function cleanPostForExport(post: BlogPost): BlogPost {
  let img = post.image || '';
  if (img.startsWith('data:') && !img.includes('wp-content') && !img.includes('cloudinary.com')) {
    img = 'https://picsum.photos/seed/aitoolhindi/800/450';
  }

  let content = stripTableOfContents(post.content || '');
  content = content.replace(/<img([^>]+)src=["'](data:[^"']+)["']([^>]*)>/gi, (match, p1, srcVal, p3) => {
    if (!srcVal.includes('wp-content') && !srcVal.includes('cloudinary.com')) {
      return `<img${p1}src="https://picsum.photos/seed/aitoolhindi/800/450"${p3}>`;
    }
    return match;
  });

  const { image, imageAlt, imageSlug } = extractFirstImageAndAlt(content, img, post.imageAlt, post.title);

  return {
    ...post,
    image,
    imageAlt,
    imageSlug,
    content
  };
}

// Save post directly to Firebase Firestore
export async function saveBlogPostToFirestore(post: BlogPost): Promise<BlogPost> {
  const cleaned = cleanPostForExport(post);
  const rawSlug = (cleaned.slug || cleaned.title).trim();
  const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '') || ('post-' + Date.now());
  const canonicalId = 'blog-' + cleanSlug;

  const postWithTime: BlogPost = {
    ...cleaned,
    id: canonicalId,
    slug: cleanSlug,
    createdAt: post.createdAt || Date.now()
  };

  // 1. Save directly to Firebase Firestore
  try {
    if (!db) throw new Error('Firebase Firestore DB is not initialized');
    await setDoc(doc(db, 'blogPosts', canonicalId), postWithTime);

    // Clean up any legacy or duplicate document with old ID or bare slug
    const oldIdsToClean = new Set<string>();
    if (post.id && post.id !== canonicalId) oldIdsToClean.add(post.id);
    if (cleanSlug !== canonicalId) oldIdsToClean.add(cleanSlug);
    if (post.slug && post.slug !== cleanSlug) {
      oldIdsToClean.add(post.slug);
      oldIdsToClean.add('blog-' + post.slug);
    }

    for (const oldId of oldIdsToClean) {
      try {
        await deleteDoc(doc(db, 'blogPosts', oldId));
      } catch {}
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blogPosts/${canonicalId}`);
  }

  // 2. Update Admin localStorage cache so admin panel updates immediately
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      let adminPosts: BlogPost[] = cached ? JSON.parse(cached) : [];
      const index = adminPosts.findIndex(p => p.id === canonicalId || p.slug === cleanSlug);
      if (index >= 0) {
        adminPosts[index] = postWithTime;
      } else {
        adminPosts.unshift(postWithTime);
      }
      adminPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(adminPosts));
    } catch {}
  }

  return postWithTime;
}

// Restore backup posts to Firebase Firestore
export async function restoreBackupPosts(
  importedPosts: any[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const validPosts: BlogPost[] = importedPosts.map((p, idx) => {
    const rawSlug = (p.slug || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '') : ('imported-post-' + idx))).trim();
    const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '');
    const canonicalId = 'blog-' + cleanSlug;

    const basePost: BlogPost = {
      id: canonicalId,
      slug: cleanSlug,
      title: p.title || 'Untitled',
      excerpt: p.excerpt || '',
      metaDescription: p.metaDescription || '',
      content: p.content || '',
      category: p.category || 'AI Guides',
      author: p.author || 'Anwar',
      date: p.date || new Date().toLocaleDateString('hi-IN'),
      readTime: p.readTime || '5 min read',
      image: p.image || '',
      imageAlt: p.imageAlt || '',
      imageSlug: p.imageSlug || '',
      status: p.status || 'published',
      noIndex: p.noIndex || false,
      createdAt: p.createdAt || Date.now()
    };

    return cleanPostForExport(basePost);
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(validPosts));
    } catch {}
  }

  let completed = 0;
  for (const post of validPosts) {
    try {
      await setDoc(doc(db, 'blogPosts', post.id), post);
    } catch (e) {
      console.warn('Restore doc notice:', post.id, e);
    }
    completed++;
    if (onProgress) {
      onProgress(completed, validPosts.length);
    }
  }

  return validPosts.length;
}

// Delete post permanently from Firebase Firestore
export async function deleteBlogPostFromFirestore(id: string, targetSlug?: string): Promise<void> {
  const cleanId = (id || '').trim();
  const slugFromId = cleanId.replace(/^blog-/, '');
  const cleanSlug = (targetSlug || slugFromId || '').trim();

  const keysToDelete = new Set([
    cleanId,
    cleanSlug,
    'blog-' + cleanSlug,
    cleanId.startsWith('blog-') ? cleanId : ('blog-' + cleanId),
    cleanId.replace(/^blog-/, '')
  ].filter(Boolean));

  // 1. Delete from Firebase Firestore
  try {
    if (!db) throw new Error('Firebase Firestore DB is not initialized');
    for (const docKey of keysToDelete) {
      try {
        await deleteDoc(doc(db, 'blogPosts', docKey));
      } catch {}
    }

    // Scan Firestore collection to purge any matching documents
    const snap = await getDocs(collection(db, 'blogPosts'));
    for (const docSnap of snap.docs) {
      const d = docSnap.data() as BlogPost;
      const dSlug = (d?.slug || '').trim().toLowerCase();
      if (dSlug === cleanSlug.toLowerCase() || keysToDelete.has(docSnap.id)) {
        await deleteDoc(doc(db, 'blogPosts', docSnap.id)).catch(() => {});
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blogPosts/${cleanId}`);
  }

  // 2. Remove from Admin localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        let adminPosts: BlogPost[] = JSON.parse(cached);
        adminPosts = adminPosts.filter(p => {
          const pId = (p.id || '').trim();
          const pSlug = (p.slug || '').trim();
          return !keysToDelete.has(pId) && !keysToDelete.has(pSlug) && pSlug !== cleanSlug;
        });
        localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(adminPosts));
      }
    } catch {}
  }
}

// Export / Download posts.json directly from Firebase Firestore with latest updates
export async function downloadPostsJsonFile(): Promise<number> {
  try {
    if (!db) throw new Error('Firebase Firestore DB is not initialized');
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const slugMap = new Map<string, BlogPost>();

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as BlogPost;
      const rawSlug = (data.slug || docSnap.id.replace(/^blog-/, '')).trim();
      if (!rawSlug) return;
      const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '');
      const canonicalId = 'blog-' + cleanSlug;

      const normalized: BlogPost = {
        ...data,
        id: canonicalId,
        slug: cleanSlug,
        createdAt: data.createdAt || Date.now()
      };

      const existing = slugMap.get(cleanSlug);
      if (!existing || (normalized.createdAt || 0) >= (existing.createdAt || 0)) {
        slugMap.set(cleanSlug, normalized);
      }
    });

    let posts = Array.from(slugMap.values());
    if (posts.length === 0) {
      posts = INITIAL_BLOG_POSTS;
    }

    // Strip any hardcoded TOC markup so downloaded posts.json is completely pure and lean
    posts = posts.map(p => ({
      ...p,
      content: stripTableOfContents(p.content)
    }));

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Update Admin cache with verified Firestore state
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(posts));
      } catch {}
    }

    const jsonStr = JSON.stringify(posts, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return posts.length;
  } catch (error) {
    console.error('Error downloading posts.json from Firebase:', error);
    handleFirestoreError(error, OperationType.GET, 'blogPosts');
  }
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_CACHE_KEY);
    localStorage.removeItem(PUBLIC_CACHE_KEY);
  }
}

// Media storage helpers
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
