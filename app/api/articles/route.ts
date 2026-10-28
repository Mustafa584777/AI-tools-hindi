import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';
import postsBackup from '@/data/posts.json';

const dataFilePath = path.join(process.cwd(), 'data', 'posts.json');
const publicPostsPath = path.join(process.cwd(), 'public', 'posts.json');

export async function GET() {
  try {
    let posts: BlogPost[] = [];

    if (fs.existsSync(publicPostsPath)) {
      try {
        const content = fs.readFileSync(publicPostsPath, 'utf-8');
        posts = JSON.parse(content);
      } catch {}
    }

    if ((!posts || posts.length === 0) && fs.existsSync(dataFilePath)) {
      try {
        const content = fs.readFileSync(dataFilePath, 'utf-8');
        posts = JSON.parse(content);
      } catch {}
    }

    if (!posts || posts.length === 0) {
      posts = (postsBackup as unknown as BlogPost[]) || [];
    }

    return NextResponse.json({ posts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    return NextResponse.json({ posts: (postsBackup as unknown as BlogPost[]) || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}
