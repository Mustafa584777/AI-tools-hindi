'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchBlogPostsFromFirestore, getStoredBlogPostsSync } from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export default function BlogIndexPage() {
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

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5 text-orange-600" />
            <span>WordPress Blog & Tutorials Migration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
            Informational AI Blog & Tutorials (हिंदी)
          </h1>
          <p className="text-black text-base max-w-2xl font-medium">
            सभी वर्डप्रेस ब्लॉग आर्टिकल्स और ट्यूटोरियल, जिन्हें Next.js + Firebase पर बिना किसी SEO हानि के सटीक URLs के साथ रीक्रिएट किया गया है।
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ब्लॉग ट्यूटोरियल खोजें..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-black text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
          />
        </div>

        {/* Posts Grid */}
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
                      <span>{post.category}</span>
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
                    <span>Read Exact WP URL (/{post.slug})</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
