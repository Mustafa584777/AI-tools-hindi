import { BlogPost } from './types';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import articlesBackup from '../data/articles-backup.json';

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

const BLOG_KEY = 'aitoolhindi_blog_posts_firebase_sync_v2';
const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache to balance freshness with quota preservation

const DELETED_POSTS_KEY = 'aitoolhindi_deleted_posts_v1';

export async function fetchBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  let deletedIds: string[] = [];
  let localPosts: BlogPost[] = [];
  if (typeof window !== 'undefined') {
    try {
      const del = localStorage.getItem(DELETED_POSTS_KEY);
      if (del) deletedIds = JSON.parse(del);
    } catch (e) {}

    try {
      const local = localStorage.getItem(BLOG_KEY);
      if (local) localPosts = JSON.parse(local);
    } catch (e) {
      console.warn('Local read error:', e);
    }
  }

  // 1. Fetch from persistent server backup API
  let serverPosts: BlogPost[] = [];
  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts)) {
        serverPosts = data.posts;
      }
    }
  } catch (err) {
    console.warn('Server articles API read notice:', err);
  }

  // 2. Fetch from Firestore (fail-safe against quota exhaustion)
  let firestorePosts: BlogPost[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    querySnapshot.forEach((docSnap) => {
      firestorePosts.push(docSnap.data() as BlogPost);
    });
  } catch (err) {
    console.warn('Firestore fetch notice (using persistent server & local backup):', (err as Error).message);
  }

  // Union map: merge all sources so NO post is ever lost
  const postMap = new Map<string, BlogPost>();
  INITIAL_BLOG_POSTS.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  serverPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  firestorePosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  localPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });

  const merged = Array.from(postMap.values()).filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug));
  merged.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));

  if (typeof window !== 'undefined' && merged.length > 0) {
    try {
      localStorage.setItem(BLOG_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
  }

  return merged.length > 0 ? merged : INITIAL_BLOG_POSTS;
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_TIME_KEY);
    // Note: NEVER remove BLOG_KEY so articles are never wiped offline
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  let finalImage = post.image;

  const postWithTime: BlogPost = {
    ...post,
    image: finalImage,
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

  // 2. Persist to server disk storage via /api/articles
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postWithTime)
    });
  } catch (apiErr) {
    console.warn('Server disk backup update error:', apiErr);
  }

  // 3. Sync to Firestore in background
  try {
    const payloadString = JSON.stringify(postWithTime);
    if (payloadString.length <= 950000) {
      await setDoc(doc(db, 'blogPosts', postWithTime.id), postWithTime);
    }
  } catch (err) {
    console.warn('Firestore sync notice:', (err as Error).message);
  }
}

export async function restoreBackupPosts(
  importedPosts: BlogPost[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const validPosts = importedPosts.map(p => ({
    ...p,
    id: p.id || ('blog-' + (p.slug || Math.random().toString(36).substring(7))),
    slug: p.slug || 'imported-article',
    title: p.title || 'Untitled',
    content: p.content || '',
    status: p.status || 'published',
    createdAt: p.createdAt || Date.now()
  }));

  // 1. Immediately persist to server disk via /api/articles
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
    const postMap = new Map<string, BlogPost>();
    getStoredBlogPostsSync().forEach(p => postMap.set(p.slug || p.id, p));
    validPosts.forEach(p => postMap.set(p.slug || p.id, p));
    const merged = Array.from(postMap.values());
    merged.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
    try {
      localStorage.setItem(BLOG_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage write warning during restore:', e);
    }
  }

  // 3. Sync to Firestore with progress reporting
  let count = 0;
  for (let i = 0; i < validPosts.length; i++) {
    const post = validPosts[i];
    try {
      const payloadString = JSON.stringify(post);
      if (payloadString.length <= 950000) {
        await setDoc(doc(db, 'blogPosts', post.id), post);
      }
      count++;
    } catch (e) {
      console.warn('Firestore restore notice for post:', post.id, e);
    }
    if (onProgress) {
      onProgress(i + 1, validPosts.length);
    }
  }
  return count;
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  // 1. Mark as deleted in localStorage deleted list & remove from local posts
  if (typeof window !== 'undefined') {
    try {
      const deletedListStr = localStorage.getItem(DELETED_POSTS_KEY) || '[]';
      const deletedList: string[] = JSON.parse(deletedListStr);
      if (!deletedList.includes(id)) {
        deletedList.push(id);
        localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(deletedList));
      }

      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id && p.slug !== id);
      updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage delete error:', e);
    }
  }

  // 2. Delete from server disk storage
  try {
    await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Server disk backup delete error:', e);
  }

  // 3. Delete from Firestore
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
  } catch (err) {
    console.warn('Firestore delete notice:', err);
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

const videoCache = new Map<string, string>();

export async function saveMediaVideoToFirestore(mediaId: string, base64Data: string): Promise<void> {
  videoCache.set(mediaId, base64Data);
  const CHUNK_SIZE = 700 * 1024; // 700KB chunks to stay safely under Firestore 1MB document limit
  const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
  
  await setDoc(doc(db, 'mediaVideos', mediaId), {
    id: mediaId,
    totalChunks,
    createdAt: Date.now()
  });

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, 'mediaVideos', `${mediaId}_chunk_${i}`), {
      mediaId,
      chunkIndex: i,
      data: chunkData
    });
  }
}

export async function fetchMediaVideoFromFirestore(mediaId: string): Promise<string | null> {
  if (videoCache.has(mediaId)) {
    return videoCache.get(mediaId)!;
  }
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
    if (fullData) {
      videoCache.set(mediaId, fullData);
    }
    return fullData;
  } catch (e) {
    console.error('Error fetching media video from Firestore:', e);
    return null;
  }
}

const imageCache = new Map<string, string>();

export async function saveMediaImageToFirestore(mediaId: string, base64Data: string, slug?: string): Promise<void> {
  imageCache.set(mediaId, base64Data);
  if (slug) {
    imageCache.set(slug, base64Data);
  }
  const CHUNK_SIZE = 700 * 1024; // 700KB chunks to stay safely under Firestore 1MB limit
  const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
  
  await setDoc(doc(db, 'mediaImages', mediaId), {
    id: mediaId,
    slug: slug || mediaId,
    totalChunks,
    createdAt: Date.now()
  });

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, 'mediaImages', `${mediaId}_chunk_${i}`), {
      mediaId,
      chunkIndex: i,
      data: chunkData
    });
  }

  if (slug) {
    try {
      await setDoc(doc(db, 'mediaImageSlugs', slug), {
        mediaId,
        slug,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('Failed to save media slug mapping:', e);
    }
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
    console.error('Error fetching media by slug:', e);
    return null;
  }
}

export async function fetchMediaImageFromFirestore(mediaId: string): Promise<string | null> {
  if (imageCache.has(mediaId)) {
    return imageCache.get(mediaId)!;
  }
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
    if (fullData) {
      imageCache.set(mediaId, fullData);
    }
    return fullData;
  } catch (e) {
    console.error('Error fetching media image from Firestore:', e);
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
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}



