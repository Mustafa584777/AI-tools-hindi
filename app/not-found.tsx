import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-black">Page Not Found (404)</h1>
        <p className="text-black font-medium">The page you are looking for does not exist or has been moved.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm">
          Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
