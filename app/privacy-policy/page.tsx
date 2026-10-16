import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-6 bg-white my-8 rounded-3xl border border-slate-200 shadow-sm text-black">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-sm font-medium leading-relaxed">
          At Aitoolhindi.online, accessible from https://aitoolhindi.online/, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Aitoolhindi.online and how we use it.
        </p>
        <h2 className="text-xl font-bold pt-4">Log Files</h2>
        <p className="text-sm font-medium leading-relaxed">
          Aitoolhindi.online follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services&apos; analytics.
        </p>
        <h2 className="text-xl font-bold pt-4">Cookies and Web Beacons</h2>
        <p className="text-sm font-medium leading-relaxed">
          Like any other website, Aitoolhindi.online uses &apos;cookies&apos;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited.
        </p>
      </main>
      <Footer />
    </>
  );
}
