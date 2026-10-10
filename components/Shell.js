"use client";
import Link from "next/link";
import { Icon, Logo } from "@/components/ui";

const NAV = [["Explore", "/"], ["Trips", "/trips"], ["Budget", "/budget"], ["Profile", "/profile"]];
export default function Shell({ active, children, banner }) {
  return (
    <div className="flex h-screen min-h-[640px]">
      <nav className="w-20 shrink-0 bg-bg2 flex flex-col items-center gap-5 py-8">
        <Logo /><div className="h-2" />
        {NAV.map(([l, href]) => (
          <Link key={l} href={href} className={`flex flex-col items-center gap-1 lab ${active === l ? "text-tx" : "text-tx2"}`}>
            <span className={`w-14 h-8 rounded-2xl grid place-items-center ${active === l ? "bg-hi" : ""}`}><Icon t={l} color="#191614" /></span>{l}
          </Link>
        ))}
      </nav>
      <div className="flex-1 min-w-0 flex flex-col">{banner}{children}</div>
    </div>
  );
}
