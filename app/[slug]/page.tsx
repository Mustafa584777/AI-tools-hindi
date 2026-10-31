import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import { BlogPost } from '@/lib/types';
import { cleanPostForExport } from '@/lib/storage';
import ArticleViewClient from '@/components/ArticleViewClient';

export const dynamic = 'force-dynamic';

function extractFaqsFromHtml(html: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  if (!html) return faqs;

  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const headingText = match[1].replace(/<[^>]*>/g, '').trim();
    if (headingText.endsWith('?')) {
      const remainder = html.substring(headingRegex.lastIndex);
      const pMatch = /<p[^>]*>(.*?)<\/p>/i.exec(remainder);
      if (pMatch) {
        const answerText = pMatch[1].replace(/<[^>]*>/g, '').trim();
        faqs.push({ question: headingText, answer: answerText });
      }
    }
  }
  return faqs;
}

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).replace(/\/+$/, '').trim().toLowerCase();
  const posts = await getPostsServer();

  const post = posts.find(p => {
    const pSlug = (p.slug || '').replace(/\/+$/, '').trim().toLowerCase();
    const pId = (p.id || '').replace(/^blog-/, '').trim().toLowerCase();
    return pSlug === cleanSlug || pId === cleanSlug || p.id === cleanSlug || p.id === `blog-${cleanSlug}`;
  });

  const matchedCategory = posts.find(p =>
    p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug
  )?.category;

  if (post) {
    const imageUrl = post.image.startsWith('http') ? post.image : `https://aitoolhindi.online${post.image}`;
    const pageUrl = `https://aitoolhindi.online/${post.slug}`;
    const description = post.metaDescription || post.excerpt || 'AI tutorial in Hindi';

    return {
      title: `${post.title} | AI Tool Hindi`,
      description,
      robots: {
        index: !post.noIndex,
        follow: true,
        googleBot: {
          index: !post.noIndex,
          follow: true,
          'max-snippet': -1,
          'max-video-preview': -1,
          'max-image-preview': 'large',
        },
      },
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        locale: 'en_US',
        type: 'article',
        title: post.title,
        description,
        url: pageUrl,
        siteName: 'AI Tool Hindi',
        section: post.category,
        publishedTime: new Date(post.createdAt || Date.now()).toISOString(),
        modifiedTime: new Date(post.createdAt || Date.now()).toISOString(),
        images: [
          {
            url: imageUrl,
            width: 1068,
            height: 600,
            alt: post.imageAlt || post.title,
            type: 'image/webp',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        site: '@aitool_hindi',
        creator: '@aitool_hindi',
        images: [imageUrl],
      },
      other: {
        'twitter:label1': 'Written by',
        'twitter:data1': post.author || 'Anwar',
        'twitter:label2': 'Time to read',
        'twitter:data2': post.readTime || '5 min read',
        'author': post.author || 'Anwar',
        'article:author': 'https://aitoolhindi.online/about-us',
        'article:publisher': 'https://aitoolhindi.online',
      },
    };
  }

  if (matchedCategory) {
    const pageUrl = `https://aitoolhindi.online/${cleanSlug}`;
    const description = `Explore all Hindi AI tutorials and guides filed under ${matchedCategory}.`;
    return {
      title: `${matchedCategory} Archives | AI Tool Hindi`,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${matchedCategory} Archives | AI Tool Hindi`,
        description,
        url: pageUrl,
        siteName: 'AI Tool Hindi',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${matchedCategory} Archives | AI Tool Hindi`,
        description,
      },
    };
  }

  return {
    title: 'Page Not Found | AI Tool Hindi',
    description: 'This exact URL slug does not exist or was deleted.',
  };
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).replace(/\/+$/, '').trim().toLowerCase();
  const posts = await getPostsServer();

  const post = posts.find(p => {
    const pSlug = (p.slug || '').replace(/\/+$/, '').trim().toLowerCase();
    const pId = (p.id || '').replace(/^blog-/, '').trim().toLowerCase();
    return pSlug === cleanSlug || pId === cleanSlug || p.id === cleanSlug || p.id === `blog-${cleanSlug}`;
  });

  const matchedCategory = posts.find(p =>
    p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug
  )?.category;

  const blogPostingSchema = post ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://aitoolhindi.online/${post.slug}`,
    },
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.image.startsWith('http') ? post.image : `https://aitoolhindi.online${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author || 'Anwar',
      url: 'https://aitoolhindi.online/about-us',
      jobTitle: 'Senior AI Content Expert & Tech Writer',
      worksFor: {
        '@type': 'Organization',
        name: 'AI Tool Hindi',
        url: 'https://aitoolhindi.online',
      },
      sameAs: [
        'https://aitoolhindi.online/about-us',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Tool Hindi',
      url: 'https://aitoolhindi.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aitoolhindi.online/logo.png',
      },
    },
  } : null;

  const extractedFaqs = post ? extractFaqsFromHtml(post.content) : [];
  const faqSchema = extractedFaqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: extractedFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      {blogPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ArticleViewClient
        initialPost={post || null}
        initialMatchedCategory={matchedCategory || null}
        initialPosts={posts}
        cleanSlug={cleanSlug}
      />
    </>
  );
}
