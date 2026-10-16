'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, MapPin, Send } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-black">Contact Us (संपर्क करें)</h1>
          <p className="text-black font-medium text-base">
            यदि आपके पास कोई प्रश्न, सुझाव, फीडबैक या विज्ञापन (Advertising/Guest Post) से संबंधित पूछताछ है, तो आप हमसे संपर्क कर सकते हैं।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-black">Get in Touch</h3>
            <div className="space-y-4 text-sm text-black font-medium">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-600 shrink-0" />
                <span>support@aitoolhindi.online</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-600 shrink-0" />
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-black">Send a Message</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('संदेश सफलतापूर्वक भेज दिया गया है! हम जल्द ही आपसे संपर्क करेंगे।'); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">आपका नाम (Your Name)</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-orange-600/20" placeholder="नाम लिखें..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">ईमेल (Email Address)</label>
                <input type="email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-orange-600/20" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">संदेश (Message)</label>
                <textarea rows={4} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-orange-600/20" placeholder="अपना संदेश यहाँ लिखें..."></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
