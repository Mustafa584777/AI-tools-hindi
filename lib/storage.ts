import { BlogPost } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const INITIAL_BLOG_POSTS: BlogPost[] = [];

const BLOG_KEY = 'aitoolhindi_blog_posts_firebase_sync_v2';
const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  let localPosts: BlogPost[] = [];
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(BLOG_KEY);
      if (local) localPosts = JSON.parse(local);
    } catch (e) {
      console.warn('Local read error:', e);
    }
  }

  if (typeof window !== 'undefined' && !forceRefresh && localPosts.length > 0) {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          localPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          return localPosts;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const firestorePosts: BlogPost[] = [];
    querySnapshot.forEach((docSnap) => {
      firestorePosts.push(docSnap.data() as BlogPost);
    });

    // Merge localPosts and firestorePosts so local items are never wiped out
    const postMap = new Map<string, BlogPost>();
    localPosts.forEach(p => postMap.set(p.id, p));
    firestorePosts.forEach(p => postMap.set(p.id, p));
    const mergedPosts = Array.from(postMap.values());

    mergedPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (typeof window !== 'undefined' && mergedPosts.length > 0) {
      localStorage.setItem(BLOG_KEY, JSON.stringify(mergedPosts));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }

    return mergedPosts.length > 0 ? mergedPosts : localPosts;
  } catch (err) {
    console.error('Error fetching from Firestore, falling back to local posts:', err);
    localPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return localPosts;
  }
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_TIME_KEY);
    localStorage.removeItem(BLOG_KEY);
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  const postWithTime: BlogPost = {
    ...post,
    createdAt: post.createdAt || Date.now()
  };

  // Always save to localStorage first so saving never fails due to network/Firestore issues
  if (typeof window !== 'undefined') {
    try {
      const posts = getStoredBlogPostsSync();
      const exists = posts.some(p => p.id === postWithTime.id);
      const updated = exists ? posts.map(p => p.id === postWithTime.id ? postWithTime : p) : [postWithTime, ...posts];
      updated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Local storage save error:', e);
    }
  }

  try {
    await setDoc(doc(db, 'blogPosts', postWithTime.id), postWithTime);
    clearClientCache();
  } catch (err) {
    console.warn('Firestore sync warning (article successfully saved locally):', err);
  }
}

export async function restoreBackupPosts(importedPosts: BlogPost[]): Promise<void> {
  const validPosts = importedPosts.map(p => ({
    ...p,
    id: p.id || ('blog-' + (p.slug || Math.random().toString(36).substring(7))),
    slug: p.slug || 'imported-article',
    title: p.title || 'Untitled',
    content: p.content || '',
    status: p.status || 'published',
    createdAt: p.createdAt || Date.now()
  }));

  if (typeof window !== 'undefined') {
    localStorage.setItem(BLOG_KEY, JSON.stringify(validPosts));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  }

  for (const post of validPosts) {
    try {
      await setDoc(doc(db, 'blogPosts', post.id), post);
    } catch (e) {
      console.warn('Firestore restore warning for post:', post.id, e);
    }
  }
  clearClientCache();
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
    clearClientCache();
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id);
      updated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }
  } catch (err) {
    console.error('Error deleting from Firestore:', err);
    throw err;
  }
}

export function getStoredBlogPostsSync(): BlogPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BLOG_KEY);
    if (!data) return [];
    const posts: BlogPost[] = JSON.parse(data);
    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return posts;
  } catch {
    return [];
  }
}
