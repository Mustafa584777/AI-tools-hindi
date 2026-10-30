'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Share2, Folder } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BlogPost } from '@/lib/types';
import ArticleContent from '@/components/ArticleContent';
import TableOfContents from '@/components/TableOfContents';
import { extractTocFromHtml } from '@/lib/utils';
import BlogImage from '@/components/BlogImage';

interface ArticleViewClientProps {
  initialPost: BlogPost | null;
  initialMatchedCategory: string | null;
  initialPosts: BlogPost[];
  cleanSlug: string;
}

export default function ArticleViewClient({
  initialPost,
  initialMatchedCategory,
  initialPosts,
  cleanSlug,
}: ArticleViewClientProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [matchedCategory, setMatchedCategory] = useState<string | null>(initialMatchedCategory);
  const [loading, setLoading] = useState<boolean>(!initialPost && !initialMatchedCategory);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch(`/api/articles?t=${Date.now()}&fresh=1`, { cache: 'no-store' });
        const data = await res.json();
        if (data?.posts && Array.isArray(data.posts) && data.posts.length > 0 && isMounted) {
          const allPosts: BlogPost[] = data.posts;
          setPosts(allPosts);
          
          const foundPost = allPosts.find(p => {
            const pSlug = (p.slug || '').replace(/\/+$/, '').trim().toLowerCase();
            const pId = (p.id || '').replace(/^blog-/, '').trim().toLowerCase();
            return pSlug === cleanSlug || pId === cleanSlug || p.id === cleanSlug || p.id === `blog-${cleanSlug}`;
          });

          const foundCat = allPosts.find(p =>
            p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug
          )?.category;

          if (foundPost) setPost(foundPost);
          if (foundCat) setMatchedCategory(foundCat);
        }
      } catch {
        // Fallback to initial
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (!initialPost && !initialMatchedCategory) {
      loadData();
    }
    return () => { isMounted = false; };
  }, [cleanSlug, initialPost, initialMatchedCategory]);

  const tocItems = post ? extractTocFromHtml(post.content) : [];

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

  if (matchedCategory) {
    const categoryPosts = posts.filter(p => 
      p.category && p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug && p.status !== 'draft'
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
                    <BlogImage
                      src={p.image}
                      alt={p.imageAlt || p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                        {p.metaDescription || p.excerpt}
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

      <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 md:py-12 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Article Header (Featured Image removed per user request) */}
        <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm w-full max-w-full">
          <div className="p-6 sm:p-8 md:p-10 space-y-4 border-b border-slate-100">
            <span className="inline-block px-3.5 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200">
              {post.category}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight text-black break-words">
              {post.title}
            </h1>
          </div>

          <div className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
            {/* Metadata bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4 border-b border-slate-100 text-xs text-black font-medium">
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  {post.readTime}
                </span>
              </div>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-lg font-bold transition-colors text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>

            {/* WordPress HTML Content Renderer (TOC is automatically injected after 3rd paragraph inside ArticleContent) */}
            <ArticleContent content={post.content} />
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
