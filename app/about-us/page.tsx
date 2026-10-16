import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">About Us (हमारे बारे में)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4">
          <p>
            <strong>Aitoolhindi.online</strong> भारत का प्रमुख और नंबर 1 हिंदी AI ट्यूटोरियल व टूल्स पोर्टल है। हमारा उद्देश्य आर्टिफिशियल इंटेलिजेंस (AI) की इस क्रांतिकारी तकनीक को भारत के हर कोने तक, हिंदी भाषा में आसान तरीके से पहुँचाना है।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">हमारा मिशन</h2>
          <p>
            AI टूल्स, प्रॉम्प्ट इंजीनियरिंग, जेनरेटिव AI और मशीन लर्निंग से जुड़ी हर जानकारी को हिंदी भाषी पाठकों, स्टूडेंट्स, क्रिएटर्स और प्रोफेशनल्स के लिए सरल, स्पष्ट और उपयोगी बनाना।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">आपको यहाँ क्या मिलेगा?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>नवीनतम AI टूल्स की समीक्षा और उपयोग गाइड</li>
            <li>स्टेप-बाय-स्टेप हिंदी ट्यूटोरियल</li>
            <li>ChatGPT, Midjourney, Claude और अन्य AI मॉडल्स के उपयोग के तरीके</li>
            <li>करियर और प्रोडक्टिविटी बढ़ाने के लिए AI टिप्स</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
