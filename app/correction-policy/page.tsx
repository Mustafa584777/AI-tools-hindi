import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CorrectionPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">Correction Policy</h1>
        <p className="text-sm font-medium leading-relaxed">
          At Aitoolhindi.online, we are committed to accuracy and transparency in all our informational tutorials and articles. If we find an error or if a reader points out an inaccuracy, we promptly review and correct the content.
        </p>
        <p className="text-sm font-medium leading-relaxed">
          To report a correction, please email us at contact@aitoolhindi.online with details of the article and the suggested correction.
        </p>
      </main>
      <Footer />
    </>
  );
}
