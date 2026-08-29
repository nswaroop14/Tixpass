import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, Zap, BarChart3, QrCode, Smartphone, Headphones, ArrowRight } from "lucide-react";

export default function Pricing() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
            Simple pricing.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">More tickets sold.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">
            Choose what works for your events. No hidden fees.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Per Event */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-950 mb-1">Per Event</h2>
                <p className="text-sm text-gray-500">Pay only for what you use</p>
              </div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-display font-extrabold text-gray-950">€50</span>
                <span className="text-gray-400 font-medium">per event</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited attendees per event",
                  "QR ticket generation",
                  "Entry scanning & Verification",
                  "Digital ticket delivery",
                  "Organizer dashboard",
                  "Email support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/organizer/signup">
                <Button className="w-full h-12 rounded-full bg-gray-950 hover:bg-gray-800 text-white font-semibold gap-2">
                  Choose Event Plan <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Monthly — Highlighted */}
            <div className="bg-gray-950 rounded-2xl border border-violet-500/30 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">Popular</span>
                </div>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-1">Monthly</h2>
                  <p className="text-sm text-gray-400">Best for active organizers</p>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-display font-extrabold text-white">€199</span>
                  <span className="text-gray-400 font-medium">per month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Multiple events per month",
                    "All Event features",
                    "Priority support",
                    "Advanced analytics",
                    "Custom branding",
                    "Early access to new features",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/organizer/signup">
                  <Button className="w-full h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2">
                    Choose Monthly Plan <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-950 mb-3">
              Everything you need
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Tools and features included in every plan.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Easy Event Setup", desc: "Create and publish events in minutes." },
              { icon: QrCode, title: "QR Ticket Generation", desc: "Every ticket gets a unique QR code for instant verification." },
              { icon: Smartphone, title: "Digital Ticket Delivery", desc: "Customers receive tickets via email and WhatsApp." },
              { icon: BarChart3, title: "Organizer Analytics", desc: "Track bookings, revenue and attendance in real time." },
              { icon: Headphones, title: "Support", desc: "Email support for all plans. Priority for Monthly subscribers." },
              { icon: Check, title: "Entry Scanning", desc: "Verify tickets at the door with QR scan check-in." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-base font-bold text-gray-950 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-950 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How does TixPass pricing work?",
                a: "You can pay per event (€50/event) or subscribe monthly (€199/month) for unlimited events. Both plans include all core features.",
              },
              {
                q: "How do I create an event?",
                a: "Sign up as an organizer, go to your dashboard, and click 'Create Event'. Fill in the details, set your ticket type and price, and publish.",
              },
              {
                q: "How are tickets delivered?",
                a: "Customers receive digital tickets via email with a unique QR code. Tickets can also be shared via WhatsApp with a viewable link.",
              },
              {
                q: "Can I manage multiple events?",
                a: "Yes! The Monthly plan supports multiple events per month. The Per Event plan covers one event at a time.",
              },
              {
                q: "What payment methods are accepted?",
                a: "TixPass supports PayPal, Revolut, bank transfers (BOC), and custom payment links as configured by the organizer.",
              },
            ].map((item) => (
              <details key={item.q} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
