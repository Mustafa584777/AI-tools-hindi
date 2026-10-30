'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Home, Folder } from 'lucide-react';
import { getStoredBlogPostsSync } from '@/lib/storage';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories] = useState<string[]>(() => {
    try {
      const posts = getStoredBlogPostsSync();
      const derived = Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[];
      return Array.from(new Set(['AI Guides', 'Image Tutorials', 'Video Tutorials', 'ChatGPT Guides', ...derived]));
    } catch {
      return ['AI Guides', 'Image Tutorials', 'Video Tutorials', 'ChatGPT Guides'];
    }
  });

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-md shadow-orange-500/20 bg-orange-100">
            <Image
              src="/logo.png"
              alt="Aitoolhindi Logo"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">AI Tool Hindi</span>
        </Link>

        {/* Desktop Navigation Links - Only Homepage */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black">
          <Link href="/" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0">Home</Link>
        </nav>

        {/* Navigation Toggle Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-black hover:bg-slate-200 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>Homepage</span>
          </Link>
        </div>
      </div>

      {/* Mobile Dropdown / Toggle Menu - Home + All Categories in English */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-2 shadow-lg max-h-[75vh] overflow-y-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-black hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <Home className="w-4 h-4 text-orange-600" />
            <span>Home</span>
          </Link>

          <div className="pt-2 pb-1 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Categories
          </div>

          {categories.map((cat) => {
            const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return (
              <Link
                key={cat}
                href={`/${catSlug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-slate-800 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Folder className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{cat}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
