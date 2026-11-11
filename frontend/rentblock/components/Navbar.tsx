"use client";

import Link from "next/link";
import { useState } from "react";

export function Logo() {
  return <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-700 text-sm font-bold text-white">R</span><span>Rent<span className="text-blue-700">Block</span></span></Link>;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><Logo /><nav className={`${open ? "absolute left-0 right-0 top-[73px] z-20 flex flex-col border-b border-slate-200 bg-white p-5 shadow-lg" : "hidden"} gap-6 text-sm font-medium text-slate-600 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none`}><Link href="/properties" className="hover:text-blue-700">Find a home</Link><Link href="/dashboard/tenant" className="hover:text-blue-700">For tenants</Link><Link href="/dashboard/landlord" className="hover:text-blue-700">For landlords</Link></nav><div className="hidden items-center gap-3 md:flex"><Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-700">Log in</Link><Link href="/register" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">Get started</Link></div><button onClick={() => setOpen(!open)} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 md:hidden" aria-label="Toggle menu">{open ? "Close" : "Menu"}</button></div></header>;
}
