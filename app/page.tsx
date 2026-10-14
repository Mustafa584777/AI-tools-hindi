'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromFirestore, getStoredBlogPostsSync } from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const firestorePosts = await fetchBlogPostsFromFirestore();
        setPosts(firestorePosts.filter(p => p.status !== 'draft'));
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
        {/* Hero Section focused on Tutorials & Traffic */}
        <section className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>WordPress से Next.js + Firebase पर माइग्रेटेड</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
              भारत का नंबर 1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100">Hindi AI Tutorial</span> ब्लॉग
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium px-2">
              सटीक URL और SEO सुरक्षा के साथ सभी हिंदी AI आर्टिकल्स और ट्यूटोरियल।
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-4 px-2 sm:px-0">
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center shadow-2xl rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 gap-2 sm:gap-0">
                <div className="flex items-center flex-1">
                  <Search className="w-5 h-5 text-white/80 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="हिंदी ट्यूटोरियल या ब्लॉग आर्टिकल खोजें..."
                    className="w-full bg-transparent px-3 py-2 sm:py-3 text-white placeholder-white/75 text-sm sm:text-base focus:outline-none font-medium"
                  />
                </div>
                <Link
                  href="/admin-panel"
                  className="px-5 py-2.5 sm:py-3 bg-white text-black font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-colors text-center shrink-0 shadow-lg text-xs sm:text-sm"
                >
                  Admin Panel
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto text-center border-t border-white/20 mt-12">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">100%</div>
                <div className="text-xs text-white/90 mt-1 font-medium">URL SEO Retained</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">Firebase</div>
                <div className="text-xs text-white/90 mt-1 font-medium">Cloud Database</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">24-Hr</div>
                <div className="text-xs text-white/90 mt-1 font-medium">Cached & Fast</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">Active</div>
                <div className="text-xs text-white/90 mt-1 font-medium">Admin Panel</div>
              </div>
            </div>
          </div>
        </section>

        {/* Informational Blog / WordPress Posts Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Informational AI Tutorials & Blog</h2>
              <p className="text-black text-sm mt-1 font-medium">आपके सभी ट्रैफिक-ड्राइविंग हिंदी आर्टिकल्स और गाइड्स</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-black font-medium">Loading tutorials from Firebase Firestore...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-48 relative w-full bg-slate-200">
                    <Image
                      src={post.image}
                      alt={post.imageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-black/75 font-medium">
                        <Link 
                          href={`/${post.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-orange-600 underline font-semibold"
                        >
                          {post.category}
                        </Link>
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
                      <span>Read Tutorial (/{post.slug})</span>
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
