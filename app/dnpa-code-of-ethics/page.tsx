import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DNPA Code of Ethics – Aitoolhindi.online',
  description: 'DNPA Code of Ethics and editorial standards for Aitoolhindi.online.',
  alternates: {
    canonical: 'https://aitoolhindi.online/dnpa-code-of-ethics',
  },
};

export default function DnpaCodeOfEthicsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">DNPA Code of Ethics</h1>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            <strong>Purpose:</strong> At aitoolhindi.online, we uphold the highest ethical standards in all aspects of our operations. This policy is designed to ensure that every member of our team conducts themselves with integrity, adhering to all relevant laws and regulations, and avoiding any actions motivated by personal gain.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Gifts, Favors, and Payments:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Gifts, favors, and payments provided by aitoolhindi.online must align with accepted business practices, be of limited value, comply with the law, and avoid embarrassing the company upon public disclosure.</li>
            <li>Any payments, commissions, or compensation to associates of customers without a written contract are against company <Link href="/privacy-policy" className="text-orange-600 underline font-bold hover:text-orange-700">policy</Link>.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Gifts, Favors, Entertainment, and Payments Received:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Associates must not seek or accept gifts, favors, entertainment, or payments without a legitimate business purpose, especially from entities doing or seeking to do business with aitoolhindi.online.</li>
            <li>Exceptions include common courtesies associated with business practices and gifts of small value. However, strict standards apply, especially regarding gifts from suppliers.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Conflicts of Interest:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Associates should avoid situations where personal interests conflict with those of aitoolhindi.online, promptly disclosing any such conflicts to their manager.</li>
            <li>This includes ownership in outside enterprises doing business with or competing against aitoolhindi.online, serving in capacities with competitors, or any other circumstances that may compromise the company’s interests.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Confidential Information:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Unauthorized disclosure or use of confidential information is strictly prohibited, and misuse will result in disciplinary action, including termination.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Compliance:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violations of this policy will lead to disciplinary action, up to and including termination. Associates are obligated to report any violations they become aware of.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Social Media Guidelines:</h2>
          <p><strong>Introduction:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Social media posts should exercise good judgment, as they are effectively public statements with lasting impact.</li>
            <li>Associates must understand and comply with company policies outlined in the Employee Handbook.</li>
          </ul>

          <p><strong>Be Careful What You Post:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Associates are personally responsible for their online activity, and inappropriate content may result in disciplinary action, including termination.</li>
            <li>Posts should reflect personal viewpoints, with any references to aitoolhindi.online clearly identified as personal opinions.</li>
          </ul>

          <p><strong>Be Respectful and Professional:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintain professionalism and courtesy in all communications, avoiding posts that could be construed as offensive, threatening, or harassing.</li>
            <li>Respect the privacy of others and refrain from sharing false or misleading information.</li>
          </ul>

          <p><strong>Be Honest and Accurate:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Accuracy is paramount, and any mistakes should be promptly corrected. Associates should be transparent about any changes made to previous posts.</li>
          </ul>

          <p><strong>Respect Laws and Confidentiality:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Associates must adhere to all legal and confidentiality requirements, including copyright and privacy laws. Confidential company information should never be disclosed without authorization.</li>
          </ul>

          <p><strong>Report Your Concerns:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Any concerns regarding potential policy violations should be reported to Human Resources promptly. Retaliation against whistleblowers is strictly prohibited.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Plagiarism and Fairness:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Plagiarism is not tolerated at aitoolhindi.online, and reporters must ensure fairness by providing all parties involved in a story with the opportunity to respond adequately.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
