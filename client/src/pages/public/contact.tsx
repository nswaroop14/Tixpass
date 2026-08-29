import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    // UI-only "submission": use mailto link to open email composer
    const mailto = `mailto:svantech0@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(
      `From: ${form.name} <${form.email}>\n\n${form.message}`
    )}`;
    // simulate async state before opening
    setTimeout(() => {
      setLoading(false);
      setStatus("success");
      window.location.href = mailto;
    }, 500);
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-6">Contact Us</h1>
        <form onSubmit={onSubmit} className="space-y-5" aria-label="Contact form">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} aria-invalid={!!errors.subject} />
            {errors.subject && <p className="text-destructive text-sm">{errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-invalid={!!errors.message} />
            {errors.message && <p className="text-destructive text-sm">{errors.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading} aria-busy={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
          {status === "success" && <p className="text-sm text-emerald-600 mt-2" role="status">Message prepared in your email client.</p>}
          {status === "error" && <p className="text-sm text-destructive mt-2" role="alert">Failed to send. Please try again.</p>}
        </form>
      </div>
    </PublicLayout>
  );
}
