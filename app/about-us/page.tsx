import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us – Aitoolhindi.online | India #1 Hindi AI Tutorials',
  description: 'Learn about Aitoolhindi.online – India #1 Hindi AI tutorial site. Master ChatGPT, Gemini, AI image generation, prompt engineering, and more in simple Hindi.',
  alternates: {
    canonical: 'https://aitoolhindi.online/about-us',
  },
};

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">About Us (हमारे बारे में)</h1>
        
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            <strong>Welcome to aitoolhindi.online! India&apos;s #1 Hindi AI Tutorials site.</strong>
          </p>
          
          <p>
            <strong>aitoolhindi.online</strong> वो जगह है जहाँ <strong>AI सीखना हिंदी में आसान, मज़ेदार और पूरी तरह प्रैक्टिकल</strong> बन जाता है।
          </p>

          <p>
            हमारा एकमात्र लक्ष्य है कि <strong>हर हिंदी भाषी व्यक्ति को AI का असली हुनर सिखाना</strong>, चाहे आप छात्र हों, नौकरीपेशा हों, फ्रीलांसर हों, यूट्यूबर हों, छोटे बिजनेस के मालिक हों या बस उत्सुक हों कि ये AI क्या कर सकता है।
          </p>

          <p>
            <strong>हम सिर्फ AI टूल्स की लिस्ट नहीं देते।</strong><br />
            हम <strong>स्टेप-बाय-स्टेप हिंदी ट्यूटोरियल्स</strong> बनाते हैं —
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>ChatGPT से लेकर Gemini, Grok, Claude तक</li>
            <li>इमेज जनरेशन, वीडियो एडिटिंग, कंटेंट क्रिएशन</li>
            <li>प्रॉम्प्ट इंजीनियरिंग, ऑटोमेशन, AI बिजनेस आइडियाज</li>
            <li>फ्री टूल्स से लेकर पावरफुल एडवांस्ड तकनीकें</li>
          </ul>

          <p>
            सब कुछ सरल हिंदी में, स्क्रीनशॉट्स, वीडियो गाइड्स और रियल-लाइफ examples के साथ, ताकि आप पढ़ते ही <strong>अप्लाई</strong> कर सकें और <strong>रिजल्ट</strong> देख सकें।
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">हमारा मिशन</h2>
          <p>
            AI को कोई जादू या इंग्लिश की किताब नहीं बनने देना। हम चाहते हैं कि भारत का हर कोना, गाँव हो या शहर, AI का फायदा उठाए।
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>समय बचाएँ</li>
            <li>कमाई के नए रास्ते खोलें</li>
            <li>क्रिएटिविटी को नई उड़ान दें</li>
            <li>9-5 की जिंदगी से आगे बढ़ें</li>
          </ul>

          <p>
            हम एक छोटी लेकिन जुनूनी टीम हैं जो हर हफ्ते नए, रिसर्च-बेस्ड और 100% हिंदी में ट्यूटोरियल्स लाने के लिए दिन-रात मेहनत करते हैं। हमारा मानना है कि <strong>सही गाइडेंस</strong> से कोई भी 30 दिनों में AI का अच्छा यूजर बन सकता है।
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">आप हमारे साथ क्यों जुड़ें?</h2>
          <p>
            क्योंकि यहाँ मिलता है:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>सबसे आसान हिंदी में AI tutorials</li>
            <li>फ्री और पेड दोनों तरह के टूल्स के प्रैक्टिकल ट्यूटोरियल</li>
            <li>कोई जटिल इंग्लिश टर्म नहीं, बस सीधा काम का ज्ञान</li>
            <li>Self tested practical use cases: हमारी टीम हर टूल को खुद टेस्ट और analyse करती है</li>
          </ul>

          <p>
            हमारे about us page को अपना कीमती समय देने के लिए आपका <strong>धन्यवाद!</strong>
          </p>

          <p>
            If you have any questions or suggests please <Link href="/contact-us" className="text-orange-600 underline font-bold hover:text-orange-700">contact us</Link> or shoot an email at:
          </p>

          <p>
            <strong>Email</strong>: <a href="mailto:support@aitoolhindi.online" className="text-orange-600 underline font-bold hover:text-orange-700">support@aitoolhindi.online</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
