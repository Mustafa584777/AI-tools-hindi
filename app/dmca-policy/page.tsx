import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DmcaPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">DMCA Policy (कॉपीराइट नीति)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> बौद्धिक संपदा अधिकारों का सम्मान करता है और उम्मीद करता है कि हमारे उपयोगकर्ता भी ऐसा ही करेंगे।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">कॉपीराइट उल्लंघन की सूचना</h2>
          <p>
            यदि आपको लगता है कि आपकी कॉपीराइट की गई सामग्री का उल्लंघन इस वेबसाइट पर किया गया है, तो कृपया निम्नलिखित विवरण के साथ हमें <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-black">support@aitoolhindi.online</code> पर सूचित करें:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>कॉपीराइट कार्य का प्रमाण या विवरण</li>
            <li>उल्लंघन करने वाली सामग्री का सटीक URL</li>
            <li>आपका संपर्क विवरण (नाम, ईमेल, फोन नंबर)</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
