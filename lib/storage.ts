import { BlogPost } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const INITIAL_BLOG_POSTS: BlogPost[] = [];

const BLOG_KEY = 'aitoolhindi_blog_posts_firebase_sync_v2';

export async function fetchBlogPostsFromFirestore(): Promise<BlogPost[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const posts: BlogPost[] = [];
    querySnapshot.forEach((docSnap) => {
      posts.push(docSnap.data() as BlogPost);
    });
    // Do NOT auto-seed static posts anymore per user request.
    return posts;
  } catch (err) {
    console.error('Error fetching from Firestore, falling back to localStorage:', err);
    if (typeof window === 'undefined') return [];
    const local = localStorage.getItem(BLOG_KEY);
    if (!local) return [];
    return JSON.parse(local);
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  try {
    await setDoc(doc(db, 'blogPosts', post.id), post);
    // Also backup in localStorage
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const exists = posts.some(p => p.id === post.id);
      const updated = exists ? posts.map(p => p.id === post.id ? post : p) : [post, ...posts];
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving to Firestore:', err);
    throw err;
  }
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id);
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
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
