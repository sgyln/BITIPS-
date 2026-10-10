"use client";
import { useState } from "react";
import { Ends, Field, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { applyAdjustments, suggestAdjustments, updateTrip, viewTrip } from "@/lib/engine";
import { insert, now, audit } from "@/lib/db";
import { buildItineraryPdf } from "@/lib/pdf";
import { CURS } from "@/lib/seed";

export function EditModal({ itId, onClose }) {
  const { db, commit, toast } = useApp(), v = viewTrip(db, itId);
  const [f, setF] = useState({ title: v.it.ItineraryName, budget: v.budget.TotalBudget, trav: v.it.NumberOfTravelers, cur: v.budget.DisplayCurrency }), [e, setE] = useState({});
  const save = () => {
    const x = {};
    if (!f.title.trim()) x.title = "Required"; if (!(f.budget >= 1000)) x.budget = "At least 1,000 PHP"; if (!(f.trav >= 1 && f.trav <= 10)) x.trav = "1 to 10";
    setE(x); if (Object.keys(x).length) return;
    commit((d) => updateTrip(d, itId, { ...f, title: f.title.trim() })); onClose(); toast("Trip updated");
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] font-semibold">Edit trip details</h2>
      <Field label="Trip name" error={e.title}><input className="input" value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} /></Field>
      <Field label="Total budget (PHP)" error={e.budget}><input type="number" className="input" value={f.budget} onChange={(x) => setF({ ...f, budget: +x.target.value })} /></Field>
      <Field label="Travelers" error={e.trav}><input type="number" className="input" value={f.trav} onChange={(x) => setF({ ...f, trav: +x.target.value })} /></Field>
      <Field label="Display currency"><select className="input" value={f.cur} onChange={(x) => setF({ ...f, cur: x.target.value })}>{Object.keys(CURS).map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Ends><button className="btn" onClick={onClose}>Cancel</button><button className="btn-p" onClick={save}>Save</button></Ends>
    </Modal>
  );
}

export function ExportModal({ itId, onClose }) {
  const { db, commit, toast, user } = useApp();
  const [z, setZ] = useState("A4"), [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const { doc, name } = await buildItineraryPdf(db, itId, z); doc.save(name);
      commit((d) => { insert(d, "pdf_report", { ItineraryID: itId, UserID: user.UserID, ReportType: "Itinerary & Expense Report", GeneratedDate: now(), FileName: name, ReportStatus: "Generated" }); audit(d, user.UserID, "PDF_EXPORT", name); });
      toast("PDF saved"); onClose();
    } catch { toast("Couldn't create the PDF"); setBusy(false); }
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] font-semibold">Export PDF</h2><p className="text-tx2">Schedule, route overview, expense breakdown and any simulated transaction reference.</p>
      <Field label="Page size"><select className="input" value={z} onChange={(e) => setZ(e.target.value)}><option>A4</option><option>Letter</option></select></Field>
      <Ends><button className="btn" onClick={onClose}>Cancel</button><button className="btn-p" disabled={busy} onClick={go}>{busy ? "Creating…" : "Export PDF"}</button></Ends>
    </Modal>
  );
}

// Traveler-controlled adjustment: each ranked suggestion is accepted or rejected individually.
export function AdjustModal({ itId, onClose, onEdit }) {
  const { db, commit, toast } = useApp(), v = viewTrip(db, itId);
  const [sugs] = useState(() => suggestAdjustments(db, itId));
  const [on, setOn] = useState(() => new Set(sugs.filter((s) => s.preselected).map((s) => s.id)));
  const df = v.totals.deficit, saved = sugs.filter((s) => on.has(s.id)).reduce((t, s) => t + s.saving, 0), left = df - saved;
  const toggle = (id) => { const n = new Set(on); n.has(id) ? n.delete(id) : n.add(id); setOn(n); };
  const apply = () => { commit((d) => applyAdjustments(d, itId, sugs.filter((s) => on.has(s.id)))); onClose(); toast("Recalculated and revalidated."); };
  const C = { pref: "Preference", budget: "Budget", schedule: "Schedule", data: "Data", route: "Route" };
  return (
    <Modal onClose={onClose} dark wide>
      <h2 className="text-[22px] font-semibold">Optimize Your Budget</h2>
      <div className="bg-ebg rounded-xl p-4 my-4">
        <div className="text-df font-medium text-[15px]">{df > 0 ? "Budget Deficit Detected: -" + v.fmt(df) : "Your plan is within budget"}</div>
        <div>{df > 0 ? `Accept or reject each suggestion. Nothing changes until you confirm. Target: within ${v.fmt(v.budget.TotalBudget)}.` : "No changes are needed."}</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {sugs.map((s) => (
          <button key={s.id} onClick={() => toggle(s.id)} className={`text-left rounded-[20px] border p-3.5 ${on.has(s.id) ? "border-tx bg-bg2" : "border-bd bg-white"}`}>
            <div className="flex justify-between gap-2"><div className="lab text-tx2 line-through">{s.fromName}</div><span className="lab">{on.has(s.id) ? "✓ Accepted" : "Rejected"}</span></div>
            <div className="font-semibold mt-0.5">{s.toName}{s.nights ? " (all nights)" : ""}</div>
            <div className="flex gap-2 mt-1.5 flex-wrap"><span className="badge bg-af text-br">{Math.round(s.score * 100)}% match</span><span className="badge bg-ev text-ok">Saves {v.fmt(s.saving)}</span></div>
            <div className="lab text-tx2 mt-1.5">{Object.keys(C).map((k) => `${C[k]} ${Math.round(s.parts[k] * 100)}`).join(" · ")}</div>
          </button>
        ))}
      </div>
      {!sugs.length && <div className="note note-w">No lower-cost alternatives fit the schedule.</div>}
      {df > 0 && sugs.length > 0 && <div className={`note ${left > 0 ? "note-w" : ""}`}>{left > 0 ? `Still ${v.fmt(left)} over with the selected changes.` : `Selected changes bring the plan ${v.fmt(-left)} under budget.`}</div>}
      <Ends>
        <button className="btn" onClick={onClose}>Keep Original</button>
        {df > 0 && <button className="btn" onClick={onEdit}>Adjust Budget</button>}
        <button className="btn-p" disabled={!on.size} onClick={apply}>Confirm &amp; Recalculate</button>
      </Ends>
    </Modal>
  );
}
