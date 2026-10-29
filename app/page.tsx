'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromDisk, getStoredBlogPostsSync } from '@/lib/publicPosts';
import { BlogPost } from '@/lib/types';
import { resolveDisplayImageUrl } from '@/lib/utils';
import BlogImage from '@/components/BlogImage';

export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    return getStoredBlogPostsSync().filter(p => p.status !== 'draft');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(() => {
    return getStoredBlogPostsSync().filter(p => p.status !== 'draft').length === 0;
  });

  useEffect(() => {
    async function loadPosts() {
      try {
        const diskPosts = await fetchBlogPostsFromDisk();
        setPosts(diskPosts.filter(p => p.status !== 'draft'));
      } catch {
        setPosts(getStoredBlogPostsSync().filter(p => p.status !== 'draft'));
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Hero Section focused on Hindi AI Tutorials */}
        <section className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>लेटेस्ट आर्टिफिशियल इंटेलिजेंस और AI टूल्स गाइड</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
              भारत का नंबर 1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100">Hindi AI Tutorial</span> ब्लॉग
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium px-2">
              ChatGPT, Gemini, Midjourney और अन्य एडवांस AI टूल्स को हिंदी में स्टेप-बाय-स्टेप सीखें।
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-4 px-2 sm:px-0">
              <div className="relative flex items-center shadow-2xl rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-2">
                <Search className="w-5 h-5 text-white/80 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="हिंदी AI ट्यूटोरियल या ब्लॉग आर्टिकल खोजें..."
                  className="w-full bg-transparent px-4 py-3 text-white placeholder-white/75 text-sm sm:text-base focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto text-center border-t border-white/20 mt-12">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">100%</div>
                <div className="text-xs text-white/90 mt-1 font-medium">हिंदी भाषा में</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">1000+</div>
                <div className="text-xs text-white/90 mt-1 font-medium">AI Tools Analysed</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">24-Hr</div>
                <div className="text-xs text-white/90 mt-1 font-medium">Fast & Optimized</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">Expert</div>
                <div className="text-xs text-white/90 mt-1 font-medium">Anwar&apos;s Guides</div>
              </div>
            </div>
          </div>
        </section>

        {/* Informational Blog / AI Tutorials Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">लेटेस्ट हिंदी AI ट्यूटोरियल और गाइड्स</h2>
              <p className="text-black text-sm mt-1 font-medium">आर्टिफिशियल इंटेलिजेंस और प्रॉम्प्ट इंजीनियरिंग की संपूर्ण जानकारी</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-black font-medium">Loading tutorials...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-48 relative w-full bg-slate-200">
                    <BlogImage
                      src={post.image}
                      alt={post.imageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-black/75 font-medium">
                        <span className="font-semibold text-orange-600">
                          {post.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{post.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="font-bold text-black text-lg group-hover:text-orange-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-black text-sm leading-relaxed line-clamp-2 font-medium">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>ट्यूटोरियल पढ़ें (Read Tutorial)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
