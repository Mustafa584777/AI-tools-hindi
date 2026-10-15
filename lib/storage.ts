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
          return JSON.parse(cachedData);
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
    return JSON.parse(local);
  }
}

export function clearClientCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_TIME_KEY);
    localStorage.removeItem(BLOG_KEY);
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  try {
    await setDoc(doc(db, 'blogPosts', post.id), post);
    clearClientCache();
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const exists = posts.some(p => p.id === post.id);
      const updated = exists ? posts.map(p => p.id === post.id ? post : p) : [post, ...posts];
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }
  } catch (err) {
    console.error('Error saving to Firestore:', err);
    throw err;
  }
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
    clearClientCache();
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id);
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
    return JSON.parse(data);
  } catch {
    return [];
  }
}
