import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">Terms & Conditions</h1>
        <p className="text-sm font-medium leading-relaxed">
          By accessing Aitoolhindi.online, you agree to comply with and be bound by these terms and conditions of use.
        </p>
      </main>
      <Footer />
    </>
  );
}
