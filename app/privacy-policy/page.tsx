import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-black">Privacy Policy - Aitoolhindi.online</h1>
        <p className="text-sm text-slate-500 font-medium">Last updated: October 2026</p>
        
        <div className="prose prose-slate max-w-none text-black font-medium leading-relaxed space-y-6 text-base">
          <p>
            Welcome to <strong>Aitoolhindi.online</strong>. At Aitoolhindi.online, accessible from https://aitoolhindi.online/, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Aitoolhindi.online and how we use it.
          </p>
          <p>
            यदि आपके कोई अतिरिक्त प्रश्न हैं या हमारी गोपनीयता नीति के बारे में अधिक जानकारी चाहते हैं, तो बेझिझक हमसे संपर्क करें।
          </p>

          <h2 className="text-xl font-bold text-black pt-4">1. Information We Collect (हम जो जानकारी एकत्र करते हैं)</h2>
          <p>
            Aitoolhindi.online follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users&apos; movement on the website, and gathering demographic information.
          </p>

          <h2 className="text-xl font-bold text-black pt-4">2. Cookies and Web Beacons (कुकीज़ और वेब बीacons)</h2>
          <p>
            Like any other website, Aitoolhindi.online uses &apos;cookies&apos;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
          </p>

          <h2 className="text-xl font-bold text-black pt-4">3. Google DoubleClick DART Cookie</h2>
          <p>
            Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.aitoolhindi.online and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">https://policies.google.com/technologies/ads</a>
          </p>

          <h2 className="text-xl font-bold text-black pt-4">4. Our Advertising Partners (हमारे विज्ञापन भागीदार)</h2>
          <p>
            Some of advertisers on our site may use cookies and web beacons. Our advertising partners are listed below. Each of our advertising partners has their own Privacy Policy for their policies on user data. For easier access, we hyperlinked to their Privacy Policies below:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Google</strong>: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">https://policies.google.com/technologies/ads</a>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-black pt-4">5. Privacy Policies of Third Parties</h2>
          <p>
            Aitoolhindi.online&apos;s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
          </p>

          <h2 className="text-xl font-bold text-black pt-4">6. Children&apos;s Information (बच्चों की जानकारी)</h2>
          <p>
            Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. Aitoolhindi.online does not knowingly collect any Personal Identifiable Information from children under the age of 13.
          </p>

          <h2 className="text-xl font-bold text-black pt-4">7. Online Privacy Policy Only</h2>
          <p>
            This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Aitoolhindi.online. This policy is not applicable to any information collected offline or via channels other than this website.
          </p>

          <h2 className="text-xl font-bold text-black pt-4">8. Consent (सहमति)</h2>
          <p>
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

