import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, User, Share2, Folder } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromFirestore } from '@/lib/storage';
import { BlogPost } from '@/lib/types';
import ArticleContent from '@/components/ArticleContent';

export const dynamic = 'force-dynamic';

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const posts = await fetchBlogPostsFromFirestore(true);
    return posts.find(p => p.slug === slug) || null;
  } catch {
    return null;
  }
}

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    return await fetchBlogPostsFromFirestore(true);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Page Not Found | AI Tool Hindi',
      description: 'The requested page does not exist on AI Tool Hindi.',
    };
  }

  const url = `https://aitoolhindi.online/${post.slug}`;
  const seoTitle = `${post.title} | AI Tool Hindi`;
  const seoDescription = post.metaDescription || post.excerpt || 'हिंदी में सीखें आर्टिफिशियल इंटेलिजेंस और AI टूल्स की पूरी जानकारी।';

  return {
    title: seoTitle,
    description: seoDescription,
    robots: {
      index: !post.noIndex,
      follow: !post.noIndex,
      googleBot: {
        index: !post.noIndex,
        follow: !post.noIndex,
        'max-snippet': -1,
        'max-video-preview': -1,
        'max-image-preview': 'large',
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: seoDescription,
      url: url,
      siteName: 'AI Tool Hindi',
      type: 'article',
      locale: 'hi_IN',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author || 'Anwar'],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: seoDescription,
      site: '@aitool_hindi',
      creator: '@aitool_hindi',
      images: [post.image],
    },
  };
}

function getProcessedContentWithTOC(html: string) {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const h2s = Array.from(doc.querySelectorAll('h2'));
  if (h2s.length === 0) return html;

  const headings: { id: string; text: string }[] = [];
  h2s.forEach((h2, idx) => {
    const id = `toc-heading-${idx}-${h2.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || idx}`;
    h2.id = id;
    headings.push({ id, text: h2.textContent || '' });
  });

  if (doc.querySelector('.auto-toc-box')) return doc.body.innerHTML;

  const paragraphs = Array.from(doc.querySelectorAll('p'));
  const tocHtml = `
    <div class="auto-toc-box my-8 p-6 bg-orange-50/70 border border-orange-200 rounded-2xl shadow-sm space-y-3">
      <div class="flex items-center gap-2 font-extrabold text-black text-base">
        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
        <span>Table of Contents (विषय सूची)</span>
      </div>
      <ul class="space-y-1.5 pl-5 list-disc text-sm font-bold text-orange-600">
        ${headings.map(h => `<li><a href="#${h.id}" class="no-underline hover:text-orange-800 text-orange-600">${h.text}</a></li>`).join('')}
      </ul>
    </div>
  `;

  if (paragraphs.length >= 3) {
    const thirdP = paragraphs[2];
    const tempContainer = doc.createElement('div');
    tempContainer.innerHTML = tocHtml;
    thirdP.after(tempContainer.firstElementChild!);
  } else if (doc.body.firstChild) {
    const tempContainer = doc.createElement('div');
    tempContainer.innerHTML = tocHtml;
    doc.body.insertBefore(tempContainer.firstElementChild!, doc.body.firstChild);
  }

  return doc.body.innerHTML;
}

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

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await getAllPosts();
  const post = posts.find(p => p.slug === slug);

  const matchedCategory = posts.find(p =>
    p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug
  )?.category;

  if (matchedCategory) {
    const categoryPosts = posts.filter(p =>
      p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug && p.status !== 'draft'
    );

    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Folder className="w-3.5 h-3.5 text-orange-600" />
              <span>Category Archive</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
              {matchedCategory} (Category Archive)
            </h1>
            <p className="text-black text-sm max-w-2xl font-medium">
              Explore all Hindi AI tutorials and guides filed under &ldquo;{matchedCategory}&rdquo;.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryPosts.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-black font-medium">No articles found in this category yet.</div>
            ) : (
              categoryPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-48 relative w-full bg-slate-200">
                    <Image
                      src={p.image}
                      alt={p.imageAlt || p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-black/75 font-medium">
                        <span>{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.date}</span>
                      </div>
                      <h3 className="font-bold text-black text-lg group-hover:text-orange-600 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="text-black text-sm leading-relaxed line-clamp-2 font-medium">
                        {p.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Read Article</span>
                      <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold text-black">Page or Category Not Found (404)</h1>
          <p className="text-black font-medium">This exact URL slug does not exist or was deleted.</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm">
            Back to Home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://aitoolhindi.online/${post.slug}`,
    },
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.image,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author || 'Anwar',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Tool Hindi',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aitoolhindi.online/logo.png',
      },
    },
  };

  const extractedFaqs = extractFaqsFromHtml(post.content);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="h-72 md:h-96 relative w-full bg-slate-200">
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
              <span className="inline-block px-3.5 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-full">
                {post.category}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
                {post.title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-12 space-y-8">
            {/* Metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs text-black font-medium">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" />
                  {post.readTime}
                </span>
              </div>
            </div>

            {/* WordPress HTML Content Renderer with TOC */}
            <ArticleContent content={post.content} />
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
