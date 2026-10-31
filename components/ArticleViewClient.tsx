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

const placeholders = [
  "क्या आप बेस्ट इमेज जनरेशन टूल जानना चाहेंगे?",
  "क्या आपको AI इमेज जनरेशन के लिए टिप्स चाहिए?",
  "क्या ChatGPT और Claude में अंतर जानना चाहते हैं?",
  "क्या आप प्रॉम्प्ट इंजीनियरिंग सीखना चाहते हैं?"
];

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

  // AI Summarizer inline states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryHtml, setAiSummaryHtml] = useState<string | null>(null);

  // Follow-up Question Bar states
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
      const res = await fetch('/api/ai-supervisor/', {
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
        setAiSummaryHtml(data.summary);
      } else {
        setAiSummaryHtml('<p>सारांश उत्पन्न करने में विफल। कृपया पुनः प्रयास करें।</p>');
      }
    } catch (e) {
      setAiSummaryHtml('<p>त्रुटि: ' + (e as Error).message + '</p>');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || !post) return;
    setIsAskingQuestion(true);
    setQuestionAnswer(null);
    try {
      const res = await fetch('/api/ai-supervisor/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'question',
          keywordOrTitle: post.title,
          content: post.content,
          question: userQuestion.trim()
        })
      });
      const data = await res.json();
      if (data.answer) {
        setQuestionAnswer(data.answer);
      } else {
        setQuestionAnswer('<p>क्षमा करें, उत्तर प्राप्त करने में समस्या आई।</p>');
      }
    } catch (err) {
      setQuestionAnswer('<p>त्रुटि: ' + (err as Error).message + '</p>');
    } finally {
      setIsAskingQuestion(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 md:py-12 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* 2-Column Desktop Layout (Article main + Right Sidebar for Related Articles) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Article Column */}
          <div className="md:col-span-8 space-y-6 w-full max-w-full overflow-hidden">
            <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm w-full max-w-full">
              <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 space-y-2">
                <span className="inline-block px-3.5 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200">
                  {post.category}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight text-black break-words">
                  {post.title}
                </h1>
              </div>

              <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 pt-0 space-y-6 sm:space-y-8">
                {/* Metadata bar */}
                <div className="flex flex-row items-center justify-between gap-3 py-2 sm:py-3 text-xs text-black font-medium">
                  <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
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

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all text-xs disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-white" />}
                      <span>{isSummarizing ? 'Summarising...' : 'Summarise with AI'}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-lg font-bold transition-colors text-xs cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{copied ? 'Copied!' : 'Share'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline AI Summary Section (Appears right at the top of article content when clicked) */}
                {aiSummaryHtml && (
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-purple-50/50 rounded-3xl border border-blue-200/80 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-black text-lg">AI Summarised Version (एआई सारांश)</h3>
                          <p className="text-xs text-slate-600 font-medium">Detailed summary with lists & tables in easy Hindi</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAiSummaryHtml(null)}
                        className="p-1.5 hover:bg-white/80 rounded-xl text-slate-500 transition-colors cursor-pointer"
                        title="Close Summary"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="prose prose-slate max-w-none text-black leading-relaxed font-medium text-base space-y-4">
                      <div dangerouslySetInnerHTML={{ __html: aiSummaryHtml }} />
                    </div>
                  </div>
                )}

                {/* Interactive Question Bar */}
                <div className="p-6 bg-orange-50/80 border border-orange-200 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 text-black font-extrabold text-base">
                    <div className="p-1.5 rounded-xl bg-orange-600 text-white">
                      <User className="w-4 h-4" />
                    </div>
                    <span>और क्या जानना चाहते हैं? (Ask AI Follow-up)</span>
                  </div>

                  <form onSubmit={handleAskQuestion} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder={placeholders[placeholderIndex] || "क्या आप बेस्ट इमेज जनरेशन टूल जानना चाहेंगे?"}
                      className="flex-1 px-4 py-3 bg-white border border-orange-200 rounded-xl text-xs sm:text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                    />
                    <button
                      type="submit"
                      disabled={isAskingQuestion || !userQuestion.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isAskingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Ask AI</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">सुझाव (Suggestions):</span>
                    {placeholders.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUserQuestion(q)}
                        className="text-[11px] px-3 py-1 bg-white hover:bg-orange-100 text-orange-800 rounded-lg border border-orange-200 font-medium transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {questionAnswer && (
                    <div className="mt-4 p-5 bg-white border border-orange-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                        <span className="text-xs font-extrabold text-orange-600">AI Answer (उत्तर):</span>
                        <button
                          type="button"
                          onClick={() => setQuestionAnswer(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="prose prose-slate max-w-none text-black text-sm leading-relaxed font-medium">
                        <div dangerouslySetInnerHTML={{ __html: questionAnswer }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* WordPress HTML Content Renderer */}
                <ArticleContent content={post.content} />

                {/* Author Box */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-orange-50/60 to-amber-50/30 rounded-2xl border border-orange-200/60 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 shrink-0 shadow-md border border-orange-200 relative">
                      <Image
                        src="/author.png"
                        alt={post.author || 'Anwar'}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h3 className="font-extrabold text-black text-lg">{post.author || 'Anwar'}</h3>
                        <span className="text-xs px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold inline-block w-fit mx-auto sm:mx-0">
                          AI Tools Analyst
                        </span>
                      </div>
                      <p className="text-black text-sm font-medium leading-relaxed">
                        Anwar is the founder and lead editor at aitoolhindi.online. Dedicated to making artificial intelligence, prompt engineering, and cutting-edge tech simple and practical in Hindi for millions across India. He has analysed over 1000+ AI tools till date.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Right Sidebar (Desktop aside tag containing 6 related articles) */}
          <aside className="md:col-span-4 space-y-6 w-full">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-black text-base border-b border-slate-100 pb-3">
                Related Articles
              </h3>
              <div className="space-y-3.5">
                {posts
                  .filter(p => p.id !== post.id && p.status !== 'draft')
                  .slice(0, 6)
                  .map((p) => (
                    <Link
                      key={p.id}
                      href={`/${p.slug}`}
                      className="flex items-center gap-3 group bg-slate-50 hover:bg-orange-50/50 p-2.5 rounded-2xl border border-slate-100 transition-all"
                    >
                      <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        <BlogImage
                          src={p.image}
                          alt={p.imageAlt || p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="text-[10px] text-orange-600 font-bold truncate">{p.category}</div>
                        <h4 className="font-bold text-black text-xs group-hover:text-orange-600 transition-colors line-clamp-2">
                          {p.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
