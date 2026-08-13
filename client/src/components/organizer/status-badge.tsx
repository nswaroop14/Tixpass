type Status = "active" | "paused" | "draft" | "completed" | "cancelled" | "paid" | "payment_submitted" | "pending_payment" | "scanned" | "unused";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, { bg: string; text: string; dot?: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  draft: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  completed: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  payment_submitted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  pending_payment: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  scanned: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  unused: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const statusLabels: Record<Status, string> = {
  active: "Active",
  paid: "Paid",
  paused: "Paused",
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
  payment_submitted: "Verification",
  pending_payment: "Pending",
  scanned: "Checked In",
  unused: "Pending",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.draft;
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${style.bg} ${style.text} ${className}`}
    >
      {style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {label}
    </span>
  );
}
