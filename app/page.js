"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { benchmark, mainDestinations } from "@/lib/engine";
import useStartPlan from "@/components/useStartPlan";

const BG = ["linear-gradient(135deg,#8a6a4a,#d1b383)", "linear-gradient(135deg,#7f8f5a,#d6c58b)", "linear-gradient(135deg,#4f7a5a,#a9c9a0)"];
export default function ExplorePage() {
  const r = useRouter(), start = useStartPlan();
  const { db, picks, setSearch, toast, fmt } = useApp();
  const [q, setQ] = useState(""), [open, setOpen] = useState(true);
  const mains = mainDestinations(db), list = mains.filter((d) => d.DestinationName.toLowerCase().includes(q.trim().toLowerCase()));
  const feat = mains.filter((d) => d.Status === "Active").slice(0, 3);
  const search = () => {
    const s = q.trim(); if (!s) return toast("Enter a destination or an interest");
    const d = mains.find((x) => x.DestinationName.toLowerCase().startsWith(s.toLowerCase()));
    if (d) return start(d.DestinationID);
    setSearch({ q: s, c: "All" }); r.push("/search");
  };
  return (
    <Shell active="Explore">
      <main className="flex-1 overflow-auto">
        <div className="px-16 pt-[72px] pb-12 text-white" style={{ background: "radial-gradient(circle at 80% 20%,rgba(255,255,255,.08),transparent 40%),linear-gradient(135deg,#4a3526,#2a1f17 60%,#5a4130)" }}>
          <h1 className="text-[44px] leading-[52px] tracking-[-1px] font-semibold max-w-[640px] mb-7">Plan Your Complete Trip Within Your Budget</h1>
          <div className="flex items-center gap-2.5 bg-white rounded-full py-1.5 pl-[22px] pr-1.5 max-w-[620px] text-tx">
            <input className="flex-1 min-w-0 outline-none bg-transparent" placeholder="Where do you want to go?" value={q} autoComplete="off" onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onKeyDown={(e) => e.key === "Enter" && search()} />
            <span className="lab bg-violet-100 text-violet-700 rounded-full px-2.5 py-[3px] whitespace-nowrap">Pilot Destination</span>
            <button className="btn-p h-11" onClick={search}>Search</button>
          </div>
          {open && list.length > 0 && <div className="bg-white text-tx rounded-2xl max-w-[620px] mt-2 p-1.5 flex flex-col">{list.map((d) => <button key={d.DestinationID} className="text-left px-3.5 py-2 rounded-[10px] hover:bg-bg2 flex justify-between" onClick={() => start(d.DestinationID)}><span>{d.DestinationName}</span>{d.Status === "Limited" && <span className="lab text-tx2">map only</span>}</button>)}</div>}
          <div className="flex gap-3 items-center mt-4 flex-wrap">
            <Link href="/map" className="font-semibold underline">Browse the map →</Link>
            {picks.length > 0 && <span>{picks.length} activit{picks.length > 1 ? "ies" : "y"} queued <button className="font-semibold text-mo" onClick={() => start(feat[0].DestinationID)}>Plan trip →</button></span>}
          </div>
        </div>
        <div className="px-16 py-8">
          <h2 className="text-[22px] font-semibold mb-4">Featured destinations</h2>
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {feat.map((d, i) => { const b = benchmark(db, d.Region); return (
              <button key={d.DestinationID} onClick={() => start(d.DestinationID)} className="bg-white border border-bd rounded-[20px] overflow-hidden text-left">
                <div className="h-[170px] grid place-items-center" style={{ background: BG[i % 3] }}><Icon t={["Heritage", "Heritage", "Nature"][i % 3]} size={72} color="rgba(255,255,255,.85)" /></div>
                <div className="p-4 flex flex-col gap-1"><b>{d.DestinationName}</b><span className="text-tx2">Budget benchmark: Avg. {fmt(b.avg)} / 3 days</span><span className="text-hi">★ {b.rating.toFixed(1)}</span></div>
              </button>); })}
          </div>
        </div>
      </main>
    </Shell>
  );
}
