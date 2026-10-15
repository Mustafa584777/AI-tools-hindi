import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CorrectionPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Correction Policy (सुधार नीति)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> पर हम अपने सभी लेखों, ट्यूटोरियल्स और AI टूल्स गाइड में उच्च स्तर की सटीकता और प्रामाणिकता बनाए रखने के लिए प्रतिबद्ध हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">गलती की सूचना कैसे दें?</h2>
          <p>
            यदि आपको हमारे किसी भी आर्टिकल या जानकारी में कोई तथ्यात्मक त्रुटि मिलती है, तो आप तुरंत हमारे ईमेल <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-black">support@aitoolhindi.online</code> पर संपर्क कर सकते हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">सुधार प्रक्रिया</h2>
          <p>
            सूचना मिलने पर हमारी संपादकीय टीम तुरंत उसकी जांच करती है और आवश्यक सुधार करके लेख के अंत में स्पष्ट रूप से अपडेट नोट जोड़ती है।
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
