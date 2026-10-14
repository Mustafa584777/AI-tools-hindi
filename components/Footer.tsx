import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white">
              <span className="text-xs font-bold">हिं</span>
            </div>
            <span>Aitoolhindi.online</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            भारत का नंबर 1 हिंदी AI ट्यूटोरियल और ब्लॉग पोर्टल। WordPress से Next.js पर माइग्रेटेड और Firebase से कनेक्टेड।
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Quick Links</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/blog" className="hover:text-white transition-colors">Informational Blog & Tutorials</Link></li>
            <li><Link href="/admin-panel" className="hover:text-white transition-colors">Admin Panel (CRUD)</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">SEO & Migration</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All original WordPress tutorial URLs are preserved 100% to protect search engine rankings and organic traffic.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Aitoolhindi.online. All rights reserved. Powered by Next.js & Firebase.
      </div>
    </footer>
  );
}
