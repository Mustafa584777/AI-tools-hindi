export interface BlogPost {
  id: string;
  slug: string; // Exact WordPress URL slug, e.g. "top-ai-tools-in-hindi"
  title: string;
  excerpt: string;
  content: string; // HTML or markdown formatted content
  category: string;
  author: string;
  date: string;
  readTime?: string;
  image: string;
  imageAlt?: string;
  imageSlug?: string;
  status: 'published' | 'draft';
  faqs?: { question: string; answer: string; }[];
}
