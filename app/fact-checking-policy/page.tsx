import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fact-Checking Policy – Aitoolhindi.online',
  description: 'Fact-Checking Policy for Aitoolhindi.online. Learn how we investigate, verify, and ensure accuracy in our content.',
  alternates: {
    canonical: 'https://aitoolhindi.online/fact-checking-policy',
  },
};

export default function FactCheckingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Fact-Checking Policy</h1>

        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base sm:text-lg">
          <p>
            a) The aitoolhindi.online is committed to doing its best to publish accurate information across all of its content. We take many steps to ensure accuracy: We investigate claims with scepticism; question assumptions; and challenge conventional wisdom.
          </p>

          <p>
            b) We are committed to achieving due accuracy in all its output. This commitment is fundamental to our reputation and the trust of audiences. The term ‘due’ means that the accuracy must be adequate and appropriate to the output, taking account of the subject and nature of the content and explicitly mention/underline any constraint that may influence that expectation.
          </p>

          <p>
            c) This means all our output, as appropriate to its content and nature, must be well-sourced, based on available evidence, and corroborated. We strive to be honest and open about what we don’t know and avoid unfounded speculation.
          </p>

          <p>
            d) Our journalists never plagiarize deliberately or distort facts or context, including visual information knowingly.
          </p>

          <p>
            e) We seek independent verification from sources to confirm claims, information, allegation, especially those made by public officials or anyone with an agenda beyond merely reporting the truth. Claims, allegations, material facts and other content that cannot be corroborated is normally be attributed.
          </p>

          <p>
            d) The aitoolhindi.online stands by the information it publishes and deems it be accurate. If proven otherwise, we change the news item/information as quickly as possible. We do not knowingly and materially mislead our audiences. We do not distort facts, or present invented material as facts, that can undermine our audiences’ trust in our content. We acknowledge serious factual errors and correct them quickly, clearly and appropriately.
          </p>

          <p>
            e) We provide a fair opportunity for the public to report any inaccuracies or errors in our reportage via <Link href="/contact-us" className="text-orange-600 underline font-bold hover:text-orange-700">contact us</Link> section.
          </p>

          <p>
            f) Our journalists’ primary responsibility is reporting, writing, and fact-checking stories. Stories are subject to review by one or more editors. The aitoolhindi.online has a multi-level fact-checking structure for stories that require due diligence. The seniority of editors who review a story prior to publication varies on a range of factors, including complexity, sensitivity, and the pressure of time.
          </p>

          <h2 className="text-2xl font-bold text-black pt-4">Our Correction Policies</h2>
          <p>
            While The aitoolhindi.online continually strives for excellence and accuracy, we resign the fact that we will occasionally make <Link href="/disclaimer" className="text-orange-600 underline font-bold hover:text-orange-700">errors</Link>. When these errors are made, The aitoolhindi.online will take responsibility for correcting the error and will maintain a high level of transparency to be sure all parties are confident that the incorrect information does not spread.
          </p>

          <p>
            The following are the steps each party needs to take to achieve the goals of accuracy, transparency and excellence:
          </p>

          <p>
            <strong>READERS:</strong><br />
            If a reader spots an error, he or she should contact the editor-in-chief immediately by email, phone, mail or in person.
          </p>

          <p>
            Email: <a href="mailto:support@aitoolhindi.online" className="text-orange-600 underline font-bold hover:text-orange-700">support@aitoolhindi.online</a>
          </p>

          <p>
            Sub: Correction Needed
          </p>

          <p>
            <strong>A <Link href="/correction-policy" className="text-orange-600 underline font-bold hover:text-orange-700">correction</Link> is not officially submitted until the reader contacts the editor-in-chief directly.</strong> Corrections submitted to other aitoolhindi.online staff members may not be addressed in a timely manner or at all.
          </p>

          <p>
            If sent by email or mail, corrections should include the correction, the issue date or number, where the correction was seen (in print, online, etc.) the reader’s name and a phone number or email address they can be contacted at.
          </p>

          <p>
            Readers should also include the correct information and a source for where they found that information, if applicable. For example, if an AI tool&apos;s output seems inaccurate, please provide a screenshot or detailed context to help verify and improve the result.
          </p>

          <p>
            The reader can expect a response from the editor-in-chief and may be contacted further if a clarification is noted or the editor needs more information. Please note that a correction submission is a guarantee that the error will be investigated but not a guarantee that a correction will be issued.
          </p>

          <p>
            <strong>THE aitoolhindi.online:</strong><br />
            Once the editor-in-chief is made aware of an error, he or she will investigate the error using the information provided by the reader, and any other sources of information available to him or her.
          </p>

          <p>
            If an error is found, the editor-in-chief will issue a correction in all forms that the information was incorrectly disseminated:
          </p>

          <p>
            <strong>PRINT:</strong><br />
            Corrections will be printed on page 2A in the next issue published. The correction will denote the issue, article and incorrect information along with the correction.
          </p>

          <p>
            <strong>aitoolhindi.online:</strong><br />
            The article will be corrected and an editor’s note will be added to the bottom of the article noting what was incorrect and when the article was changed.
          </p>

          <p>
            <strong>SOCIAL MEDIA:</strong><br />
            If the article was posted on Facebook, Twitter or any other online medium controlled by The aitoolhindi.online, a post will be made linking to the corrected article, noting the correction.
          </p>

          <p>
            Once the correction is made, the editor-in-chief will contact the reader who submitted the correction and inform them the steps that were taken to correct the error.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
