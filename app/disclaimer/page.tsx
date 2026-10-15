import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Disclaimer (अस्वीकरण)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> पर दी गई सभी जानकारी केवल सामान्य सूचना और शैक्षिक उद्देश्यों के लिए है।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">AI टूल्स और परिणाम</h2>
          <p>
            चूंकि AI तकनीक लगातार बदलती रहती है, हम इस वेबसाइट पर दी गई जानकारी की पूर्णता, विश्वसनीयता या सटीकता की कोई गारंटी नहीं देते हैं। किसी भी AI टूल के व्यावसायिक उपयोग से पहले उसकी आधिकारिक शर्तों की जांच अवश्य करें।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">बाहरी लिंक (External Links)</h2>
          <p>
            हमारी वेबसाइट पर अन्य बाहरी वेबसाइटों के लिंक हो सकते हैं। उन साइटों की सामग्री या गोपनीयता नीतियों के लिए हम जिम्मेदार नहीं हैं।
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
