export default function StatCard({ label, value, detail, icon }: { label: string; value: string; detail?: string; icon: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-lg">{icon}</span>{detail && <span className="text-xs font-medium text-emerald-600">{detail}</span>}</div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p></div>;
}
