import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">Disclaimer</h1>
        <p className="text-sm font-medium leading-relaxed">
          The information provided on Aitoolhindi.online is for general informational and educational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind regarding its accuracy or completeness.
        </p>
      </main>
      <Footer />
    </>
  );
}
