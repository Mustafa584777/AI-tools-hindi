import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';

const dataFilePath = path.join(process.cwd(), 'data', 'posts.json');
const publicPostsPath = path.join(process.cwd(), 'public', 'posts.json');

function ensureDataFile() {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const publicDir = path.dirname(publicPostsPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
  }
}

function saveToDisk(posts: BlogPost[]) {
  ensureDataFile();
  const jsonStr = JSON.stringify(posts, null, 2);
  fs.writeFileSync(dataFilePath, jsonStr, 'utf-8');
  try {
    fs.writeFileSync(publicPostsPath, jsonStr, 'utf-8');
  } catch (e) {
    console.warn('Failed to write public posts.json:', e);
  }
}

export async function GET() {
  try {
    ensureDataFile();
    let posts: BlogPost[] = [];
    try {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      posts = JSON.parse(fileContent);
    } catch {
      if (fs.existsSync(publicPostsPath)) {
        posts = JSON.parse(fs.readFileSync(publicPostsPath, 'utf-8'));
      }
    }
    return NextResponse.json({ posts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json({ posts: [], error: (error as Error).message }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}

function extractFirstImageAndAlt(
  content: string, 
  fallbackImage?: string, 
  fallbackAlt?: string,
  fallbackTitle?: string
): { image: string; imageAlt: string } {
  if (!content) {
    return {
      image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
      imageAlt: fallbackAlt || fallbackTitle || 'AI tutorial featured image'
    };
  }

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let firstValidImage: { image: string; imageAlt: string } | null = null;
  let firstAnyImage: { image: string; imageAlt: string } | null = null;

  while ((match = imgRegex.exec(content)) !== null) {
    const rawSrc = match[1];
    const imgTag = match[0];
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const cleanSrc = rawSrc.trim().replace(/[\\\"\']+$/, '');
    const cleanAlt = altMatch && altMatch[1] && altMatch[1].trim()
      ? altMatch[1].trim()
      : (fallbackAlt || fallbackTitle || 'AI tutorial featured image');

    if (!firstAnyImage && cleanSrc) {
      firstAnyImage = { image: cleanSrc, imageAlt: cleanAlt };
    }

    if (!firstValidImage && cleanSrc && !cleanSrc.includes('img.youtube.com') && !cleanSrc.includes('i.ytimg.com')) {
      firstValidImage = { image: cleanSrc, imageAlt: cleanAlt };
      break;
    }
  }

  const selected = firstValidImage || firstAnyImage;
  if (selected) {
    return selected;
  }

  return {
    image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
    imageAlt: fallbackAlt || fallbackTitle || 'AI tutorial featured image'
  };
}

export async function POST(req: NextRequest) {
  try {
    ensureDataFile();
    const body = await req.json();
    let posts: BlogPost[] = [];
    try {
      posts = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    } catch {
      try {
        posts = JSON.parse(fs.readFileSync(publicPostsPath, 'utf-8'));
      } catch {}
    }

    if (Array.isArray(body)) {
      // Bulk restore / update
      const postMap = new Map<string, BlogPost>();
      posts.forEach(p => postMap.set(p.slug || p.id, p));
      body.forEach(p => {
        const { image, imageAlt } = extractFirstImageAndAlt(p.content, p.image, p.imageAlt, p.title);
        postMap.set(p.slug || p.id, { ...p, image, imageAlt });
      });
      posts = Array.from(postMap.values());
    } else {
      const p = body as BlogPost;
      const { image, imageAlt } = extractFirstImageAndAlt(p.content, p.image, p.imageAlt, p.title);
      const sanitizedPost = { ...p, image, imageAlt };

      const index = posts.findIndex(existing => existing.id === sanitizedPost.id || existing.slug === sanitizedPost.slug);
      if (index >= 0) {
        posts[index] = sanitizedPost;
      } else {
        posts.unshift(sanitizedPost);
      }
    }

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    saveToDisk(posts);

    return NextResponse.json({ success: true, count: posts.length }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureDataFile();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
      });
    }

    let posts: BlogPost[] = [];
    try {
      posts = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    } catch {
      try {
        posts = JSON.parse(fs.readFileSync(publicPostsPath, 'utf-8'));
      } catch {}
    }

    posts = posts.filter(p => p.id !== id && p.slug !== id);
    saveToDisk(posts);

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  }
}

