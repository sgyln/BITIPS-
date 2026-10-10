"use client";
import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Field } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { audit } from "@/lib/db";
import { computeBudget, daysBetween, place } from "@/lib/engine";

const Bars = ({ rows, fmt = (x) => x, color = "#3d6473" }) => { const mx = Math.max(1, ...rows.map((r) => r[1])); return rows.length ? rows.map(([a, b]) => <div key={a} className="mt-2.5"><div className="flex justify-between"><span>{a}</span><b>{fmt(b)}</b></div><div className="h-2.5 rounded-md bg-bg2 overflow-hidden"><i className="block h-full" style={{ width: `${(b / mx) * 100}%`, background: color }} /></div></div>) : <div className="text-tx2 mt-2">No data in this range.</div>; };
const count = (a) => Object.entries(a.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((p, q) => q[1] - p[1]);

export default function AdminDashboard() {
  const { db, user, commit, toast } = useApp();
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [gen, setGen] = useState(null);
  // 8.1 report request -> 8.2 aggregate D1, D3, D4, D6, D7 -> 8.3 analytics report
  const R = useMemo(() => {
    const ok = (s) => (!from || s.slice(0, 10) >= from) && (!to || s.slice(0, 10) <= to);
    const its = db.itinerary.filter((i) => i.Status !== "Deleted" && ok(i.CreatedAt)), travelers = db.user.filter((u) => u.UserRole === "Traveler");
    const tx = db.transaction.filter((t) => t.TransactionStatus === "Success" && ok(t.TransactionDate));
    const spend = {}, peak = {};
    its.forEach((i) => { const m = i.CreatedAt.slice(0, 7), c = computeBudget(db, i.ItineraryID); (spend[m] ||= { n: 0, budget: 0, planned: 0 }); spend[m].n++; spend[m].budget += c.budget.TotalBudget; spend[m].planned += c.sum; daysBetween(i.StartDate, i.EndDate).forEach((d) => (peak[d] = (peak[d] || 0) + 1)); });
    const prefs = db.user_preference.filter((p) => travelers.some((u) => u.UserID === p.UserID));
    return {
      its, travelers, tx, bookings: db.booking.filter((b) => b.BookingStatus === "Confirmed" && ok(b.BookingDate)).length, revenue: tx.reduce((s, t) => s + t.Amount, 0), audits: db.audit_log.filter((a) => ok(a.ActionDateTime)).length,
      popularity: count(its.map((i) => place(db, i.DestinationID)?.DestinationName)), acts: count(prefs.flatMap((p) => (p.PreferredActivityType || "").split(",").filter(Boolean))), accs: count(prefs.map((p) => p.PreferredAccommodationType).filter(Boolean)), meals: count(prefs.map((p) => p.PreferredMealPreference).filter(Boolean)),
      spend: Object.entries(spend).sort().map(([m, x]) => [m, x.n, Math.round(x.budget / x.n), Math.round(x.planned / x.n)]), peak: Object.entries(peak).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [db, from, to]);
  const peso = (n) => "₱" + Math.round(n).toLocaleString("en-US");
  const generate = () => { setGen(new Date().toLocaleString()); commit((d) => audit(d, user.UserID, "REPORT_GENERATED", `Analytics ${from || "start"} to ${to || "now"}`)); toast("Analytics report generated"); };
  const csv = () => {
    const rows = [["Section", "Item", "Value"], ...R.popularity.map(([a, b]) => ["Destination popularity", a, b]), ...R.acts.map(([a, b]) => ["Preferred activity type", a, b]), ...R.accs.map(([a, b]) => ["Accommodation preference", a, b]), ...R.meals.map(([a, b]) => ["Meal preference", a, b]), ...R.spend.map(([m, n, b, p]) => ["Spending " + m, `${n} trips: avg budget / avg planned`, `${b} / ${p}`])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "bitips-analytics.csv"; a.click();
    commit((d) => audit(d, user.UserID, "REPORT_EXPORTED", "Analytics CSV")); toast("CSV download started");
  };
  return (
    <AdminShell active="Dashboard">
      <div className="max-w-[1100px] flex flex-col gap-4">
        <div className="flex justify-between items-end flex-wrap gap-3"><div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Dashboard &amp; Analytics</h1><div className="text-tx2">Aggregated from users, itineraries, budgets, transactions and the audit log.</div></div>
          <div className="flex gap-2 items-end flex-wrap"><Field label="From"><input type="date" className="input !h-10" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To"><input type="date" className="input !h-10" value={to} onChange={(e) => setTo(e.target.value)} /></Field><button className="btn" onClick={generate}>Generate report</button><button className="btn-p !h-10" onClick={csv}>Export CSV</button></div></div>
        {gen && <div className="note">Report generated {gen}. Figures below reflect the selected range.</div>}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          {[["Travelers", R.travelers.length], ["Itineraries", R.its.length], ["Confirmed bookings", R.bookings], ["Simulated revenue", peso(R.revenue)], ["Audit events", R.audits]].map(([a, b]) => <div key={a} className="box"><div className="lab text-tx2">{a}</div><b className="text-[28px] leading-9">{b}</b></div>)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="box"><b>Destination popularity</b><Bars rows={R.popularity} /></div>
          <div className="box"><b>Preferred activity types</b><Bars rows={R.acts} color="#f59e0b" /></div>
          <div className="box"><b>Accommodation preferences</b><Bars rows={R.accs} color="#e8592a" /></div>
          <div className="box"><b>Meal preferences</b><Bars rows={R.meals} color="#15803d" /></div>
        </div>
        <div className="box"><b>Visitor spending trends</b>
          <table className="w-full mt-2"><thead><tr><th className="th">Month created</th><th className="th">Trips</th><th className="th">Avg budget</th><th className="th">Avg planned spend</th></tr></thead><tbody>{R.spend.map(([m, n, b, p]) => <tr key={m}><td className="td">{m}</td><td className="td">{n}</td><td className="td">{peso(b)}</td><td className="td">{peso(p)}</td></tr>)}</tbody></table>{!R.spend.length && <div className="text-tx2 mt-2">No itineraries in this range.</div>}</div>
        <div className="box"><b>Peak travel dates</b><Bars rows={R.peak} color="#3d6473" /></div>
      </div>
    </AdminShell>
  );
}
