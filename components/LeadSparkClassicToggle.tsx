'use client';

import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

// LeadApp Classic — Dual Mode (General vs Supplier↔Buyer)
// Light theme, same vibe as your original Classic design, with a mode toggle.
// Zero‑backend submission via Formspree for the MVP. Swap later to Vercel/Resend if you want.

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpwykqra"; // Updated with correct Formspree endpoint

const MODES = [
  {
    id: "leads",
    tab: "Leads",
    label: "General company leads",
    help: "Find companies similar to your current or ideal customers (prospects to sell to).",
    refLabel: "Reference customer (current or ideal)",
    refPlaceholder: "e.g., Bushnell, Patagonia, or Acme Plastics",
  },
  {
    id: "buyers",
    tab: "Sell To",
    label: "Companies I could supply / manufacture for",
    help: "You're a supplier/manufacturer looking for buyers (companies who could purchase from you).",
    refLabel: "Reference buyer you supply (or want to)",
    refPlaceholder: "e.g., Yeti, Hydro Flask, or Brand X",
  },
  {
    id: "suppliers",
    tab: "Buy From",
    label: "Suppliers / manufacturers to supply my company",
    help: "You're looking for suppliers/manufacturers (companies you could buy from).",
    refLabel: "Reference supplier/manufacturer (current or ideal)",
    refPlaceholder: "e.g., Foxconn, Flex, or Local CNC Shop",
  },
];

