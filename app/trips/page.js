"use client";
import { useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Ends, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import useStartPlan from "@/components/useStartPlan";
import { dateRange, mainDestinations, viewTrip } from "@/lib/engine";
import { audit } from "@/lib/db";

export default function TripsPage() {
  const { db, user, commit, toast } = useApp(), start = useStartPlan(), [f, setF] = useState("All"), [del, setDel] = useState(null);
  const trips = db.itinerary.filter((i) => i.UserID === user.UserID && i.Status !== "Deleted").sort((a, b) => b.ItineraryID - a.ItineraryID).map((i) => viewTrip(db, i.ItineraryID));
  const over = (v) => v.totals.deficit > 0;
  const L = trips.filter((v) => f === "All" || (f === "Booked" && v.it.Status === "Booked") || (f === "Drafts" && v.it.Status !== "Booked") || (f === "Over budget" && over(v)));
  const first = mainDestinations(db).find((d) => d.Status === "Active")?.DestinationID;
  const doDel = () => {
    const prev = del.it.Status; commit((d) => { d.itinerary.find((x) => x.ItineraryID === del.it.ItineraryID).Status = "Deleted"; audit(d, user.UserID, "ITINERARY_DELETED", del.it.ItineraryName); }); setDel(null);
    toast("Itinerary deleted", "Undo", () => commit((d) => { d.itinerary.find((x) => x.ItineraryID === del.it.ItineraryID).Status = prev; }));
  };
  return (
    <Shell active="Trips">
      <main className="flex-1 overflow-auto p-8"><div className="max-w-[1120px] mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center"><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">My Trips</h1><button className="btn-p" onClick={() => start(first)}>+ New Trip</button></div>
        <div className="flex gap-2 flex-wrap">{["All", "Booked", "Drafts", "Over budget"].map((c) => <button key={c} className={`chip ${f === c ? "chip-on" : ""}`} onClick={() => setF(c)}>{c}</button>)}</div>
        {L.length ? <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">{L.map((v) => (
          <div key={v.it.ItineraryID} className="box">
            <div className="text-base font-medium">{v.it.ItineraryName}</div><div className="lab text-tx2">{dateRange(v.it.StartDate, v.it.EndDate)} · {v.dest.DestinationName}</div>
            <div className="text-2xl my-2">{v.fmt(v.totals.sum)}</div>
            <div className="flex justify-between items-center gap-2">
              <span className="flex gap-2 flex-wrap"><span className={`badge ${v.it.Status === "Booked" ? "bg-violet-100 text-violet-700" : "bg-bg2 text-tx2"}`}>{v.it.Status === "Booked" ? "BOOKED (SIMULATED)" : "Draft"}</span>{over(v) && <span className="badge bg-ebg text-efg">Over budget</span>}</span>
              <span className="whitespace-nowrap"><button className="text-tx2 mr-3" onClick={() => setDel(v)}>Delete</button><Link href={`/trips/${v.it.ItineraryID}`} className="text-br font-medium">Open →</Link></span>
            </div>
          </div>))}</div>
        : <div className="box text-center"><h2 className="text-[22px] font-semibold">{trips.length ? "No trips match this filter" : "No trips yet"}</h2><p className="text-tx2 my-2">Plan your first budget-based itinerary.</p><button className="btn-p" onClick={() => start(first)}>Create New Trip</button></div>}
      </div></main>
      {del && <Modal onClose={() => setDel(null)}><h2 className="text-[22px] font-semibold">Delete this itinerary?</h2><p className="text-tx2">{del.it.ItineraryName} will be removed. You can undo right after.</p><Ends><button className="btn" onClick={() => setDel(null)}>Cancel</button><button className="btn-p" onClick={doDel}>Delete</button></Ends></Modal>}
    </Shell>
  );
}
