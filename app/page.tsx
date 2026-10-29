import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';
import { cleanPostForExport } from '@/lib/storage';
import HomeViewClient from '@/components/HomeViewClient';

export const dynamic = 'force-dynamic';

async function getPostsServer(): Promise<BlogPost[]> {
  try {
    const dataFilePath = path.join(process.cwd(), 'data', 'posts.json');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(p => cleanPostForExport(p as BlogPost));
      }
    }
  } catch {}
  return [];
}

export default async function HomePage() {
  const posts = await getPostsServer();
  const publishedPosts = posts.filter(p => p.status !== 'draft');

  return (
    <HomeViewClient initialPosts={publishedPosts} />
  );
}
