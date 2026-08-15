import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useOrganizerResetPassword,
  useUpdateReportSettings,
  useOrganizerBankDetails,
  useSaveOrganizerBankDetails,
  useToggleBankLock,
  useUpdateBranding,
  useOrganizerProfile,
} from "@/hooks/use-organizer";
import { Loader2, Lock, Unlock, Mail, Shield, CreditCard, CheckCircle2, AlertCircle, Upload, X, Palette } from "lucide-react";
import { PageHeader } from "@/components/organizer/page-header";

export default function OrganizerProfile() {
  const resetPw = useOrganizerResetPassword();
  const updateReport = useUpdateReportSettings();
  const bank = useOrganizerBankDetails();
  const saveBank = useSaveOrganizerBankDetails();
  const toggleLock = useToggleBankLock();
  const updateBranding = useUpdateBranding();
  const profile = useOrganizerProfile();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [report, setReport] = useState<{ reportEmail: string; reportTime: string; enabled: boolean }>({
    reportEmail: "",
    reportTime: "02:00",
    enabled: true,
  });
  const [branding, setBranding] = useState<{ brandName: string; logoUrl: string }>({
    brandName: "",
    logoUrl: "",
  });
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    routingNumber: "",
    accountType: "",
    paymentMethod: "bank",
    paymentLink: "",
    paypalClientId: "",
  });
  const [bankLocked, setBankLocked] = useState<boolean>(false);
  const [bankEditMode, setBankEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (!bank.isLoading && bank.data) {
      setBankForm((prev) => ({
        bankName: prev.bankName || bank.data.bankName || "",
        accountHolder: prev.accountHolder || bank.data.accountHolder || "",
        accountNumber: prev.accountNumber || bank.data.accountNumber || "",
        routingNumber: prev.routingNumber || bank.data.routingNumber || "",
        accountType: prev.accountType || bank.data.accountType || "",
        paymentMethod: (bank.data.paymentMethod as any) || prev.paymentMethod || "bank",
        paymentLink: prev.paymentLink || bank.data.paymentLink || "",
        paypalClientId: prev.paypalClientId || (bank.data as any).paypalClientId || "",
      }));
    }
  }, [bank.isLoading, bank.data]);

  useEffect(() => {
    if (!profile.isLoading && profile.data) {
      setBranding({
        brandName: profile.data.brandName || "",
        logoUrl: profile.data.logoUrl || "",
      });
    }
  }, [profile.isLoading, profile.data]);

  const handleBrandingSave = async () => {
    try {
      await updateBranding.mutateAsync({ brandName: branding.brandName, logoUrl: branding.logoUrl });
      setSuccess("Branding updated successfully");
    } catch {
      setError("Failed to update branding");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setBranding({ ...branding, logoUrl: canvas.toDataURL("image/png") });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.currentPassword || !form.newPassword) {
      setError("Please fill all required fields");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await resetPw.mutateAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    }
  };

  return (
    <DashboardLayout role="organizer">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Account" subtitle="Manage your password, reports, and payment settings." />

        <div className="space-y-6">
          {/* Notifications / Alerts */}
          {(error || success) && (
            <div
              className={`rounded-xl p-4 flex items-center gap-3 ${
                error ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"
              }`}
            >
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <p className={`text-sm font-medium ${error ? "text-red-700" : "text-emerald-700"}`}>
                {error || success}
              </p>
            </div>
          )}

          {/* Branding Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">Branding</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Customize the name and logo shown on ticket emails.</p>
            </div>
            <div className="px-6 pb-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Brand Name</Label>
                <Input
                  value={branding.brandName}
                  onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                  className="h-9"
                  placeholder="e.g. Indian Cinema Connectx"
                />
                <p className="text-[11px] text-gray-400">Shown as the header in ticket emails. Leave blank to use your organizer name.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Logo</Label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {branding.logoUrl ? (
                  <div className="relative inline-block">
                    <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto max-w-[200px] object-contain bg-gray-50 rounded-lg border border-gray-200 p-2" />
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, logoUrl: "" })}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload logo (optional)
                  </button>
                )}
                <p className="text-[11px] text-gray-400">Displayed above the brand name in emails. Max 2MB.</p>
              </div>
              <Button
                onClick={handleBrandingSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm"
                disabled={updateBranding.isPending}
              >
                {updateBranding.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Branding"}
              </Button>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">Security</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Update your password to keep your account secure.</p>
            </div>
            <div className="px-6 pb-6">
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="h-9"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={resetPw.isPending}
                >
                  {resetPw.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </div>
          </div>

          {/* Daily Report Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">Daily Bookings Report</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Receive a daily summary of your bookings via email.</p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Recipient Email</Label>
                <Input
                  id="reportEmail"
                  type="email"
                  value={report.reportEmail}
                  onChange={(e) => setReport({ ...report, reportEmail: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Time (HH:mm)</Label>
                <Input
                  id="reportTime"
                  type="time"
                  value={report.reportTime}
                  onChange={(e) => setReport({ ...report, reportTime: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <input
                  id="reportEnabled"
                  type="checkbox"
                  checked={report.enabled}
                  onChange={(e) => setReport({ ...report, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="reportEnabled" className="text-sm text-gray-700">
                  Enable Daily Report
                </Label>
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={updateReport.isPending}
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  try {
                    await updateReport.mutateAsync({
                      reportEmail: report.reportEmail,
                      reportTime: report.reportTime,
                      enabled: report.enabled,
                    });
                    setSuccess("Report settings updated");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to update report settings");
                  }
                }}
              >
                {updateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Report Settings"}
              </Button>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Payment Settings</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-gray-200 text-gray-600 gap-1.5 text-xs"
                  onClick={async () => {
                    try {
                      await toggleLock.mutateAsync({ enabled: bankEditMode });
                      setBankEditMode(!bankEditMode);
                      setSuccess(bankEditMode ? "Bank details locked" : "Bank details unlocked");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to toggle lock");
                    }
                  }}
                >
                  {bankEditMode ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Lock
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Edit
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Configure how you receive payments from ticket sales.</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-sm">Payment Method</Label>
                <div className="flex gap-3">
                  {[
                    { value: "bank", label: "Bank Account" },
                    { value: "link", label: "Payment Link" },
                    { value: "paypal", label: "PayPal" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        bankForm.paymentMethod === method.value
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      } ${!bankEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        disabled={!bankEditMode}
                        checked={bankForm.paymentMethod === method.value}
                        onChange={() => setBankForm({ ...bankForm, paymentMethod: method.value })}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Method-specific fields */}
              {bankForm.paymentMethod === "bank" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Bank Name</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Account Holder</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Account Number</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Routing Number</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.routingNumber}
                      onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Account Type</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.accountType}
                      onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              ) : bankForm.paymentMethod === "paypal" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">PayPal Client ID</Label>
                    <Input
                      disabled={!bankEditMode}
                      placeholder="Paste Client ID from your PayPal snippet"
                      value={bankForm.paypalClientId}
                      onChange={(e) => setBankForm({ ...bankForm, paypalClientId: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-[11px] text-gray-400">
                      Found in <code className="bg-gray-50 px-1 rounded">client-id=...</code> part of your snippet.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">PayPal Hosted Button ID</Label>
                    <Input
                      disabled={!bankEditMode}
                      placeholder="e.g. 68MAVF4NNT33Y"
                      value={bankForm.paymentLink}
                      onChange={(e) => setBankForm({ ...bankForm, paymentLink: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-[11px] text-gray-400">
                      Found in <code className="bg-gray-50 px-1 rounded">hostedButtonId: "..."</code> part of your snippet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-sm">Payment Link (URL)</Label>
                  <Input
                    disabled={!bankEditMode}
                    placeholder="https://payments.example.com/..."
                    value={bankForm.paymentLink}
                    onChange={(e) => setBankForm({ ...bankForm, paymentLink: e.target.value })}
                    className="h-9"
                  />
                  <p className="text-[11px] text-gray-400">
                    Customers will be redirected to this link to pay, then paste the reference code back here.
                  </p>
                </div>
              )}

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!bankEditMode || saveBank.isPending}
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  if (bankForm.paymentMethod === "bank") {
                    if (!bankForm.bankName || !bankForm.accountHolder || !bankForm.accountNumber || !bankForm.routingNumber) {
                      setError("Please fill required bank fields");
                      return;
                    }
                  } else if (bankForm.paymentMethod === "link") {
                    try {
                      const url = new URL(bankForm.paymentLink);
                      if (!url.protocol.startsWith("http")) throw new Error("Invalid URL");
                    } catch {
                      setError("Please provide a valid payment link (URL)");
                      return;
                    }
                  } else if (bankForm.paymentMethod === "paypal") {
                    if (!bankForm.paypalClientId || bankForm.paypalClientId.length < 10) {
                      setError("Please provide a valid PayPal Client ID from your snippet");
                      return;
                    }
                    if (!bankForm.paymentLink || bankForm.paymentLink.length < 5) {
                      setError("Please provide a valid PayPal Hosted Button ID");
                      return;
                    }
                  }
                  try {
                    await saveBank.mutateAsync({
                      ...bankForm,
                      paypalClientId: bankForm.paymentMethod === "paypal" ? bankForm.paypalClientId : undefined,
                    });
                    await toggleLock.mutateAsync({ enabled: true });
                    setBankEditMode(false);
                    setSuccess("Bank details saved and locked");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to save bank details");
                  }
                }}
              >
                {saveBank.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Lock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
