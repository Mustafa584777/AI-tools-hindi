import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us – Aitoolhindi.online',
  description: 'Get in touch with Aitoolhindi.online team for any questions, feedback, or inquiries.',
  alternates: {
    canonical: 'https://aitoolhindi.online/contact-us',
  },
};

export default function ContactUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Contact Us</h1>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            We would love to hear from you! If you have any questions, feedback, or inquiries, please don’t hesitate to get in touch with us. Our team is here to assist you.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Support</h2>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Email</strong>: Shoot us an email at <a href="mailto:support@aitoolhindi.online" className="text-orange-600 underline font-bold hover:text-orange-700">support@aitoolhindi.online</a>. We strive to respond to all inquiries within 24 hours.
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
