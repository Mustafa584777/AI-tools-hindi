import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';
import postsBackup from '@/data/posts.json';
import { cleanPostForExport } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const dataFilePath = path.join(process.cwd(), 'data', 'posts.json');
const publicPostsPath = path.join(process.cwd(), 'public', 'posts.json');

export async function GET() {
  try {
    let postsFromData: BlogPost[] = [];
    let postsFromPublic: BlogPost[] = [];

    if (fs.existsSync(dataFilePath)) {
      try {
        const content = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) postsFromData = parsed;
      } catch {}
    }

    if (fs.existsSync(publicPostsPath)) {
      try {
        const content = fs.readFileSync(publicPostsPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) postsFromPublic = parsed;
      } catch {}
    }

    const slugMap = new Map<string, BlogPost>();

    // Seed with postsBackup first
    if (Array.isArray(postsBackup)) {
      postsBackup.forEach((p: any) => {
        const slug = (p.slug || '').trim().toLowerCase();
        if (slug) slugMap.set(slug, p as BlogPost);
      });
    }

    // Overlay postsFromPublic
    postsFromPublic.forEach(p => {
      const slug = (p.slug || '').trim().toLowerCase();
      if (!slug) return;
      const existing = slugMap.get(slug);
      if (!existing || (p.createdAt || 0) >= (existing.createdAt || 0)) {
        slugMap.set(slug, p);
      }
    });

    // Overlay postsFromData (user uploaded to GitHub data/posts.json)
    postsFromData.forEach(p => {
      const slug = (p.slug || '').trim().toLowerCase();
      if (!slug) return;
      const existing = slugMap.get(slug);
      if (!existing || (p.createdAt || 0) >= (existing.createdAt || 0)) {
        slugMap.set(slug, p);
      }
    });

    let posts = Array.from(slugMap.values());
    if (posts.length === 0) {
      posts = (postsBackup as unknown as BlogPost[]) || [];
    }

    // Ensure all posts are cleaned for export (no base64 except wp/cloudinary, correct featured image & slug)
    posts = posts.map(cleanPostForExport);

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ posts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    const fallback = ((postsBackup as unknown as BlogPost[]) || []).map(cleanPostForExport);

    return NextResponse.json({ posts: fallback }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}
