import { useEffect, useState } from "react";
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
import { Loader2, Lock, Unlock, Mail, Shield, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/organizer/page-header";

export default function OrganizerProfile() {
  const resetPw = useOrganizerResetPassword();
  const updateReport = useUpdateReportSettings();
  const bank = useOrganizerBankDetails();
  const saveBank = useSaveOrganizerBankDetails();
  const toggleLock = useToggleBankLock();
  const updateBranding = useUpdateBranding();
  const profile = useOrganizerProfile();

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [report, setReport] = useState<{ reportEmail: string; reportTime: string; enabled: boolean }>({
    reportEmail: "",
    reportTime: "02:00",
    enabled: true,
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
    paymentNumber: "",
    referenceCode: "",
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
        paymentNumber: prev.paymentNumber || bank.data.paymentNumber || "",
        referenceCode: prev.referenceCode || bank.data.referenceCode || "",
      }));
    }
  }, [bank.isLoading, bank.data]);

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
                    { value: "revolut", label: "Revolut / BOC" },
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
              ) : bankForm.paymentMethod === "revolut" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Revolut / BOC Number</Label>
                    <Input
                      disabled={!bankEditMode}
                      placeholder="+357 99 000000 or @username"
                      value={bankForm.paymentNumber}
                      onChange={(e) => setBankForm({ ...bankForm, paymentNumber: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-[11px] text-gray-400">
                      The Revolut or BOC number customers will send money to.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Reference Code Label (Optional)</Label>
                    <Input
                      disabled={!bankEditMode}
                      placeholder="Payment Reference"
                      value={bankForm.referenceCode}
                      onChange={(e) => setBankForm({ ...bankForm, referenceCode: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-[11px] text-gray-400">
                      Label for the reference field shown to customers (e.g., "Payment Reference", "Booking Code").
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
                  } else if (bankForm.paymentMethod === "revolut") {
                    if (!bankForm.paymentNumber || bankForm.paymentNumber.length < 3) {
                      setError("Please provide a valid Revolut / BOC number");
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
