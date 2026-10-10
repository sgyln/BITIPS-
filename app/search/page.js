"use client";
import { useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import PoiModal from "@/components/PoiModal";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { BD } from "@/lib/consts";
import { activeActivities, mainDestinations, place } from "@/lib/engine";
import useStartPlan from "@/components/useStartPlan";

export default function SearchPage() {
  const { db, search, setSearch, fmt } = useApp(), start = useStartPlan(), [sel, setSel] = useState(null);
  const q = search.q.toLowerCase();
  const L = activeActivities(db).filter((a) => (search.c === "All" || a.ActivityType === search.c) && (!q || `${a.ActivityName} ${a.ActivityType} ${a.Description} ${place(db, a.DestinationID).DestinationName}`.toLowerCase().includes(q)));
  return (
    <Shell active="Explore">
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1120px] mx-auto flex flex-col gap-4">
          <div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Search results</h1><div className="text-tx2">{L.length} result{L.length === 1 ? "" : "s"} for “{search.q}”</div></div>
          <div className="flex gap-2 flex-wrap">{["All", "Heritage", "Culinary", "Nature", "Coastal"].map((c) => <button key={c} className={`chip ${search.c === c ? "chip-on" : ""}`} onClick={() => setSearch({ ...search, c })}>{c}</button>)}<Link href="/" className="chip">← Back</Link></div>
          {L.map((a) => (
            <div key={a.ActivityID} className="flex items-center gap-4 bg-white border border-bd rounded-[20px] px-5 py-4">
              <div className="w-12 h-12 rounded-xl bg-bg2 grid place-items-center shrink-0"><Icon t={a.ActivityType} /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate">{a.ActivityName}</div><div className="text-tx2">{a.ActivityCost ? `From ${fmt(a.ActivityCost)} / guest` : fmt(0)} · {place(db, a.DestinationID).DestinationName}</div></div>
              <span className="badge bg-ebg text-efg">{a.ActivityType}</span><span className={`badge ${BD[a.DataStatus]}`}>{a.DataStatus}</span>
              <button className="text-br font-medium whitespace-nowrap" onClick={() => setSel(a)}>View details →</button>
            </div>
          ))}
          {!L.length && <div className="note">No results. Try “heritage”, “nature” or a place name.</div>}
        </div>
      </main>
      {sel && <PoiModal a={sel} onClose={() => setSel(null)} onPlan={() => start(mainDestinations(db).find((d) => d.Region === place(db, sel.DestinationID).Region)?.DestinationID)} />}
    </Shell>
  );
}
