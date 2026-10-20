import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'articles-backup.json');

function ensureDataFile(): BlogPost[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading articles backup file:', e);
  }
  return [];
}

function saveDataFile(posts: BlogPost[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving articles backup file:', e);
  }
}

export async function GET() {
  const posts = ensureDataFile();
  return NextResponse.json({ success: true, count: posts.length, posts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = ensureDataFile();
    const postMap = new Map<string, BlogPost>();

    existing.forEach(p => {
      if (p.id) postMap.set(p.id, p);
      if (p.slug) postMap.set(p.slug, p);
    });

    if (Array.isArray(body)) {
      // Bulk restore/save
      body.forEach((p: BlogPost) => {
        const key = p.id || p.slug;
        if (key) postMap.set(key, p);
      });
    } else if (body && (body.id || body.slug)) {
      // Single post save
      const key = body.id || body.slug;
      postMap.set(key, body);
    }

    const updated = Array.from(postMap.values());
    updated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    saveDataFile(updated);

    return NextResponse.json({ success: true, count: updated.length });
  } catch (err) {
    console.error('Error in /api/articles POST:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing article ID' }, { status: 400 });
    }

    const existing = ensureDataFile();
    const filtered = existing.filter(p => p.id !== id && p.slug !== id);
    saveDataFile(filtered);

    return NextResponse.json({ success: true, count: filtered.length });
  } catch (err) {
    console.error('Error in /api/articles DELETE:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
