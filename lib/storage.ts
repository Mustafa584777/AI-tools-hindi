import { BlogPost } from './types';
import articlesBackup from '../data/articles-backup.json';
import { parseCsvToBlogPosts, normalizeGoogleSheetUrl } from './google-sheets';

export const INITIAL_BLOG_POSTS: BlogPost[] = (articlesBackup as unknown as BlogPost[]) || [];

export const GOOGLE_SHEET_CSV_KEY = 'aitoolhindi_google_sheet_csv_url';
export const APPS_SCRIPT_URL_KEY = 'aitoolhindi_google_apps_script_url';

export async function fetchBlogPostsFromFirestore(_forceRefresh = false): Promise<BlogPost[]> {
  // Fetch STRICTLY from Google Sheets Published CSV URL
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
            parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets live fetch notice:', err);
    }
  }

  // Fallback to server flat-file JSON API (/api/articles) if sheet not configured or failed
  try {
    const res = await fetch('/api/articles', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        data.posts.sort((a: BlogPost, b: BlogPost) => (b.createdAt || 0) - (a.createdAt || 0));
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('Server articles API read notice:', err);
  }

  return INITIAL_BLOG_POSTS;
}

export function clearClientCache(): void {
  // No-op since local cache is removed
}

export async function saveBlogPostToFirestore(post: BlogPost): Promise<void> {
  const postWithTime: BlogPost = {
    ...post,
    createdAt: post.createdAt || Date.now()
  };

  // 1. Persist to server disk storage via /api/articles
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postWithTime)
    });
  } catch (apiErr) {
    console.warn('Server disk backup update error:', apiErr);
  }

  // 2. Sync to Google Sheets Webhook (Apps Script) - Saves directly to Google Sheet!
  try {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'webhook_save', post: postWithTime })
    });
    const data = await res.json();
    if (!data.success && data.error) {
      console.warn('Google Sheet webhook save warning:', data.error);
    }
  } catch (sheetErr) {
    console.warn('Google Sheet webhook dispatch error:', sheetErr);
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

  if (onProgress) {
    onProgress(validPosts.length, validPosts.length);
  }
  return validPosts.length;
}

export async function deleteBlogPostFromFirestore(id: string): Promise<void> {
  // 1. Delete from server disk storage
  try {
    await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Server disk backup delete error:', e);
  }

  // 2. Delete from Google Sheets Webhook
  try {
    await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'webhook_delete', id })
    });
  } catch (sheetErr) {
    console.warn('Google Sheet webhook delete error:', sheetErr);
  }
}

export function getStoredBlogPostsSync(): BlogPost[] {
  return INITIAL_BLOG_POSTS;
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
