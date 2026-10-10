"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Ends } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { catalog, computeBudget, daysBetween, generate, minFeasible, place } from "@/lib/engine";
import { queryProvider, refsFor, storeAvailability } from "@/lib/provider";

const STEPS = ["Sourcing catalog records from curated pilot database…", "Querying the mock provider for availability…", "Checking opening hours and sequencing time blocks…", "Balancing cumulative line items against budget ceiling…"];
export default function BuildingPage() {
  const r = useRouter(), { db, draft, setDraft, commit, user, prefRow, picks, setPicks, toast, failProvider } = useApp();
  const [k, setK] = useState(0), [stop, setStop] = useState(null), started = useRef(false);

  useEffect(() => {
    if (!draft) { r.replace("/plan"); return; }
    if (started.current) return; started.current = true;
    const ts = [1, 2, 3].map((i) => setTimeout(() => setK(i), i * 600));
    (async () => {
      const dest = place(db, draft.destId), dates = daysBetween(draft.start, draft.end), c = catalog(db, dest.Region);
      await new Promise((res) => setTimeout(res, 2000));
      if (!c.activities.length) return setStop({ type: "limited", dest });
      const min = minFeasible(db, draft.destId, dates.length, draft.trav);
      if (draft.budget < min) return setStop({ type: "infeasible", min });
      const refs = refsFor(db, dest.Region, dates), q = await queryProvider(refs, { outage: failProvider.current });
      const res = commit((d) => { const id = generate(d, { userId: user.UserID, destId: draft.destId, title: draft.title, origin: draft.origin, start: draft.start, end: draft.end, trav: draft.trav, budget: draft.budget, cur: draft.cur, picks, avail: storeAvailability(d, refs, q) }); return { id, deficit: computeBudget(d, id).deficit, missed: picks.filter((a) => !d.itinerary_item.some((i) => i.ItineraryID === id && i.ActivityID === a)).map((a) => d.activity.find((x) => x.ActivityID === a)?.ActivityName) }; });
      setPicks([]); setDraft(null); r.replace(`/trips/${res.id}`);
      if (res.deficit > 0 && prefRow?.NotifyBudgetAlerts !== false) toast("Budget alert: this plan is over budget. Open the deficit chip to review adjustments.");
      if (res.missed.length) toast(`Couldn't fit: ${res.missed.join(", ")} (opening hours or travel time).`);
      else if (!q.live) toast("Provider unavailable. Used cached records and catalog data.");
    })();
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const raise = () => { setDraft({ ...draft, budget: Math.ceil(stop.min / 500) * 500 }); r.push("/plan"); };
  const shorten = () => { const e = new Date(draft.end + "T00:00:00Z"); e.setUTCDate(e.getUTCDate() - 1); setDraft({ ...draft, end: e.toISOString().slice(0, 10) < draft.start ? draft.start : e.toISOString().slice(0, 10) }); r.push("/plan"); };
  return (
    <Shell active="Explore">
      <main className="flex-1 grid place-items-center p-8">
        {stop?.type === "infeasible" ? (
          <div className="box max-w-[520px]"><h2 className="text-[22px] font-semibold">No feasible plan</h2>
            <p className="text-tx2 mt-2">Even the cheapest catalog options need about <b>PHP {Math.round(stop.min).toLocaleString()}</b> for this trip. Your budget is PHP {draft.budget.toLocaleString()}.</p>
            <Ends><button className="btn" onClick={shorten}>Shorten Trip Duration</button><button className="btn-p" onClick={raise}>Increase Budget Limit</button></Ends></div>
        ) : stop?.type === "limited" ? (
          <div className="box max-w-[520px]"><h2 className="text-[22px] font-semibold">Map browsing only</h2>
            <p className="text-tx2 mt-2">{stop.dest.DestinationName} is outside the curated pilot coverage, so no itinerary data exists yet. You can still browse and search it on the map.</p>
            <Ends><button className="btn" onClick={() => r.push("/plan")}>Choose another destination</button><button className="btn-p" onClick={() => r.push("/map")}>Open map</button></Ends></div>
        ) : (
          <div className="box w-[400px]"><div className="spin" /><h2 className="text-center text-[22px] font-semibold mt-4">Building your itinerary</h2>
            {STEPS.map((s, j) => <div key={j} className={`flex gap-2.5 mt-3 ${j > k ? "text-tx2" : ""}`}><span className="w-3.5 text-ok">{j < k ? "✓" : j === k ? "◌" : ""}</span><span>{s}</span></div>)}</div>
        )}
      </main>
    </Shell>
  );
}
