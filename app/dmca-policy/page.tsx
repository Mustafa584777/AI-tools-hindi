import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DmcaPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">DMCA Policy</h1>
        <p className="text-sm font-medium leading-relaxed">
          Aitoolhindi.online respects the intellectual property rights of others. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please contact us with relevant details for immediate removal.
        </p>
      </main>
      <Footer />
    </>
  );
}
