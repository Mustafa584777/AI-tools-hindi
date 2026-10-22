import { BlogPost } from './types';
import articlesBackup from '../data/articles-backup.json';
import { parseCsvToBlogPosts, normalizeGoogleSheetUrl } from './google-sheets';

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

export const BLOG_KEY = 'aitoolhindi_blog_posts_sheets_sync_v4';
export const CACHE_TIME_KEY = 'aitoolhindi_cache_timestamp';
export const GOOGLE_SHEET_CSV_KEY = 'aitoolhindi_google_sheet_csv_url';
export const APPS_SCRIPT_URL_KEY = 'aitoolhindi_google_apps_script_url';
export const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache

export async function fetchBlogPostsFromFirestore(forceRefresh = false): Promise<BlogPost[]> {
  // 1. Check client-side 24-hour cache if not forcing refresh
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const local = localStorage.getItem(BLOG_KEY);
      if (cachedTime && local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  // 2. Try fetching from Google Sheets live CSV URL (0 database cost)
  let sheetPosts: BlogPost[] = [];
  let googleSheetUrl = '';
  if (typeof window !== 'undefined') {
    googleSheetUrl = localStorage.getItem(GOOGLE_SHEET_CSV_KEY) || process.env.NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL || '';
  }

  if (googleSheetUrl) {
    try {
      const normalized = normalizeGoogleSheetUrl(googleSheetUrl);
      const res = await fetch(normalized, { cache: 'no-store' });
      if (res.ok) {
        const csvText = await res.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>') && !csvText.includes('accounts.google.com')) {
          const parsed = parseCsvToBlogPosts(csvText);
          if (parsed.length > 0) {
            sheetPosts = parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets live fetch notice:', err);
    }
  }

  // 3. Fetch from server flat-file JSON API (/api/articles)
  let serverPosts: BlogPost[] = [];
  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        serverPosts = data.posts;
      }
    }
  } catch (err) {
    console.warn('Server articles API read notice:', err);
  }

  let localPosts: BlogPost[] = [];
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(BLOG_KEY);
      if (local) localPosts = JSON.parse(local);
    } catch (e) {
      console.warn('Local read error:', e);
    }
  }

  // Union map: merge order: INITIAL -> Sheet -> Server -> Local (Local/Server wins so newly added articles NEVER disappear)
  const postMap = new Map<string, BlogPost>();
  INITIAL_BLOG_POSTS.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  sheetPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  serverPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });
  localPosts.forEach(p => {
    const key = p.slug || p.id;
    if (key) postMap.set(key, p);
  });

  const merged = Array.from(postMap.values());
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
  }
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  let finalImage = post.image;

  const postWithTime: BlogPost = {
    ...post,
    image: finalImage,
    createdAt: post.createdAt || Date.now()
  };

  // 1. Immediately update local storage and make sure it's at the top
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

  // 2. Persist to server disk storage via /api/articles (Flat-file database)
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postWithTime)
    });
  } catch (apiErr) {
    console.warn('Server disk backup update error:', apiErr);
  }

  // 3. Sync to Google Sheets Webhook in background (2-way sync)
  try {
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'webhook_save', post: postWithTime })
    }).catch(sheetErr => console.warn('Background Google Sheet sync notice:', sheetErr));
  } catch (sheetDispatchErr) {
    console.warn('Sheet webhook dispatch error:', sheetDispatchErr);
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

  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPosts)
    });
  } catch (e) {
    console.warn('Server disk backup update error:', e);
  }

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

  if (onProgress) {
    onProgress(validPosts.length, validPosts.length);
  }
  return validPosts.length;
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    const posts = getStoredBlogPostsSync();
    const updated = posts.filter(p => p.id !== id && p.slug !== id);
    updated.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
    localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  }

  try {
    await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Server disk backup delete error:', e);
  }

  try {
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'webhook_delete', id })
    }).catch(sheetErr => console.warn('Background Google Sheet delete notice:', sheetErr));
  } catch (sheetDispatchErr) {
    console.warn('Sheet webhook dispatch error:', sheetDispatchErr);
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

const mediaCache = new Map<string, string>();

export async function saveMediaVideoToFirestore(mediaId: string, base64Data: string): Promise<void> {
  mediaCache.set(mediaId, base64Data);
}

export async function fetchMediaVideoFromFirestore(mediaId: string): Promise<string | null> {
  return mediaCache.get(mediaId) || null;
}

export async function saveMediaImageToFirestore(mediaId: string, base64Data: string, slug?: string): Promise<void> {
  mediaCache.set(mediaId, base64Data);
  if (slug) mediaCache.set(slug, base64Data);
}

export async function fetchMediaImageBySlug(slug: string): Promise<string | null> {
  return mediaCache.get(slug) || null;
}

export async function fetchMediaImageFromFirestore(mediaId: string): Promise<string | null> {
  return mediaCache.get(mediaId) || null;
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

export const CLOUDINARY_CLOUD_NAME_KEY = 'aitoolhindi_cloudinary_cloud_name';
export const CLOUDINARY_UPLOAD_PRESET_KEY = 'aitoolhindi_cloudinary_upload_preset';

export async function uploadImageToCloudinary(fileOrBase64: File | string, cloudName: string, uploadPreset: string): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);
  
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
    const res = await fetch(fileOrBase64);
    const blob = await res.blob();
    formData.append('file', blob, 'image.jpg');
  } else {
    formData.append('file', fileOrBase64);
  }

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Cloudinary upload failed');
  }
  
  const data = await res.json();
  return data.secure_url;
}
