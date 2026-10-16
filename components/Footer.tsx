import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-2">
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
          <h4 className="text-white font-semibold text-sm">Policies & Legal</h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            <li><Link href="/correction-policy" className="hover:text-white transition-colors">Correction Policy</Link></li>
            <li><Link href="/fact-checking-policy" className="hover:text-white transition-colors">Fact-Checking Policy</Link></li>
            <li><Link href="/dmca-policy" className="hover:text-white transition-colors">DMCA Policy</Link></li>
            <li><Link href="/dnpa-code-of-ethics" className="hover:text-white transition-colors">DNPA Code of Ethics</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Aitoolhindi.online. All rights reserved. Powered by Next.js & Firebase.
      </div>
    </footer>
  );
}
