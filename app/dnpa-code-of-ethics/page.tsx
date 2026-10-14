import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DnpaCodeOfEthicsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">DNPA Code of Ethics (आचार संहिता)</h1>
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-4 text-base">
          <p>
            <strong>Aitoolhindi.online</strong> डिजिटल न्यूज पब्लिशर्स एसोसिएशन (DNPA) और डिजिटल मीडिया एथिक्स के सिद्धांतों और दिशा-निर्देशों का पूर्ण पालन करने के लिए प्रतिबद्ध है।
          </p>
          <h2 className="text-xl font-bold text-black pt-4">हमारे नैतिक मानक</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>पत्रकारिता की निष्पक्षता, सत्यता और सटीकता।</li>
            <li>तथ्यों की सटीकता और पारदर्शिता।</li>
            <li>पाठकों के अधिकारों और गोपनीयता का सम्मान।</li>
            <li>गलतियों के लिए त्वरित सुधार नीति का पालन।</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
