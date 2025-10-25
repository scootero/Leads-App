import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-center px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-900 rounded-2xl" />
          <span className="font-semibold">LeadApp</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-8">
            LeadApp — Legal & Contact
          </h1>

          <div className="space-y-8">
            {/* Copyright */}
            <div>
              <p className="text-slate-600">
                © 2025 LeadApp — B2B leads, simplified.
              </p>
            </div>

            {/* MVP Disclosure */}
            <div>
              <h2 className="text-xl font-semibold mb-4">MVP Disclosure</h2>
              <p className="text-slate-700 leading-relaxed">
                This is an early-stage MVP project. Lead lists are hand-curated manually by our team. We respond to submitted requests within 72 hours.
              </p>
            </div>

            {/* Privacy */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Privacy</h2>
              <p className="text-slate-700 leading-relaxed">
                We only use the information you submit to prepare your requested lead list and to communicate with you about that request. We do not sell, share, or resell your data.
              </p>
            </div>

            {/* User Responsibility */}
            <div>
              <h2 className="text-xl font-semibold mb-4">User Responsibility</h2>
              <p className="text-slate-700 leading-relaxed">
                By requesting a lead list, you agree to comply with applicable laws and anti-spam regulations when contacting leads provided. All lists are for legitimate B2B outreach purposes only.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <p className="text-slate-700 mb-2">Email us at:</p>
              <div className="space-y-1">
                <p className="text-slate-700">
                  <a href="mailto:scott@designmidwestsales.com" className="text-slate-900 hover:text-slate-600 underline">
                    scott@designmidwestsales.com
                  </a>
                </p>
                <p className="text-slate-700">
                  <a href="mailto:oliverscott14@gmail.com" className="text-slate-900 hover:text-slate-600 underline">
                    oliverscott14@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Copyright & Takedown */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Copyright & Takedown</h2>
              <p className="text-slate-700 leading-relaxed">
                If you believe any content on this site infringes your copyright, email{' '}
                <a href="mailto:scott@designmidwestsales.com" className="text-slate-900 hover:text-slate-600 underline">
                  scott@designmidwestsales.com
                </a>{' '}
                with identification of the material and proof of ownership.
              </p>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
