'use client';

import Link from 'next/link';
import { Sparkles, FileText, Database } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-black tracking-tight whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <span className="font-extrabold text-sm">हिं</span>
          </div>
          <span>Aitoolhindi<span className="text-orange-600">.online</span></span>
        </Link>

        {/* Navigation Links (Tutorials & Blog focused) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black">
          <Link href="/" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0">Home</Link>
          <Link href="/blog" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0">Tutorials & Blog</Link>
          <Link href="/admin-panel" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 font-semibold">Admin Panel</Link>
        </nav>

        {/* Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/admin-panel" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm whitespace-nowrap shrink-0">
            <Database className="w-4 h-4" />
            <span>Manage Tutorials</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
