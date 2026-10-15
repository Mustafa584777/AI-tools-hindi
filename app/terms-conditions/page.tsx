import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Terms & Conditions (नियम एवं शर्तें)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> की वेबसाइट का उपयोग करने से आप निम्नलिखित नियमों और शर्तों से बंधे होने की सहमति देते हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">1. बौद्धिक संपदा अधिकार</h2>
          <p>
            इस वेबसाइट पर प्रकाशित सभी लेख, लोगो, ग्राफिक्स और ट्यूटोरियल हमारी संपत्ति हैं। बिना अनुमति के इनकी पुनरुत्पादकता प्रतिबंधित है।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">2. उपयोगकर्ता आचरण</h2>
          <p>
            आप वेबसाइट का उपयोग किसी भी गैर-कानूनी या हानिकारक गतिविधि के लिए नहीं करेंगे।
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
