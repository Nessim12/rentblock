import Link from "next/link";
import Navbar from "./Navbar";

export default function DashboardShell({ children, role }: { children: React.ReactNode; role: "Tenant" | "Landlord" }) {
  const links = role === "Tenant" ? [["/dashboard/tenant", "Overview"], ["/properties", "Find a home"], ["/rental/1", "My agreement"]] : [["/dashboard/landlord", "Overview"], ["/dashboard/landlord/properties/new", "Add property"], ["/properties", "Browse marketplace"]];
  return <><Navbar /><div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 lg:flex-row lg:px-8"><aside className="w-full shrink-0 lg:w-56"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">{role} portal</p><p className="mt-1 text-lg font-bold text-slate-950">Good morning, {role === "Tenant" ? "Malek" : "Amine"}</p></div><nav className="flex gap-2 overflow-auto lg:grid">{links.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700">{label}</Link>)}</nav></aside><main className="min-w-0 flex-1">{children}</main></div></>;
}
