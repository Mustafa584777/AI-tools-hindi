import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight">
            <div className="w-9 h-9 relative rounded-xl overflow-hidden bg-orange-100 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span>Aitoolhindi.online</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            भारत का नंबर 1 हिंदी AI ट्यूटोरियल और ब्लॉग पोर्टल।
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Quick Links</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Policies & Legal</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            <li><Link href="/correction-policy" className="hover:text-white transition-colors">Correction Policy</Link></li>
            <li><Link href="/fact-checking-policy" className="hover:text-white transition-colors">Fact-Checking Policy</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Ethics & Compliance</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/dmca-policy" className="hover:text-white transition-colors">DMCA Policy</Link></li>
            <li><Link href="/dnpa-code-of-ethics" className="hover:text-white transition-colors">DNPA Code of Ethics</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Aitoolhindi.online. All rights reserved.
      </div>
    </footer>
  );
}
