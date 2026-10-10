"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Ends, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { CURS } from "@/lib/seed";

const LANGS = ["English", "Filipino", "Hiligaynon", "Cebuano"];
export default function SettingsPage() {
  const r = useRouter(), { db, user, prefRow, setSetting, setPicks, setSearch, toast } = useApp(), [m, setM] = useState(null);
  const row = prefRow || {};
  const tg = (k, l) => (
    <div className="row items-center"><span>{l}</span>
      <button aria-label={l} onClick={() => setSetting({ [k]: !(row[k] ?? false) })} className={`relative w-11 h-[26px] rounded-full ${row[k] ? "bg-tx" : "bg-bd"}`}><i className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all ${row[k] ? "left-[21px]" : "left-[3px]"}`} /></button></div>
  );
  const mine = db.itinerary.filter((i) => i.UserID === user.UserID);
  const json = JSON.stringify({ user: { ...user, PasswordHash: undefined }, preferences: prefRow, itineraries: mine.map((i) => ({ ...i, items: db.itinerary_item.filter((x) => x.ItineraryID === i.ItineraryID), budget: db.trip_budget.find((b) => b.ItineraryID === i.ItineraryID) })), bookings: db.booking.filter((b) => b.UserID === user.UserID), transactions: db.transaction.filter((t) => t.UserID === user.UserID) }, null, 1);
  const pick = (k, list, label) => (
    <Modal onClose={() => setM(null)}><h2 className="text-[22px] font-semibold">{label}</h2>
      {list.map((v) => <button key={v} className="opt" onClick={() => { setSetting({ [k]: v }); setM(null); toast(`${v} selected${k === "Language" ? " (text stays English in this prototype)" : ""}`); }}><span>{v}</span><span>{row[k] === v ? "✓" : ""}</span></button>)}
      <Ends><button className="btn" onClick={() => setM(null)}>Close</button></Ends></Modal>
  );
  return (
    <Shell active="Profile">
      <main className="flex-1 overflow-auto p-8"><div className="max-w-[640px] flex flex-col gap-4">
        <div className="flex justify-between items-center"><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Settings</h1><button className="btn" onClick={() => r.push("/profile")}>← Back to profile</button></div>
        <div className="box"><b>Notifications</b>{tg("NotifyBudgetAlerts", "Budget alerts")}{tg("NotifyReminders", "Trip reminders")}{tg("NotifyTips", "Tips & offers")}</div>
        <div className="box"><b>Display &amp; Units</b><div className="row"><span>Currency</span><button className="text-br" onClick={() => setM("cur")}>{row.DisplayCurrency || "PHP"} →</button></div><div className="row"><span>Language</span><button className="text-br" onClick={() => setM("lang")}>{row.Language || "English"} →</button></div></div>
        <div className="box"><b>Data &amp; Privacy</b><div className="row"><span>Cached search data</span><button className="text-br" onClick={() => setM("clear")}>Clear →</button></div><div className="row"><span>Download my data</span><button className="text-br" onClick={() => setM("data")}>View →</button></div></div>
      </div></main>
      {m === "cur" && pick("DisplayCurrency", Object.keys(CURS), "Currency")}
      {m === "lang" && pick("Language", LANGS, "Language")}
      {m === "clear" && <Modal onClose={() => setM(null)}><h2 className="text-[22px] font-semibold">Clear cached data?</h2><p className="text-tx2">Clears your search text and queued activities. Saved trips are kept.</p><Ends><button className="btn" onClick={() => setM(null)}>Cancel</button><button className="btn-p" onClick={() => { setPicks([]); setSearch({ q: "", c: "All" }); setM(null); toast("Cached data cleared"); }}>Clear</button></Ends></Modal>}
      {m === "data" && <Modal onClose={() => setM(null)} wide><h2 className="text-[22px] font-semibold">Download my data</h2><textarea readOnly value={json} className="w-full h-[240px] mt-3 border border-bd rounded-xl p-3 font-mono text-xs bg-white" /><Ends><button className="btn" onClick={() => setM(null)}>Close</button><button className="btn-p" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = "bitips-my-data.json"; a.click(); toast("Download started"); }}>Download JSON</button></Ends></Modal>}
    </Shell>
  );
}
