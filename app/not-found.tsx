import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-black">404 - Page Not Found</h1>
        <p className="text-black font-medium text-lg">
          The page you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-sm hover:bg-orange-700 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
