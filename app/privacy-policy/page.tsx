import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Aitoolhindi.online',
  description: 'Privacy Policy for Aitoolhindi.online. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: 'https://aitoolhindi.online/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-500 font-medium">Last updated: October 2026</p>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            This Privacy Policy outlines how aitoolhindi.online collects, uses, and protects the personal information you provide while using our website. We are committed to ensuring the privacy and security of your personal information. By using aitoolhindi.online, you agree to the terms and practices described in this policy.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Information We Collect</h2>
          <p>
            When you visit aitoolhindi.online, we may collect certain personally identifiable information, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Name</strong>: We may collect your name when you voluntarily provide it, such as when submitting comments or contacting us through our website.</li>
            <li><strong>Email Address</strong>: We may collect your email address when you subscribe to our newsletter or contact us through our website.</li>
            <li><strong>IP Address</strong>: We automatically collect your IP address and related information, such as your approximate location, for analytical and security purposes.</li>
            <li><strong>Cookies</strong>: We use cookies to enhance your browsing experience and track usage information. You can control and manage cookies through your browser settings.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Use of Information</h2>
          <p>
            The information we collect is used for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and personalize our services to you.</li>
            <li>To communicate with you, respond to your inquiries, and provide customer support.</li>
            <li>To send you newsletters, updates, and promotional materials if you have subscribed to our mailing list.</li>
            <li>To analyze website usage and improve our content and services.</li>
            <li>To prevent fraud, protect the security of our website, and comply with legal obligations.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or transfer your personally identifiable information to third parties without your consent, except in the following cases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers</strong>: We may engage trusted third-party service providers to assist us in operating our website and providing services to you. These providers have access to your personal information only to perform specific tasks on our behalf and are obligated to maintain its confidentiality.</li>
            <li><strong>Legal Requirements</strong>: We may disclose your personal information if required by law or in response to valid legal processes, such as a court order or government request.</li>
            <li><strong>Consent</strong>: We may share your information with your consent or as otherwise disclosed at the time of collection.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Security</h2>
          <p>
            We take reasonable measures to protect the security of your personal information and prevent unauthorized access, disclosure, or alteration. However, please note that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Your Rights</h2>
          <p>
            You have the right to access, update, correct, and delete your personal information. You may also unsubscribe from our mailing list or opt-out of receiving promotional communications at any time. To exercise these rights or for any privacy-related inquiries, please contact us using the information provided below.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Changes to This Privacy Policy</h2>
          <p>
            We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with a revised “Last Updated” date. We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please <Link href="/contact-us" className="text-orange-600 underline font-bold hover:text-orange-700">contact us</Link> at:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email</strong>: <a href="mailto:support@aitoolhindi.online" className="text-orange-600 underline font-bold hover:text-orange-700">support@aitoolhindi.online</a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
