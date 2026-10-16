import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DnpaEthicsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">DNPA Code of Ethics</h1>
        <p className="text-sm font-medium leading-relaxed">
          Aitoolhindi.online adheres to high standards of journalistic ethics, integrity, and transparency in digital publishing as guided by industry best practices.
        </p>
      </main>
      <Footer />
    </>
  );
}
