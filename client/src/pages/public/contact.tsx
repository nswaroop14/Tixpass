import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Valid email is required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const mailto = `mailto:svantech0@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(
      `From: ${form.name} <${form.email}>\n\n${form.message}`
    )}`;
    setTimeout(() => {
      setLoading(false);
      setStatus("success");
      window.location.href = mailto;
    }, 500);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
            Let's talk.
          </h1>
          <p className="text-lg text-gray-400 max-w-lg">
            Have a question about TixPass, your booking or your event?
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </section>

      {/* Form + Info */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-950 mb-6">Get in touch</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Email</p>
                    <a href="mailto:svantech0@gmail.com" className="text-sm text-violet-600 hover:text-violet-700 transition-colors">
                      svantech0@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Support</p>
                    <p className="text-sm text-gray-500">We typically respond within 24 hours.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Business Enquiries</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Interested in partnering with TixPass or need a custom solution for your organisation? Reach out and we'll get back to you.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <form onSubmit={onSubmit} className="space-y-5" aria-label="Contact form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-violet-500/20 focus:border-violet-500"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-violet-500/20 focus:border-violet-500"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-violet-500/20 focus:border-violet-500"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <p className="text-destructive text-xs">{errors.subject}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more..."
                    className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <p className="text-destructive text-xs">{errors.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "Sending..." : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                </Button>
                {status === "success" && (
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700">Message prepared in your email client.</p>
                  </div>
                )}
                {status === "error" && (
                  <p className="text-sm text-destructive" role="alert">Failed to send. Please try again.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
