'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, User, Share2, Folder } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromFirestore, getStoredBlogPostsSync } from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getProcessedContentWithTOC(html: string) {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find ONLY H2 headings for Table of Contents
  const h2s = Array.from(doc.querySelectorAll('h2'));
  if (h2s.length === 0) return html;

  const headings: { id: string; text: string }[] = [];
  h2s.forEach((h2, idx) => {
    const id = `toc-heading-${idx}-${h2.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || idx}`;
    h2.id = id;
    headings.push({ id, text: h2.textContent || '' });
  });

  // Check if TOC already exists to avoid duplicate insertion
  if (doc.querySelector('.auto-toc-box')) return doc.body.innerHTML;

  const paragraphs = Array.from(doc.querySelectorAll('p'));
  const tocHtml = `
    <div class="auto-toc-box my-8 p-6 bg-orange-50/70 border border-orange-200 rounded-2xl shadow-sm space-y-3">
      <div class="flex items-center gap-2 font-extrabold text-black text-base">
        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
        <span>Table of Contents (विषय सूची)</span>
      </div>
      <ul class="space-y-1.5 pl-5 list-disc text-sm font-bold text-orange-600">
        ${headings.map(h => `<li><a href="#${h.id}" class="hover:underline text-orange-600">${h.text}</a></li>`).join('')}
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

export default function SlugPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const allPosts = await fetchBlogPostsFromFirestore();
        setPosts(allPosts);
      } catch {
        setPosts(getStoredBlogPostsSync());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const post = posts.find(p => p.slug === slug);
  const postContent = post?.content || '';
  const processedContent = useMemo(() => {
    if (!postContent) return '';
    return getProcessedContentWithTOC(postContent);
  }, [postContent]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center text-black font-medium">
          Loading tutorial...
        </main>
        <Footer />
      </>
    );
  }

  // Check if this slug is a category archive slug
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

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
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
                <span className="flex items-center gap-1.5 font-bold text-black">
                  <User className="w-4 h-4 text-orange-600" />
                  {post.author || 'Anwar'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-lg font-bold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>

            {/* WordPress HTML Content Renderer with Auto-Injected TOC */}
            <div 
              className="prose prose-slate max-w-none text-black leading-relaxed space-y-4 text-base md:text-lg font-medium [&>h1]:text-2xl [&>h1]:md:text-3xl [&>h1]:font-extrabold [&>h1]:text-black [&>h1]:pt-4 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-black [&>h2]:pt-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-black [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-4 [&>blockquote]:bg-orange-50/50 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Author Box at the end of every blog article */}
            <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-orange-50/80 to-amber-50/50 border border-orange-200/80 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 relative rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-orange-600 bg-slate-200">
                <Image
                  src="/author.png"
                  alt="Anwar"
                  fill
                  sizes="96px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-3 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-black">Anwar</h3>
                    <p className="text-xs font-bold text-orange-600">AI Tools & Prompt Engineering Expert</p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href="https://x.com/aitool_hindi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm"
                      title="X (Twitter)"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <Link
                      href="/"
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                      See Author&apos;s Posts
                    </Link>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-black leading-relaxed font-medium">
                  Anwar, AI टूल्स और प्रॉम्प्ट इंजीनियरिंग के क्षेत्र में 5 वर्षों से ज़्यादा का अनुभव रखते हैं, इन्होंने 1000+ हज़ारों AI Tools को analyse और test किया है जिसकी झलक आप इनके हिंदी AI tutorials में भी देख सकते हैं। इनके tutorials से हज़ारों हिंदी readers ने ChatGPT, Gemini, Midjourney, AI image generation और AI video generation जैसी टेक्नोलॉजी का इस्तेमाल सीखा है।
                </p>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
