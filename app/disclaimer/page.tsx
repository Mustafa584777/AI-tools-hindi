import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer – Aitoolhindi.online',
  description: 'Disclaimer and terms of use for Aitoolhindi.online. Read about accuracy of information, editorial control, external links, and limitation of liability.',
  alternates: {
    canonical: 'https://aitoolhindi.online/disclaimer',
  },
};

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Disclaimer</h1>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            The information provided on aitoolhindi.online is for general informational purposes only. While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, <Link href="/correction-policy" className="text-orange-600 underline font-bold hover:text-orange-700">accuracy</Link>, reliability, suitability, or availability of the information contained on our website or related graphics.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Accuracy of Information</h2>
          <p>
            The content on aitoolhindi.online is based on the author’s research, opinions, and personal experiences. It may not always reflect the most current news or developments. We do our best to ensure the accuracy of the information provided, but we cannot guarantee that all information is entirely accurate, complete, or current. Any reliance you place on the information provided on our website is strictly at your own risk.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Editorial Control</h2>
          <p>
            aitoolhindi.online is a <strong>AI tools store and news blog</strong> where our team of writers and editors curate and publish articles on various topics related to AI Tools. The opinions expressed in the articles belong to the respective authors and do not necessarily reflect the views of aitoolhindi.online. We strive to maintain editorial integrity and provide a platform for diverse perspectives.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">External Links</h2>
          <p>
            aitoolhindi.online may contain links to external websites or resources. These links are provided for convenience and informational purposes. We have no control over the content, nature, or availability of those external sites. The inclusion of any links does not necessarily imply a recommendation or endorsement of the views expressed within them.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Advertisement and Sponsored Content</h2>
          <p>
            aitoolhindi.online may display advertisements or sponsored content. The presence of such content does not constitute an endorsement or recommendation by aitoolhindi.online. We are not responsible for the accuracy, legality, or content of any external advertisements or sponsored materials.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Always Seek Professional Advice</h2>
          <p>
            The information provided on aitoolhindi.online is not intended to be a substitute for professional advice. It is essential to seek the advice of qualified professionals regarding any specific issue or concern. Reliance on any information provided on this website is solely at your own risk.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Limitation of Liability</h2>
          <p>
            In no event shall aitoolhindi.online or its owners, employees, or affiliates be liable for any direct, indirect, incidental, consequential, or special damages arising out of or in connection with the use of our website, the information provided, or the inability to use the website.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">User-Generated Content Clause</h2>
          <p>
            aitoolhindi.online is not responsible for opinions shared in user comments, but reserves the right to moderate for abuse, misinformation, or violation of policy.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Changes to the Disclaimer</h2>
          <p>
            We reserve the right to modify or update this Disclaimer at any time without prior notice. By using aitoolhindi.online, you agree to be bound by the current version of the Disclaimer.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Contact Us</h2>
          <p>
            If you have any questions or concerns regarding this Disclaimer or our website, please contact us at:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email</strong>: <a href="mailto:support@aitoolhindi.online" className="text-orange-600 underline font-bold hover:text-orange-700">support@aitoolhindi.online</a></li>
          </ul>

          <p>
            Effective Date: December 1, 2025
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
