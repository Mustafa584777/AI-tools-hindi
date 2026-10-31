'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Share2, Folder, User, Sparkles, Loader2, X } from 'lucide-react';
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

  // AI Summarizer states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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

  const handleSummarize = async () => {
    if (!post) return;
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          keywordOrTitle: post.title,
          content: post.content
        })
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummaryText(data.summary);
        setShowSummaryModal(true);
      } else {
        alert('Failed to generate summary.');
      }
    } catch (e) {
      alert('Error: ' + (e as Error).message);
    } finally {
      setIsSummarizing(false);
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

        {/* Article Header */}
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
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600 shrink-0" />
                  {post.author || 'Anwar'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  {post.readTime}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold transition-colors text-xs disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-orange-600" />}
                  <span>{isSummarizing ? 'Summarising...' : 'Summarise with AI'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-lg font-bold transition-colors text-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
                </button>
              </div>
            </div>

            {/* WordPress HTML Content Renderer */}
            <ArticleContent content={post.content} />

            {/* Author Box */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="p-6 sm:p-8 bg-gradient-to-br from-orange-50/60 to-amber-50/30 rounded-2xl border border-orange-200/60 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-md">
                  {post.author ? post.author.charAt(0) : 'A'}
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h3 className="font-extrabold text-black text-lg">{post.author || 'Anwar'}</h3>
                    <span className="text-xs px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold inline-block w-fit mx-auto sm:mx-0">
                      Senior AI Content Expert & Tech Writer
                    </span>
                  </div>
                  <p className="text-black text-sm font-medium leading-relaxed">
                    Anwar is the founder and lead editor at aitoolhindi.online. Dedicated to making artificial intelligence, prompt engineering, and cutting-edge tech simple and practical in Hindi for millions across India.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section (6 articles) */}
        <section className="mt-12 space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-black tracking-tight">
              संबंधित आर्टिकल्स (Related Articles)
            </h2>
            <Link href="/" className="text-xs font-bold text-orange-600 hover:text-orange-700">
              View All Guides →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts
              .filter(p => p.id !== post.id && p.status !== 'draft')
              .slice(0, 6)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-40 relative w-full bg-slate-200">
                    <BlogImage
                      src={p.image}
                      alt={p.imageAlt || p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-orange-600 font-bold">{p.category}</span>
                        <span>•</span>
                        <span>{p.date}</span>
                      </div>
                      <h3 className="font-bold text-black text-base group-hover:text-orange-600 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Read Tutorial</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      {/* AI Summary Modal */}
      {showSummaryModal && aiSummaryText && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-orange-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-orange-100 pb-4">
              <div className="flex items-center gap-2.5 font-extrabold text-black text-lg">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span>AI Summarised Version (एआई सारांश)</span>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-slate max-w-none text-black leading-relaxed font-medium text-base space-y-4">
              <div dangerouslySetInnerHTML={{ __html: aiSummaryText }} />
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-orange-100">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
