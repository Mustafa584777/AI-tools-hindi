'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, User, Share2, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromFirestore, getStoredBlogPostsSync } from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPost() {
      try {
        const posts = await fetchBlogPostsFromFirestore();
        const found = posts.find(p => p.slug === slug);
        if (found) setPost(found);
      } catch {
        const posts = getStoredBlogPostsSync();
        const found = posts.find(p => p.slug === slug);
        if (found) setPost(found);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center text-black font-medium">
          Loading tutorial from Firebase Firestore...
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold text-black">Tutorial Not Found (404)</h1>
          <p className="text-black font-medium">This exact WordPress URL slug does not exist or was deleted.</p>
          <Link href="/blog" className="inline-block px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm">
            Back to Tutorials
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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog Tutorials</span>
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
              <span className="px-3.5 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-full">
                {post.category}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
                {post.title}
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            {/* Metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs text-black font-medium">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 font-bold text-black">
                  <User className="w-4 h-4 text-orange-600" />
                  {post.author}
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

            {/* WordPress HTML Content Renderer */}
            <div 
              className="prose prose-slate max-w-none text-black leading-relaxed space-y-4 text-base md:text-lg font-medium [&>h1]:text-2xl [&>h1]:md:text-3xl [&>h1]:font-extrabold [&>h1]:text-black [&>h1]:pt-4 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-black [&>h2]:pt-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-black [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-4 [&>blockquote]:bg-orange-50/50 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* WordPress URL preservation note */}
            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 text-xs text-black font-medium mt-12">
              <Sparkles className="w-6 h-6 text-orange-600 shrink-0" />
              <div>
                <span className="font-bold text-black">WordPress SEO & Firebase Note:</span> This tutorial is served at its exact original WordPress slug (<code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-black font-bold">/{post.slug}</code>) and synced with Firebase Firestore.
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
