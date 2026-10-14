import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FactCheckingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Fact-Checking Policy (तथ्य-जांच नीति)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> पर प्रकाशित प्रत्येक AI ट्यूटोरियल, गाइड और तकनीकी समाचार कठोर तथ्य-जांच (Fact-Checking) प्रक्रिया से गुजरते हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">हमारी प्रक्रिया</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>प्राथमिक स्रोतों (Official Documentation & AI Providers) से सीधे सत्यापन।</li>
            <li>विशेषज्ञों द्वारा समीक्षा।</li>
            <li>भ्रामक या अप्रमाणित दावों से पूर्ण परहेज।</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
