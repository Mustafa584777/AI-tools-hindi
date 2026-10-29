import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Correction Policy – Aitoolhindi.online',
  description: 'Our Corrections Policy outlines our procedures for rectifying mistakes and ensuring accuracy and transparency in our reporting.',
  alternates: {
    canonical: 'https://aitoolhindi.online/correction-policy',
  },
};

export default function CorrectionPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Correction Policy</h1>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            At aitoolhindi.online, we prioritize <Link href="/disclaimer" className="text-orange-600 underline font-bold hover:text-orange-700">accuracy</Link> and transparency in our reporting. In the event that incorrect information is published on our website, we are committed to promptly correcting the error and informing our readers. This Corrections Policy outlines our procedures for rectifying mistakes and ensuring the integrity of our content.
          </p>

          <p>
            <strong>Premise:</strong> aitoolhindi.online is dedicated to delivering accurate and comprehensive news reports based on the available information at the time of publication. We acknowledge our responsibility to correct any errors that may arise and promptly inform our audience of the corrections made.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Updating a Report:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We make it a practice to clearly indicate when a story has been updated, whether for corrections, clarifications, or additional information.</li>
            <li>For significant corrections, we prominently display a correction notice at the top of the article, clearly stating the updated information.</li>
            <li>We encourage our community members to suggest corrections via email or through the designated section on our website.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Corrections:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Substantive corrections to articles, photo captions, headlines, graphics, videos, or other materials are promptly published with an explanation for the change.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Clarification:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>When factual accuracy is maintained but clarity or detail is lacking in the language used, we provide clarification within the story to address any ambiguities.</li>
            <li>Clarifications may also be added to acknowledge the inclusion of new information or perspectives.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Editor’s Notes:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Corrections that raise significant ethical concerns or question the substance of an article may necessitate an editor’s note, providing further context or explanation.</li>
            <li>Editor’s notes are approved by senior editors and are added to the story to address the underlying issues.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Other Corrections Policies:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Errors identified by readers in comments are acknowledged and corrected by our community engagement team.</li>
            <li>Incorrect information shared on social media platforms is promptly corrected or retracted as necessary.</li>
            <li>We do not attribute blame to individual reporters or editors for errors.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Reporting Inaccuracies:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Readers are encouraged to report inaccuracies by emailing our editorial team directly.</li>
            <li>We take reader feedback seriously and investigate reported inaccuracies promptly.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Take-down Requests:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>As an editorial policy, we do not entertain take-down requests. Instead, we investigate claims of inaccuracy and publish corrections if necessary.</li>
            <li>Fairness considerations may prompt updates or follow-ups on previous coverage, but removal of published articles is not standard practice.</li>
          </ul>

          <h2 className="text-2xl font-bold text-black pt-4">Content Modification:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We utilize AI tools for content modification and correction, ensuring swift and accurate updates to our content.</li>
            <li>Corrections or requests for content modification can be submitted via email, and we will promptly make the necessary changes.</li>
          </ul>

          <p>
            At aitoolhindi.online, we are committed to upholding the highest standards of journalistic integrity and accountability, and our Corrections Policy reflects our dedication to accuracy and transparency in our reporting. Thank you for paying attention.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
