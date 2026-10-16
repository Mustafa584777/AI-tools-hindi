import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Privacy Policy (गोपनीयता नीति)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> पर आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह गोपनीयता नीति दस्तावेज़ बताती है कि हम किस प्रकार की व्यक्तिगत जानकारी एकत्र करते हैं और उसका उपयोग कैसे करते हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">1. Information We Collect (हम जो जानकारी एकत्र करते हैं)</h2>
          <p>
            हम कुकीज़, लॉग फ़ाइलों और वेब एनालिटिक्स के माध्यम से बुनियादी विज़िटर डेटा एकत्र कर सकते हैं, जैसे ब्राउज़र का प्रकार, आईपी पता और देखे गए पृष्ठ, ताकि वेबसाइट के अनुभव को बेहतर बनाया जा सके।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">2. Cookies (कुकीज़)</h2>
          <p>
            हमारी वेबसाइट विज़िटर्स की प्राथमिकताओं को संग्रहीत करने और विज्ञापनों को अनुकूलित करने के लिए कुकीज़ का उपयोग करती है। Google Adsense या अन्य थर्ड-पार्टी वेंडर विज्ञापनों को दिखाने के लिए कुकीज़ का उपयोग कर सकते हैं।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">3. Third Party Policies</h2>
          <p>
            हमारी गोपनीयता नीति अन्य विज्ञापनों या वेबसाइटों पर लागू नहीं होती है। इसलिए, अधिक विस्तृत जानकारी के लिए संबंधित तृतीय-पक्ष विज्ञापन सर्वरों की नीतियों की जाँच करने की सलाह दी जाती है।
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
