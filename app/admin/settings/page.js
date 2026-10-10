"use client";
import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Ends, Field, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { audit } from "@/lib/db";
import { RULES0 } from "@/lib/seed";
import { BD } from "@/lib/consts";

const NUM = [["speedKmh", "Average local speed (km/h)"], ["circuity", "Road circuity factor"], ["mealMinutes", "Meal duration (minutes)"], ["maxDays", "Maximum trip length (days)"], ["tricycleCapacity", "Tricycle capacity (persons)"], ["taxiCapacity", "Taxi capacity (persons)"]];
const AL = [["lodging", "Lodging"], ["meals", "Meals"], ["activities", "Activities"], ["transport", "Transportation"], ["other", "Other"]];
const WT = [["pref", "Preference match"], ["budget", "Budget benefit"], ["schedule", "Schedule fit"], ["data", "Data completeness"], ["route", "Route fit"]];

export default function RulesPage() {
  const { db, user, commit, toast } = useApp(), [r, setR] = useState(() => structuredClone(db.system_rule)), [err, setErr] = useState(""), [reset, setReset] = useState(false);
  const pct = (g) => Object.values(r[g]).reduce((s, x) => s + Number(x), 0);
  const save = () => {
    for (const [k] of NUM) if (!(Number(r[k]) > 0)) return setErr("All numeric rules must be greater than 0.");
    if (Math.abs(pct("alloc") - 1) > 0.001) return setErr(`Budget allocation must total 100% (now ${Math.round(pct("alloc") * 100)}%).`);
    if (Math.abs(pct("weights") - 1) > 0.001) return setErr(`Ranking weights must total 100% (now ${Math.round(pct("weights") * 100)}%).`);
    setErr(""); const n = structuredClone(r); NUM.forEach(([k]) => (n[k] = Number(n[k]))); ["alloc", "weights"].forEach((g) => Object.keys(n[g]).forEach((k) => (n[g][k] = Number(n[g][k]))));
    commit((d) => { d.system_rule = { ...d.system_rule, ...n }; audit(d, user.UserID, "RULES_UPDATED", "System rules changed"); }); toast("Rules saved (apply to newly generated itineraries)");
  };
  const set = (g, k, v) => setR(g ? { ...r, [g]: { ...r[g], [k]: v } } : { ...r, [k]: v });
  const grp = (title, g, list, note) => (
    <div className="box"><b>{title}</b><div className="lab text-tx2">{note} Total: {Math.round(pct(g) * 100)}%</div>
      <div className="grid sm:grid-cols-3 gap-x-3">{list.map(([k, l]) => <Field key={k} label={`${l} (%)`}><input type="number" className="input" value={Math.round(r[g][k] * 1000) / 10} onChange={(e) => set(g, k, e.target.value === "" ? 0 : +e.target.value / 100)} /></Field>)}</div></div>
  );
  return (
    <AdminShell active="Rules">
      <div className="max-w-[900px] flex flex-col gap-4">
        <div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">System rules</h1><div className="text-tx2">Deterministic parameters used by budget allocation, itinerary generation and ranked suggestions.</div></div>
        {err && <div className="note note-w">{err}</div>}
        <div className="box"><b>Scheduling &amp; routing</b><div className="grid sm:grid-cols-3 gap-x-3">{NUM.map(([k, l]) => <Field key={k} label={l}><input type="number" step="any" className="input" value={r[k]} onChange={(e) => set(null, k, e.target.value)} /></Field>)}</div></div>
        {grp("Budget allocation", "alloc", AL, "Share of the total budget assigned to each category.")}
        {grp("Ranking weights", "weights", WT, "Used to score lower-cost alternatives.")}
        <div className="box"><b>Data-source labels</b><div className="flex gap-2 flex-wrap mt-2">{Object.keys(BD).map((k) => <span key={k} className={`badge ${BD[k]}`}>{k}</span>)}</div><div className="lab text-tx2 mt-2">Live: provider checked in the last 5 minutes · Cached: older provider record · Admin-Maintained / Estimated: catalog label set by an administrator.</div></div>
        <Ends><button className="btn" onClick={() => setReset(true)}>Reset to defaults</button><button className="btn-p" onClick={save}>Save rules</button></Ends>
      </div>
      {reset && <Modal onClose={() => setReset(false)}><h2 className="text-[22px] font-semibold">Reset rules?</h2><p className="text-tx2">All rules return to their default values.</p><Ends><button className="btn" onClick={() => setReset(false)}>Cancel</button><button className="btn-p" onClick={() => { setR(structuredClone(RULES0)); commit((d) => { d.system_rule = structuredClone(RULES0); audit(d, user.UserID, "RULES_RESET", "Defaults restored"); }); setReset(false); toast("Defaults restored"); }}>Reset</button></Ends></Modal>}
    </AdminShell>
  );
}
