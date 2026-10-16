import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Contact Us</h1>
        <p className="text-black text-sm leading-relaxed font-medium">
          Get in touch with the team at Aitoolhindi.online. Whether you have questions about AI tools, tutorials, partnerships, or feedback, we would love to hear from you.
        </p>
        <div className="space-y-4 text-black text-sm font-medium">
          <p><strong>Email us at:</strong> contact@aitoolhindi.online</p>
          <p><strong>Response Time:</strong> Within 24-48 business hours.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
