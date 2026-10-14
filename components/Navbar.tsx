'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Home, BookOpen, Database } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Logo only (No title text per requirement) */}
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
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black">
          <Link href="/" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0">Home</Link>
          <Link href="/blog" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0">Tutorials & Blog</Link>
          <Link href="/admin-panel" className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 font-semibold">Admin Panel</Link>
        </nav>

        {/* Navigation Toggle Menu in place of Manage Tutorials */}
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

      {/* Mobile Dropdown / Toggle Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-black hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <Home className="w-4 h-4 text-orange-600" />
            <span>Home (होमपेज)</span>
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-black hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span>Tutorials & Blog (ब्लॉग)</span>
          </Link>
          <Link
            href="/admin-panel"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-black hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <Database className="w-4 h-4 text-orange-600" />
            <span>Admin Panel (एडमिन पैनल)</span>
          </Link>
        </div>
      )}
    </header>
  );
}
