import type { PaymentStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: string }) {
  const style = status === "Paid" || status === "Confirmed" || status === "Active" || status === "Available" ? "bg-emerald-50 text-emerald-700" : status === "Pending" ? "bg-amber-50 text-amber-700" : status === "Failed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{status}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge status={status} />;
}
