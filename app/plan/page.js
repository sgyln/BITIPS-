"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Ends, Field } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { daysBetween, mainDestinations } from "@/lib/engine";
import { CURS } from "@/lib/seed";

export default function PlanPage() {
  const r = useRouter(), { db, draft, setDraft, picks } = useApp();
  const [f, setF] = useState(draft), [err, setErr] = useState({});
  useEffect(() => { if (!draft) r.replace("/"); }, [draft, r]);
  if (!f) return null;
  const maxDays = db.system_rule.maxDays, on = (k, n) => (e) => setF({ ...f, [k]: n ? +e.target.value : e.target.value });
  const bad = (k) => (err[k] ? "border-df" : "");
  const submit = (e) => {
    e.preventDefault(); const x = {};
    if (!f.title.trim()) x.title = "Give your trip a title"; if (!f.origin.trim()) x.origin = "Enter your origin"; if (!f.start) x.start = "Pick a start date";
    if (!f.end || f.end < f.start) x.end = "End date must be on or after start"; else if (daysBetween(f.start, f.end).length > maxDays) x.end = `Trips are limited to ${maxDays} days`;
    if (!(f.trav >= 1 && f.trav <= 10)) x.trav = "1 to 10 travelers"; if (!(f.budget >= 1000)) x.budget = "Enter a budget of at least 1,000 PHP";
    setErr(x); if (Object.keys(x).length) return;
    setDraft({ ...f, title: f.title.trim() }); r.push("/plan/building");
  };
  return (
    <Shell active="Explore">
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Plan a trip</h1>
        <p className="text-tx2">Trip parameters feed the rule-based generator. Your saved preferences weight the options.{picks.length ? ` ${picks.length} queued activit${picks.length > 1 ? "ies" : "y"} will be included.` : ""}</p>
        <form onSubmit={submit} noValidate className="box max-w-[640px] mt-4">
          <Field label="Trip title" error={err.title}><input className={`input ${bad("title")}`} value={f.title} onChange={on("title")} placeholder="e.g. Weekend Heritage Escape" /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Origin" error={err.origin}><input className={`input ${bad("origin")}`} value={f.origin} onChange={on("origin")} /></Field>
            <Field label="Destination"><select className="input" value={f.destId} onChange={on("destId", 1)}>{mainDestinations(db).map((d) => <option key={d.DestinationID} value={d.DestinationID}>{d.DestinationName}{d.Status === "Limited" ? " (map only)" : ""}</option>)}</select></Field>
            <Field label="Start date" error={err.start}><input type="date" min="2026-10-10" className={`input ${bad("start")}`} value={f.start} onChange={on("start")} /></Field>
            <Field label="End date" error={err.end}><input type="date" className={`input ${bad("end")}`} value={f.end} onChange={on("end")} /></Field>
            <Field label="Travelers" error={err.trav}><input type="number" min="1" max="10" className={`input ${bad("trav")}`} value={f.trav} onChange={on("trav", 1)} /></Field>
            <Field label="Total budget (PHP)" error={err.budget}><input type="number" className={`input ${bad("budget")}`} value={f.budget} onChange={on("budget", 1)} /></Field>
          </div>
          <Field label="Display currency"><select className="input" value={f.cur} onChange={on("cur")}>{Object.keys(CURS).map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Ends><button type="button" className="btn" onClick={() => r.push("/")}>Cancel</button><button className="btn-p">Generate itinerary</button></Ends>
        </form>
      </main>
    </Shell>
  );
}
