import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizerResetPassword, useUpdateReportSettings, useOrganizerBankDetails, useSaveOrganizerBankDetails, useToggleBankLock } from "@/hooks/use-organizer";
import { Loader2 } from "lucide-react";

export default function OrganizerProfile() {
  const resetPw = useOrganizerResetPassword();
  const updateReport = useUpdateReportSettings();
  const bank = useOrganizerBankDetails();
  const saveBank = useSaveOrganizerBankDetails();
  const toggleLock = useToggleBankLock();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [report, setReport] = useState<{ reportEmail: string; reportTime: string; enabled: boolean }>({
    reportEmail: "",
    reportTime: "02:00",
    enabled: true,
  });
  const [bankForm, setBankForm] = useState({ bankName: "", accountHolder: "", accountNumber: "", routingNumber: "", accountType: "", paymentMethod: "bank", paymentLink: "", paypalClientId: "" });
  const [bankLocked, setBankLocked] = useState<boolean>(false);
  const [bankEditMode, setBankEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (!bank.isLoading && bank.data) {
      setBankForm(prev => ({
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
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-2xl font-display font-bold mb-4">Account Settings</h2>
        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={resetPw.isPending}>
              {resetPw.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
            {error && <p className="text-destructive text-sm mt-2" role="alert">{error}</p>}
            {success && <p className="text-emerald-600 text-sm mt-2" role="status">{success}</p>}
          </form>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <h3 className="text-lg font-display font-bold mb-3">Daily Bookings Report</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportEmail">Recipient Email</Label>
              <Input id="reportEmail" type="email" value={report.reportEmail} onChange={(e) => setReport({ ...report, reportEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportTime">Time (HH:mm)</Label>
              <Input id="reportTime" type="time" value={report.reportTime} onChange={(e) => setReport({ ...report, reportTime: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input id="reportEnabled" type="checkbox" checked={report.enabled} onChange={(e) => setReport({ ...report, enabled: e.target.checked })} />
              <Label htmlFor="reportEnabled">Enable Daily Report</Label>
            </div>
            <Button 
              className="w-full" 
              disabled={updateReport.isPending} 
              onClick={async () => {
                setError(null);
                setSuccess(null);
                try {
                  await updateReport.mutateAsync({ reportEmail: report.reportEmail, reportTime: report.reportTime, enabled: report.enabled });
                  setSuccess("Report settings updated");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to update report settings");
                }
              }}
            >
              {updateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Report Settings"}
            </Button>
          </div>
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display font-bold">Bank Details</h3>
            <Button variant="outline" onClick={async () => {
              try {
                await toggleLock.mutateAsync({ enabled: bankEditMode });
                setBankEditMode(!bankEditMode);
                setSuccess(bankEditMode ? "Bank details locked" : "Bank details unlocked");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to toggle lock");
              }
            }}>
              {bankEditMode ? "Lock" : "Edit"}
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" disabled={!bankEditMode} checked={bankForm.paymentMethod === "bank"} onChange={() => setBankForm({ ...bankForm, paymentMethod: "bank" })} />
                  <span>Bank Account</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" disabled={!bankEditMode} checked={bankForm.paymentMethod === "link"} onChange={() => setBankForm({ ...bankForm, paymentMethod: "link" })} />
                  <span>Payment Link</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" disabled={!bankEditMode} checked={bankForm.paymentMethod === "paypal"} onChange={() => setBankForm({ ...bankForm, paymentMethod: "paypal" })} />
                  <span>PayPal</span>
                </label>
              </div>
            </div>
          </div>
          {bankForm.paymentMethod === "bank" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input disabled={!bankEditMode} value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account Holder</Label>
              <Input disabled={!bankEditMode} value={bankForm.accountHolder} onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input disabled={!bankEditMode} value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Routing Number</Label>
              <Input disabled={!bankEditMode} value={bankForm.routingNumber} onChange={e => setBankForm({ ...bankForm, routingNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Input disabled={!bankEditMode} value={bankForm.accountType} onChange={e => setBankForm({ ...bankForm, accountType: e.target.value })} />
            </div>
          </div>
          ) : bankForm.paymentMethod === "paypal" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>PayPal Client ID</Label>
                <Input disabled={!bankEditMode} placeholder="Paste Client ID from your PayPal snippet" value={bankForm.paypalClientId} onChange={e => setBankForm({ ...bankForm, paypalClientId: e.target.value })} />
                <p className="text-xs text-muted-foreground">Found in <code>client-id=...</code> part of your snippet.</p>
              </div>
              <div className="space-y-2">
                <Label>PayPal Hosted Button ID</Label>
                <Input disabled={!bankEditMode} placeholder="e.g. 68MAVF4NNT33Y" value={bankForm.paymentLink} onChange={e => setBankForm({ ...bankForm, paymentLink: e.target.value })} />
                <p className="text-xs text-muted-foreground">Found in <code>hostedButtonId: "..."</code> part of your snippet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Payment Link (URL)</Label>
              <Input disabled={!bankEditMode} placeholder="https://payments.example.com/..." value={bankForm.paymentLink} onChange={e => setBankForm({ ...bankForm, paymentLink: e.target.value })} />
              <p className="text-xs text-muted-foreground">Customers will be redirected to this link to pay, then paste the reference code back here.</p>
            </div>
          )}
          <Button 
            className="w-full mt-4" 
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
                  paypalClientId: bankForm.paymentMethod === 'paypal' ? bankForm.paypalClientId : undefined 
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
          {error && <p className="text-destructive text-sm mt-2" role="alert">{error}</p>}
          {success && <p className="text-emerald-600 text-sm mt-2" role="status">{success}</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
