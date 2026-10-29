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
    let rawPosts: any[] = [];

    if (fs.existsSync(dataFilePath)) {
      try {
        const content = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) rawPosts = parsed;
      } catch {}
    }

    if (rawPosts.length === 0 && fs.existsSync(publicPostsPath)) {
      try {
        const content = fs.readFileSync(publicPostsPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) rawPosts = parsed;
      } catch {}
    }

    if (rawPosts.length === 0 && Array.isArray(postsBackup)) {
      rawPosts = postsBackup;
    }

    // Strictly load and clean posts from posts.json
    let posts = rawPosts.map((p: any) => cleanPostForExport(p as BlogPost));

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
