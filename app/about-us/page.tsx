import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">About Us</h1>
        <p className="text-sm font-medium leading-relaxed">
          Welcome to Aitoolhindi.online, your premier destination for artificial intelligence tutorials, guides, and insights in Hindi. Our mission is to empower creators, students, and professionals across India with accessible knowledge about cutting-edge AI technologies.
        </p>
        <p className="text-sm font-medium leading-relaxed">
          We curate and write comprehensive informational tutorials to help you master ChatGPT, Midjourney, and other top AI tools with ease.
        </p>
      </main>
      <Footer />
    </>
  );
}
