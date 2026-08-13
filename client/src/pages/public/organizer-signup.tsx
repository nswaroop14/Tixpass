import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useOrganizerApply } from "@/hooks/use-public";

export default function OrganizerSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const apply = useOrganizerApply();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Valid email is required";
    if (!form.company.trim()) e.company = "Organization/Company name is required";
    if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      setSubmitError(null);
      await apply.mutateAsync({
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        password: form.password,
      });
      setSuccessOpen(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-6">Organizer Sign-up</h1>
        <p className="text-muted-foreground mb-8">
          Tell us a bit about you and your organization. We’ll review and approve your account.
        </p>
        <form onSubmit={onSubmit} className="space-y-5" aria-label="Organizer sign-up form">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Organization/Company name</Label>
            <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-invalid={!!errors.company} />
            {errors.company && <p className="text-destructive text-sm">{errors.company}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} />
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Submitting..." : "Create account"}
          </Button>
          {submitError && <p className="text-destructive text-sm mt-2" role="alert">{submitError}</p>}
          <div className="text-sm text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer">Organizer Login</span>
            </Link>
          </div>
        </form>

        <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Signup Submitted</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Thanks for submitting all details. You will be able to use the app after Admin approval.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
}
