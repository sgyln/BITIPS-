"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { AdjustModal, EditModal } from "@/components/TripModals";
import { useApp } from "@/components/Providers";
import useStartPlan from "@/components/useStartPlan";
import { mainDestinations, viewTrip } from "@/lib/engine";

export default function BudgetPage() {
  const r = useRouter(), { db, user } = useApp(), start = useStartPlan(), [sel, setSel] = useState(null), [m, setM] = useState(null);
  const L = db.itinerary.filter((i) => i.UserID === user.UserID && i.Status !== "Deleted").sort((a, b) => b.ItineraryID - a.ItineraryID).map((i) => viewTrip(db, i.ItineraryID));
  const v = L.find((x) => x.it.ItineraryID === sel) || L[0];
  const first = mainDestinations(db).find((d) => d.Status === "Active")?.DestinationID;
  if (!v) return <Shell active="Budget"><main className="flex-1 p-8"><h1 className="text-[28px] leading-9 font-semibold">Budget Overview</h1><div className="box text-center mt-4"><h2 className="text-[22px] font-semibold">No trips yet</h2><p className="text-tx2 my-2">Plan a trip to see its budget breakdown.</p><button className="btn-p" onClick={() => start(first)}>Create New Trip</button></div></main></Shell>;
  const T = v.totals, B = v.budget, df = T.deficit, f = v.fmt, pc = Math.abs(Math.round((df / B.TotalBudget) * 1000) / 10), ok = L.filter((x) => x.totals.deficit <= 0).length;
  const stat = (l, val, badge, cls) => <div className="box flex flex-col gap-1"><span className="lab text-tx2">{l}</span><b className="text-[28px] leading-9 tracking-[-.5px]">{val}</b><span className={`badge self-start ${cls}`}>{badge}</span></div>;
  const cats = [["Lodging", T.lodging, B.AccommodationBudget, "#3d6473"], ["Activities", T.activities, B.ActivityBudget, "#f59e0b"], ["Meals", T.meals, B.MealBudget, "#15803d"], ["Transportation", T.transport, B.TransportationBudget, "#e8592a"], ["Other", T.other, B.OtherBudget, "#9ca3af"]];
  const exp = db.expense.filter((e) => e.ItineraryID === v.it.ItineraryID);
  return (
    <Shell active="Budget">
      <main className="flex-1 overflow-auto p-8"><div className="max-w-[1120px] mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3 flex-wrap"><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Budget Overview</h1><select className="input !w-[260px] !h-11 !rounded-full" value={v.it.ItineraryID} onChange={(e) => setSel(+e.target.value)}>{L.map((x) => <option key={x.it.ItineraryID} value={x.it.ItineraryID}>{x.it.ItineraryName}</option>)}</select></div>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {stat("Total Budget", f(B.TotalBudget), B.BudgetStatus, "bg-bg2 text-tx2")}
          {stat("Planned Spend", f(T.sum), df > 0 ? `▲ ${pc}% over` : `▼ ${pc}% under`, df > 0 ? "bg-ebg text-efg" : "bg-ev text-ok")}
          {stat("Remaining", (df > 0 ? "-" : "") + f(Math.abs(df)), df > 0 ? "Deficit" : "Surplus", df > 0 ? "bg-ebg text-efg" : "bg-ev text-ok")}
          {stat("Trips Within Budget", `${ok} of ${L.length}`, "Across all trips", "bg-ev text-ok")}
        </div>
        <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
          <div className="box"><h2 className="text-lg font-semibold mb-1">Spend by Category</h2><div className="lab text-tx2">Planned spend vs allocated category budget (allocation rules set by the administrator)</div>
            {cats.map(([a, x, cap, c]) => { const w = cap ? Math.min(100, (x / cap) * 100) : 0; return <div key={a} className="mt-4"><div className="flex justify-between pb-1.5"><span>{a}</span><span>{f(x)} <span className="text-tx2">/ {f(cap)}</span>{x > cap && <span className="badge bg-ebg text-efg ml-2">over</span>}</span></div><div className="h-2.5 rounded-md bg-bg2 overflow-hidden"><i className="block h-full" style={{ width: `${w}%`, background: x > cap ? "#e8592a" : c }} /></div></div>; })}
            <div className="lab text-tx2 mt-4">Currency snapshot: {B.DisplayCurrency} at {B.ExchangeRate} (recorded {B.CreatedAt.slice(0, 10)})</div></div>
          <div className="box flex flex-col gap-2"><div className={`text-xl ${df > 0 ? "text-df" : "text-ok"}`}>{df > 0 ? `Over budget by ${f(df)}` : "Within budget"}</div>
            <div className="text-tx2 flex-1">{df > 0 ? `${v.it.ItineraryName} exceeds your total budget. Review ranked alternatives and accept or reject each one.` : `${v.it.ItineraryName} is within budget with ${f(-df)} to spare.`}</div>
            {df > 0 ? <><button className="btn-p" onClick={() => setM("opt")}>Optimize Plan</button><button className="btn" onClick={() => setM("edit")}>Adjust Budget</button></> : <button className="btn-p" onClick={() => r.push(`/trips/${v.it.ItineraryID}`)}>Open itinerary</button>}</div>
        </div>
        {exp.length > 0 && <div className="box"><h2 className="text-lg font-semibold mb-2">Recorded expenses (simulated)</h2>{exp.map((e) => <div key={e.ExpenseID} className="row"><span>{e.ExpenseCategory}<span className="lab text-tx2 ml-2">{e.ExpenseDate} · {e.PaymentMethod}</span></span><b>{f(e.ExpenseAmount)}</b></div>)}</div>}
      </div></main>
      {m === "opt" && <AdjustModal itId={v.it.ItineraryID} onClose={() => setM(null)} onEdit={() => setM("edit")} />}
      {m === "edit" && <EditModal itId={v.it.ItineraryID} onClose={() => setM(null)} />}
    </Shell>
  );
}
