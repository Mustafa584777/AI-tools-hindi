import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FactCheckingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">Fact-Checking Policy</h1>
        <p className="text-sm font-medium leading-relaxed">
          We verify all technical claims, tool features, and tutorial steps thoroughly before publishing content on Aitoolhindi.online to ensure reliable information for our readers.
        </p>
      </main>
      <Footer />
    </>
  );
}
