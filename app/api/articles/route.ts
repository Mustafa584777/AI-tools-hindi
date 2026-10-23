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
        // Strip base64 data URIs from content if requested to keep json light
        const cleanContent = p.content ? p.content.replace(/src="data:image\/[^"]+"/g, 'src=""') : '';
        const cleanImage = p.image && p.image.startsWith('data:image/') ? 'https://aitoolhindi.online/wp-content/uploads/default.webp' : p.image;
        postMap.set(p.slug || p.id, { ...p, content: cleanContent, image: cleanImage });
      });
      posts = Array.from(postMap.values());
    } else {
      const p = body as BlogPost;
      const cleanContent = p.content ? p.content.replace(/src="data:image\/[^"]+"/g, 'src=""') : '';
      const cleanImage = p.image && p.image.startsWith('data:image/') ? 'https://aitoolhindi.online/wp-content/uploads/default.webp' : p.image;
      const sanitizedPost = { ...p, content: cleanContent, image: cleanImage };

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
