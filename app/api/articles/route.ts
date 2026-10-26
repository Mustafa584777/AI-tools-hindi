import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';

const dataFilePath = path.join(process.cwd(), 'data', 'posts.json');

function ensureDataFile() {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
  }
}

export async function GET() {
  try {
    ensureDataFile();
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    const posts: BlogPost[] = JSON.parse(fileContent);
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ posts: [], error: (error as Error).message }, { status: 500 });
  }
}

function extractFirstImageAndAlt(content: string, fallbackImage?: string, fallbackAlt?: string): { image: string; imageAlt: string } {
  if (!content) {
    return {
      image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
      imageAlt: fallbackAlt || 'AI tutorial featured image'
    };
  }

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgRegex);

  if (match && match[1]) {
    const src = match[1];
    if (!src.startsWith('data:image/')) {
      const imgTag = match[0];
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      const cleanSrc = src.trim().replace(/[\\\"\']+$/, '');
      const alt = altMatch && altMatch[1] ? altMatch[1].trim() : (fallbackAlt || 'AI tutorial featured image');
      return { image: cleanSrc, imageAlt: alt };
    }
  }

  return {
    image: fallbackImage || 'https://picsum.photos/seed/default/800/450',
    imageAlt: fallbackAlt || 'AI tutorial featured image'
  };
}

export async function POST(req: NextRequest) {
  try {
    ensureDataFile();
    const body = await req.json();
    let posts: BlogPost[] = [];
    try {
      posts = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    } catch {}

    if (Array.isArray(body)) {
      // Bulk restore / update
      const postMap = new Map<string, BlogPost>();
      posts.forEach(p => postMap.set(p.slug || p.id, p));
      body.forEach(p => {
        const { image, imageAlt } = extractFirstImageAndAlt(p.content, p.image, p.imageAlt);
        const cleanContent = p.content ? p.content.replace(/src="data:image\/[^"]+"/g, 'src=""') : '';
        const cleanImage = image && image.startsWith('data:image/') ? 'https://aitoolhindi.online/wp-content/uploads/default.webp' : image;
        postMap.set(p.slug || p.id, { ...p, content: cleanContent, image: cleanImage, imageAlt });
      });
      posts = Array.from(postMap.values());
    } else {
      const p = body as BlogPost;
      const { image, imageAlt } = extractFirstImageAndAlt(p.content, p.image, p.imageAlt);
      const cleanContent = p.content ? p.content.replace(/src="data:image\/[^"]+"/g, 'src=""') : '';
      const cleanImage = image && image.startsWith('data:image/') ? 'https://aitoolhindi.online/wp-content/uploads/default.webp' : image;
      const sanitizedPost = { ...p, content: cleanContent, image: cleanImage, imageAlt };

      const index = posts.findIndex(existing => existing.id === sanitizedPost.id || existing.slug === sanitizedPost.slug);
      if (index >= 0) {
        posts[index] = sanitizedPost;
      } else {
        posts.unshift(sanitizedPost);
      }
    }

    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true, count: posts.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureDataFile();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    let posts: BlogPost[] = [];
    try {
      posts = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    } catch {}

    posts = posts.filter(p => p.id !== id && p.slug !== id);
    fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