export default function LeadAppClassicToggle() {
  const [mode, setMode] = useState(MODES[0].id);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [refCompany, setRefCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [keywords, setKeywords] = useState("");
  const [hp, setHp] = useState(""); // honeypot

  // Newsletter signup
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Footer bar state
  const [showFooterBar, setShowFooterBar] = useState(false);
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);

  // Animation state for flowchart
  const [showFlowchart, setShowFlowchart] = useState(false);

  // Animation state for text content
  const [showTextAnimations, setShowTextAnimations] = useState(false);

  const active = MODES.find((m) => m.id === mode)!;

  // Scroll detection for animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollPercentage = (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      // Show bar when scrolled 10% down, hide when back at top (header area)
      setShowFooterBar(scrollPercentage >= 10 && scrollY > 100);

      // Trigger flowchart animation when flowchart section is visible
      const flowchartElement = document.querySelector('[data-flowchart]');
      if (flowchartElement) {
        const rect = flowchartElement.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setShowFlowchart(isVisible);
      }

      // Trigger text animations when hero section is visible
      const heroElement = document.querySelector('[data-hero-text]');
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setShowTextAnimations(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger on mount as well
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission
    setIsSubmitting(true);

    // Create FormData from the form
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('lead_submissions')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        console.error('This might mean the table does not exist or RLS is blocking access');
      } else {
        console.log('Supabase connection successful, table accessible');
        console.log('Test data:', testData);
      }

      // Save lead submission via API route
      const apiResponse = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'leads',
          email: email,
          ref_company: refCompany,
          industry: industry || null,
          region: region || null,
          keywords: keywords || null,
          mode: active.label,
          mode_id: mode,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Error saving lead submission:', errorData);
        console.error('Lead data being saved:', {
          email,
          ref_company: refCompany,
          industry: industry || null,
          region: region || null,
          keywords: keywords || null,
          mode: active.label,
          mode_id: mode,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
        });
        throw new Error(errorData.error || 'Failed to save lead submission');
      }

      const apiResult = await apiResponse.json();
      console.log('Lead submission saved successfully:', apiResult);

      // Then submit to Formspree for email notification
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Success! Show our success message
        setFormSubmitted(true);
      } else {
        console.error('Formspree submission failed');
        setFormSubmitted(true); // Still show success since DB save worked
      }
    } catch (error) {
      // Handle any error
      console.error('Form submission error:', error);
      setFormSubmitted(true); // Still show success for better UX
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Test newsletter table connection
      console.log('Testing newsletter table connection...');
      const { error: testError } = await supabase
        .from('newsletter_signups')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('Newsletter table test failed:', testError);
      } else {
        console.log('Newsletter table accessible');
      }

      // Save newsletter signup via API route
      const apiResponse = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'newsletter',
          email: newsletterEmail
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Error saving newsletter signup:', errorData);
        throw new Error(errorData.error || 'Failed to save newsletter signup');
      }

      const apiResult = await apiResponse.json();
      console.log('Newsletter signup saved successfully:', apiResult);

      // Then submit to Formspree for email notification
      const formData = new FormData();
      formData.append('email', newsletterEmail);
      formData.append('signupType', 'newsletter');
      formData.append('message', 'Newsletter signup: Stay in the loop');

      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      setNewsletterSubmitted(true);
      setNewsletterEmail("");
    } catch (error) {
      console.error('Newsletter signup failed:', error);
      setNewsletterSubmitted(true); // Still show success for better UX
    }
  };

  const handlePDFSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Test newsletter table connection
      console.log('Testing newsletter table connection for PDF...');
      const { error: testError } = await supabase
        .from('newsletter_signups')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('Newsletter table test failed:', testError);
      } else {
        console.log('Newsletter table accessible for PDF');
      }

      // Save PDF signup via API route
      const apiResponse = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'pdf',
          email: footerEmail
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Error saving PDF signup:', errorData);
        throw new Error(errorData.error || 'Failed to save PDF signup');
      }

      const apiResult = await apiResponse.json();
      console.log('PDF signup saved successfully:', apiResult);

      // Then submit to Formspree for email notification
      const formData = new FormData();
      formData.append('email', footerEmail);
      formData.append('signupType', 'pdf');
      formData.append('message', 'PDF signup: Prospecting Playbook + Monthly Tips');

      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      setFooterSubmitted(true);
      setFooterEmail("");
    } catch (error) {
      console.error('PDF signup failed:', error);
      setFooterSubmitted(true); // Still show success for better UX
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-center px-4 py-4 border-b border-slate-200 relative z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-900 rounded-2xl" />
          <span className="font-semibold">LeadApp</span>
        </div>
      </header>

      {/* HERO + FORM */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10 grid md:grid-cols-2 gap-16 items-start">
        <div data-hero-text className="flex flex-col justify-start h-full pl-8 pr-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Get 10 Similar Companies + Verified Contacts — Free
          </h1>

          {/* Split into separate paragraphs with proper spacing and animations */}
          <p className={`mt-8 text-slate-600 text-lg transition-all duration-500 ${showTextAnimations ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}>
            Instantly find 10 companies that look like your best customers — and the people to contact.
          </p>
          <p className={`mt-4 text-slate-600 text-lg transition-all duration-500 delay-75 ${showTextAnimations ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}>
            Built by a small team of B2B-sales nerds — no scraping, no spam.
          </p>

          {/* Enhanced 3-step visual flow with animations */}
          <div data-flowchart className="mt-16 relative">
            <div className="flex items-center justify-center gap-8 text-base text-slate-700">

              {/* Step 1: Company Input */}
              <div className={`flex flex-col items-center text-center transition-all duration-1000 ${showFlowchart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative">
                  <div className="w-20 h-20 mb-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg border border-blue-200">
                    {/* Enhanced building/company icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-blue-600">
                      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
                      <path d="M9 9h6v6H9z"/>
                      <path d="M9 15h6v2H9z"/>
                    </svg>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    1
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">Enter 1 company</span>
                <span className="text-xs text-slate-500 mt-1">Your reference customer</span>
              </div>

              {/* Arrow 1 */}
              <div className={`transition-all duration-1000 delay-300 ${showFlowchart ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                <div className="flex items-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-500 ml-1">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>

              {/* Step 2: AI Search */}
              <div className={`flex flex-col items-center text-center transition-all duration-1000 delay-500 ${showFlowchart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative">
                  <div className="w-20 h-20 mb-4 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl shadow-lg border border-emerald-200">
                    {/* Enhanced AI/search icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-emerald-600">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                      <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.3"/>
                    </svg>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    2
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">We find 10 look-alikes</span>
                <span className="text-xs text-slate-500 mt-1">AI-powered matching</span>
              </div>

              {/* Arrow 2 */}
              <div className={`transition-all duration-1000 delay-700 ${showFlowchart ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                <div className="flex items-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-purple-400"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-purple-500 ml-1">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>

              {/* Step 3: Results */}
              <div className={`flex flex-col items-center text-center transition-all duration-1000 delay-1000 ${showFlowchart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative">
                  <div className="w-20 h-20 mb-4 flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-lg border border-purple-200">
                    {/* Enhanced email/inbox icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-purple-600">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                      <circle cx="12" cy="13" r="2" fill="currentColor" opacity="0.3"/>
                    </svg>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    3
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">Get verified contacts</span>
                <span className="text-xs text-slate-500 mt-1">Delivered to your inbox</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${showFlowchart ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-500 delay-200 ${showFlowchart ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-500 delay-400 ${showFlowchart ? 'bg-purple-500' : 'bg-slate-300'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-8">
          {/* Tab bar (short labels) */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 " +
                  (mode === m.id
                    ? "bg-slate-700 shadow-md ring-1 ring-slate-500 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 hover:border-slate-400")
                }
              >
                {m.tab}
              </button>
            ))}
          </div>

          {/* Active tab helper text with fixed height */}
          <div className="mt-2 h-12 flex items-start">
            <p className="text-xs text-slate-600">{active.help}</p>
          </div>

          {formSubmitted ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-100 grid place-items-center mb-3">✅</div>
              <div className="text-lg font-semibold">Got it — we&apos;ll send your 20 similar companies + contacts by email.</div>
              <p className="text-sm text-slate-600 mt-1">We&apos;ll reply from team@yourdomain.com. Check spam just in case.</p>
            </div>
          ) : (
            <form
              action={FORMSPREE_ENDPOINT}
              method="POST"
              onSubmit={handleFormSubmit}
            >
              {/* Reference company */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  {active.refLabel}
                </label>
                <input
                  type="text"
                  name="refCompany"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                  placeholder={active.refPlaceholder}
                  value={refCompany}
                  onChange={(e) => setRefCompany(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  Business email
                </label>
                <input
                  type="email"
                  name="email"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  We&apos;ll deliver your 10-company list here. No spam.
                </p>
              </div>

              {/* Advanced options */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((s) => !s)}
                  className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
                >
                  {showAdvanced
                    ? "Hide advanced options"
                    : "Advanced options (optional)"}
                </button>
                {showAdvanced && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-slate-700">
                        Industry or HS code
                      </label>
                      <input
                        type="text"
                        name="industry"
                        placeholder="e.g., 9506 or Outdoor Gear"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700">
                        Region / country
                      </label>
                      <input
                        type="text"
                        name="region"
                        placeholder="e.g., US, EU, LATAM"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700">
                        Keywords (optional)
                      </label>
                      <input
                        type="text"
                        name="keywords"
                        placeholder="e.g., injection molding, DTC brands, sporting goods"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden fields for additional data */}
              <input type="hidden" name="mode" value={active.label} />
              <input type="hidden" name="modeId" value={mode} />
              <input type="hidden" name="submittedAt" value={new Date().toISOString()} />
              <input type="hidden" name="offer" value="20 similar companies + verified contacts" />

              {/* honeypot */}
              <input
                type="text"
                name="hp"
                value={hp}
                onChange={e=>setHp(e.target.value)}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />

              {/* Submit */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-slate-900 px-6 py-4 text-center text-base font-semibold text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 transition-all duration-200 hover:shadow-xl"
                >
                  {isSubmitting ? 'Sending…' : 'Get my free leads →'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">By submitting, you agree to receive your lead list by email. We only send what you request.</p>
            </form>
          )}
        </div>
      </section>

      {/* BADGES */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="px-2 py-1 rounded-full bg-slate-100 border">Free beta</span>
          <span className="px-2 py-1 rounded-full bg-slate-100 border">No credit card</span>
          <span className="px-2 py-1 rounded-full bg-slate-100 border">Results by email</span>
          <span className="px-2 py-1 rounded-full bg-slate-100 border">B2B only</span>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">What you&apos;ll receive (example)</h2>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Website</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Why chosen</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 pr-4">Alpine Gearworks</td>
                  <td className="py-2 pr-4">alpinegearworks.io</td>
                  <td className="py-2 pr-4">Priya Patel</td>
                  <td className="py-2 pr-4">Supply Chain Manager</td>
                  <td className="py-2 pr-4">priya.patel@alpinegearworks.io</td>
                  <td className="py-2 pr-4">Same materials and target retailers</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 pr-4">Meridian Outdoors</td>
                  <td className="py-2 pr-4">meridian-outdoors.com</td>
                  <td className="py-2 pr-4">Connor Lee</td>
                  <td className="py-2 pr-4">Category Buyer</td>
                  <td className="py-2 pr-4">connor.lee@meridian-outdoors.com</td>
                  <td className="py-2 pr-4">Overlapping product specs and distributors</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 pr-4">Summit Manufacturing</td>
                  <td className="py-2 pr-4">summitmfggroup.com</td>
                  <td className="py-2 pr-4">Elena Rossi</td>
                  <td className="py-2 pr-4">Sourcing Manager</td>
                  <td className="py-2 pr-4">elena.rossi@summitmfggroup.com</td>
                  <td className="py-2 pr-4">Shipments match the same HS chapter & volume</td>
                </tr>
                <tr className="border-t">
                  <td className="py-1 pr-4 text-center text-slate-400 italic" colSpan={6}>
                    <div className="py-1">
                      <span className="text-lg">⋯</span>
                      <span className="ml-2 text-sm">7 more companies + contacts</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SIGNUP */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-slate-700">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold">Stay in the loop</h2>
          </div>

          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Get monthly tips on finding leads + exclusive access to new prospecting tools before they&apos;re public.
          </p>

          {newsletterSubmitted ? (
            <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <p className="text-green-800 font-semibold text-lg">You&apos;re in!</p>
              </div>
              <p className="text-green-700 text-sm">Check your email for a confirmation link.</p>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all duration-200 hover:shadow-xl"
                >
                  Join the list
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">No spam, just valuable insights. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </section>

      {/* ROADMAP */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">What&apos;s next (sneak peek)</h2>
        <div className="mt-6 grid sm:grid-cols-3 gap-6">
          {[
            {title: "Chrome Saver", body: "One‑click save emails from any page into your lists."},
            {title: "GMass‑ready CSV", body: "Download cleaned lists or push straight to your Gmail campaigns."},
            {title: "Outreach Dashboard", body: "Track opens, clicks, replies in a clean, simple view."},
          ].map((card, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-semibold">{card.title}</div>
              <p className="mt-2 text-slate-600">{card.body}</p>
              <span className="mt-4 inline-block text-xs text-slate-500">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-slate-500 text-sm py-6 pb-24 border-t border-slate-200">
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} LeadApp — B2B leads, simplified.</span>
          <span>•</span>
          <a href="/legal" className="text-slate-500 hover:text-slate-700 underline">
            Legal & Contact
          </a>
        </div>
      </footer>

      {/* Sticky Top Bar */}
      {showFooterBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-lg z-40">
          <div className="max-w-5xl mx-auto px-8 py-7">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-900">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-white">Free PDF:</span>
                  <span className="text-slate-200 ml-1">Prospecting Playbook + Monthly Tips for Finding Quality Leads.</span>
                </div>
              </div>

              {footerSubmitted ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Thanks — check your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handlePDFSubmit} className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    className="flex-1 sm:w-48 rounded-lg border border-slate-600 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-white focus:ring-1 focus:ring-white/20"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  >
                    Get the PDF
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
