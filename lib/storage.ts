import { BlogPost } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const INITIAL_BLOG_POSTS: BlogPost[] = [];

const BLOG_KEY = 'aitoolhindi_blog_posts_firebase_sync_v2';
const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  if (typeof window !== 'undefined' && !forceRefresh) {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const cachedData = localStorage.getItem(BLOG_KEY);
      if (cachedTime && cachedData) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          const parsed: BlogPost[] = JSON.parse(cachedData);
          parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const posts: BlogPost[] = [];
    querySnapshot.forEach((docSnap) => {
      posts.push(docSnap.data() as BlogPost);
    });

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOG_KEY, JSON.stringify(posts));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }

    return posts;
  } catch (err) {
    console.error('Error fetching from Firestore, falling back to localStorage cache:', err);
    if (typeof window === 'undefined') return [];
    const local = localStorage.getItem(BLOG_KEY);
    if (!local) return [];
    const parsed: BlogPost[] = JSON.parse(local);
    parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return parsed;
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
