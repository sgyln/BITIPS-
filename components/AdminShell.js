"use client";
import Link from "next/link";
import { Icon, Logo } from "@/components/ui";
import { useApp } from "@/components/Providers";

const NAV = [["Dashboard", "/admin", "Dashboard"], ["Catalog", "/admin/catalog", "Catalog"], ["Users", "/admin/users", "Users"], ["Audit Log", "/admin/audit", "Audit"], ["Rules", "/admin/settings", "Settings"]];
export default function AdminShell({ active, children }) {
  const { user, logout } = useApp();
  return (
    <div className="flex h-screen min-h-[640px]">
      <nav className="w-[220px] shrink-0 bg-bg2 flex flex-col gap-1 p-5">
        <div className="flex items-center gap-3 mb-6"><Logo size={40} /><div><div className="font-semibold">BITIPS</div><div className="lab text-tx2">Admin Portal</div></div></div>
        {NAV.map(([l, href, ic]) => (
          <Link key={l} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${active === l ? "bg-hi font-semibold" : "text-tx2 hover:bg-white"}`}><Icon t={ic} size={20} color={active === l ? "#191614" : "#6e6862"} />{l}</Link>
        ))}
        <div className="flex-1" />
        <div className="lab text-tx2 px-3">{user.FirstName} {user.LastName}<br />Administrator</div>
        <button className="btn mt-2" onClick={logout}>Sign out</button>
      </nav>
      <main className="flex-1 min-w-0 overflow-auto p-8">{children}</main>
    </div>
  );
}
