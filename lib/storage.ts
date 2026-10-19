import { BlogPost } from './types';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-ai-se-time-table-kaise-banaye',
    slug: 'ai-se-time-table-kaise-banaye',
    title: 'AI से पढ़ाई का टाइम टेबल कैसे बनाएं: Best ChatGPT Prompts & Tools',
    excerpt: 'हिंदी में सीखें ChatGPT और दूसरे AI tools से पढ़ाई का टाइम टेबल बनाने का आसान तरीका, copy-paste prompt और Google Calendar में डालने के steps!',
    metaDescription: 'हिंदी में सीखें ChatGPT और दूसरे AI tools से पढ़ाई का टाइम टेबल बनाने का आसान तरीका, copy-paste prompt और Google Calendar में डालने के steps!',
    content: `<h2 class="text-2xl font-bold text-black mt-6 mb-3">AI से Time Table बनाना क्यों जरूरी है?</h2>\n<p class="mb-6 text-slate-700 leading-relaxed text-lg">आज के समय में पढ़ाई या ऑफिस का शेड्यूल मैनेज करना एक चुनौती बन गया है। AI (Artificial Intelligence) की मदद से आप मात्र 1 मिनट में अपना परफेक्ट स्टडी टाइम टेबल तैयार कर सकते हैं।</p>\n<h2 class="text-2xl font-bold text-black mt-6 mb-3">ChatGPT के लिए Best Prompt</h2>\n<p class="mb-6 text-slate-700 leading-relaxed text-lg">आप ChatGPT में यह प्रॉम्प्ट कॉपी-पेस्ट कर सकते हैं: "मुझे एक ऐसा स्टडी टाइम टेबल बनाकर दो जिसमें सुबह 6 बजे से रात 10 बजे तक का शेड्यूल हो और बीच में 15 मिनट के ब्रेक्स हों।"</p>`,
    category: 'AI Guides',
    author: 'Anwar',
    date: '15 Oct 2026',
    readTime: '6 min read',
    image: 'https://picsum.photos/seed/timetable/800/450',
    imageAlt: 'AI se time table kaise banaye banner',
    imageSlug: 'ai-time-table-banner',
    status: 'published',
    createdAt: Date.now()
  }
];

const BLOG_KEY = 'aitoolhindi_blog_posts_firebase_sync_v2';
const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache to prevent exhausting Firestore reads quota

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

  // If not forceRefresh and we have valid local posts within cache TTL, use local cache to save Firestore reads quota
  if (typeof window !== 'undefined' && !forceRefresh && localPosts.length > 0) {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          localPosts.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
          return localPosts;
        }
      }
    } catch (e) {
      console.warn('Cache time read error:', e);
    }
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'blogPosts'));
    const firestorePosts: BlogPost[] = [];
    querySnapshot.forEach((docSnap) => {
      firestorePosts.push(docSnap.data() as BlogPost);
    });

    const postMap = new Map<string, BlogPost>();
    INITIAL_BLOG_POSTS.forEach(p => postMap.set(p.id, p));
    localPosts.forEach(p => postMap.set(p.id, p));
    firestorePosts.forEach(p => postMap.set(p.id, p));
    const merged = Array.from(postMap.values());
    merged.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));

    if (typeof window !== 'undefined' && merged.length > 0) {
      localStorage.setItem(BLOG_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }

    const finalPosts = firestorePosts.length > 0 ? merged : (localPosts.length > 0 ? localPosts : merged);
    return finalPosts;
  } catch (err) {
    console.error('Error fetching from Firestore database:', err);
    if (typeof window !== 'undefined' && localPosts.length > 0) {
      localPosts.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      return localPosts;
    }
    return INITIAL_BLOG_POSTS;
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

  try {
    await setDoc(doc(db, 'blogPosts', postWithTime.id), postWithTime);
    clearClientCache();
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const exists = posts.some(p => p.id === postWithTime.id);
      const updated = exists ? posts.map(p => p.id === postWithTime.id ? postWithTime : p) : [postWithTime, ...posts];
      updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }
  } catch (err) {
    console.error('Error saving article to Firestore database:', err);
    throw new Error('Database save failed: ' + (err as Error).message);
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

  for (const post of validPosts) {
    try {
      await setDoc(doc(db, 'blogPosts', post.id), post);
    } catch (e) {
      console.warn('Firestore restore warning for post:', post.id, e);
    }
  }
  clearClientCache();
  if (typeof window !== 'undefined') {
    localStorage.setItem(BLOG_KEY, JSON.stringify(validPosts));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  }
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogPosts', id));
    clearClientCache();
    if (typeof window !== 'undefined') {
      const posts = getStoredBlogPostsSync();
      const updated = posts.filter(p => p.id !== id);
      updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }
  } catch (err) {
    console.error('Error deleting from Firestore:', err);
    throw err;
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

export async function saveMediaVideoToFirestore(mediaId: string, base64Data: string): Promise<void> {
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
    return fullData;
  } catch (e) {
    console.error('Error fetching media video from Firestore:', e);
    return null;
  }
}

