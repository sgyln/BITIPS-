"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import MapView from "@/components/MapView";
import { AdjustModal, EditModal, ExportModal } from "@/components/TripModals";
import { Ends, Icon, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { BD } from "@/lib/consts";
import { addActivity, activeActivities, recalc, dateRange, fD, fT, place, removeItem, swapItem, swapOptions, toMin, viewTrip, regionOf } from "@/lib/engine";
import { queryProvider, refsFor, sourceBadge, storeAvailability } from "@/lib/provider";
import { daysBetween } from "@/lib/engine";

const SLOTS = [["M", "Morning", "bg-mo"], ["A", "Afternoon", "bg-af"], ["E", "Evening", "bg-ev"]];
const slotOf = (t) => (toMin(t) < 720 ? "M" : toMin(t) < 1020 ? "A" : "E");

export default function StudioPage() {
  const { id } = useParams(), itId = Number(id), r = useRouter(), A = useApp(), { db, commit, toast, failProvider, failPayment } = A;
  const [day, setDay] = useState(0), [m, setM] = useState(null), [busy, setBusy] = useState(false);
  const v = viewTrip(db, itId);
  useEffect(() => {
    const h = (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || m || e.metaKey || e.ctrlKey) return;
      if (e.key === "a") setM({ k: "add" });
      if (e.key === "f") { failProvider.current = !failProvider.current; failPayment.current = failProvider.current; toast(failProvider.current ? "Failure simulation ON: provider outage and next payment declined" : "Failure simulation off"); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [m, failProvider, failPayment, toast]);
  if (!v || v.it.UserID !== A.user.UserID || v.it.Status === "Deleted") return <Shell active="Trips"><div className="p-8">Trip not found. <Link className="underline" href="/trips">Back to My Trips</Link></div></Shell>;
  const { it, totals: T, fmt } = v, D = v.days[Math.min(day, v.days.length - 1)], close = () => setM(null), df = T.deficit;
  const booked = it.Status === "Booked";

  const refresh = async () => {
    setBusy(true);
    const refs = refsFor(db, regionOf(db, it), daysBetween(it.StartDate, it.EndDate)), q = await queryProvider(refs, { outage: failProvider.current });
    commit((d) => {
      const map = storeAvailability(d, refs, q);
      d.itinerary_item.filter((i) => i.ItineraryID === itId && !i.TransportID).forEach((i) => { const k = i.ActivityID ? "activity" : i.MealID ? "meal" : "lodging", idv = i.ActivityID || i.MealID || i.AccommodationID, s = map[`${k}:${idv}:${i.ItemDate}`]; if (s && i.ItemStatus !== "Booked") i.ItemStatus = s === "Available" ? "Planned" : s; });
    });
    setBusy(false); toast(q.live ? "Availability refreshed from provider" : "Provider unavailable. Showing cached records and catalog data.");
  };
  const doSwap = (itemId, toId) => { const e = commit((d) => swapItem(d, itId, itemId, toId)); close(); toast(e || "Swapped"); };
  const doAdd = (a) => { const e = commit((d) => addActivity(d, itId, D.date, a.ActivityID)); close(); toast(e || `Added ${a.ActivityName}`); };
  const doRem = (item) => { const copy = { ...item }; commit((d) => removeItem(d, itId, item.ItineraryItemID)); close(); toast("Activity removed", "Undo", () => commit((d) => { d.itinerary_item.push(copy); recalc(d, itId); })); };
  const stops = D.stops.map((s) => ({ lat: s.pl.Latitude, lng: s.pl.Longitude, name: s.name }));

  return (
    <Shell active="Trips">
      <div className="flex-1 grid grid-cols-[minmax(460px,700fr)_minmax(280px,660fr)] min-h-0">
        <main className="bg-bg2 p-8 overflow-auto flex flex-col gap-4 min-w-0">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">{it.ItineraryName}</h1><div className="text-tx2">{dateRange(it.StartDate, it.EndDate)} · {it.NumberOfTravelers} traveler{it.NumberOfTravelers > 1 ? "s" : ""} · {v.dest.DestinationName} · <b>{it.Status}</b></div></div>
            <div className="flex gap-2 flex-wrap"><button className="btn" disabled={busy} onClick={refresh}>{busy ? "Checking…" : "Check availability"}</button><button className="btn" onClick={() => setM({ k: "exp" })}>Export PDF</button><button className="btn" onClick={() => setM({ k: "edit" })}>Edit Details</button></div>
          </div>
          <div className="flex gap-2 flex-wrap">{v.days.map((x, i) => <button key={x.date} className={`chip ${i === day ? "chip-on" : ""}`} onClick={() => setDay(i)}>Day {i + 1}</button>)}<button className="chip" onClick={() => setM({ k: "add" })}>+ Add activity</button></div>
          {SLOTS.map(([k, label, c]) => {
            const L = D.stops.map((s, idx) => ({ ...s, idx })).filter((s) => slotOf(s.item.StartTime) === k); if (!L.length) return null;
            return (
              <div key={k} className="max-w-[660px]">
                <div className={`inline-block px-4 py-1 rounded-t-[10px] lab ${c}`}>{label} · subtotal {fmt(L.reduce((s, x) => s + x.item.EstimatedCost, 0))}</div>
                <div className={`${c} rounded-b-2xl rounded-tr-2xl p-3 flex flex-col gap-2`}>
                  {L.map((s) => { const leg = D.legs.find((g) => g.to === s.idx), badge = sourceBadge(db, s.item, s.row, s.kind), st = s.item.ItemStatus; return (
                    <div key={s.item.ItineraryItemID}>
                      {leg && <div className="lab text-tx2 px-2 pb-1">{leg.boat ? "⚠ Route unavailable · ocean boundary" : `↓ ${leg.mode || "Local"} · ${leg.km.toFixed(1)} km · ${leg.mins} min · ${fmt(leg.cost)}`}</div>}
                      <div className="bg-white rounded-2xl p-2.5 min-h-[72px] flex items-center gap-3">
                        <span className="font-semibold text-tx2">::</span>
                        <div className="w-[52px] h-[52px] rounded-xl grid place-items-center shrink-0" style={{ background: "linear-gradient(127deg,#d9c9b4,#b89f82 71%)" }}><Icon t={s.kind === "meal" ? "Culinary" : s.row.ActivityType} /></div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="lab text-br">{fT(s.item.StartTime)} – {fT(s.item.EndTime)} · {fD(toMin(s.item.EndTime) - toMin(s.item.StartTime))}</span>
                          <span className="font-semibold truncate">{s.name}</span>
                          <span className="lab text-tx2 flex gap-2 items-center flex-wrap">{fmt(s.item.EstimatedCost)}<span className={`badge ${BD[badge]}`}>{badge}</span>{(st === "Limited" || st === "Unavailable") && <span className="badge bg-ebg text-df">{st}</span>}<span>{s.pl.DestinationName}</span></span>
                        </div>
                        {!booked && <><button className="btn-sm" onClick={() => setM({ k: "swap", item: s.item })}>Swap</button><button className="px-1.5 text-base text-tx2" title="Remove" onClick={() => setM({ k: "rem", item: s.item, name: s.name })}>✕</button></>}
                      </div>
                    </div>); })}
                </div>
              </div>);
          })}
          {D.stay && <div className="lab text-tx2 max-w-[660px] px-2">Lodging tonight: {D.stay.row.AccommodationName} ({D.stay.row.AccommodationType}) · {fmt(D.stay.item.EstimatedCost)}</div>}
          {!D.stops.length && <div className="note">This day is empty. Use “+ Add activity”.</div>}
          {booked && <div className="note">This itinerary is booked (simulated), so editing is locked.</div>}
        </main>
        <MapView stops={stops} legs={D.legs} className="min-h-[300px]" />
      </div>
      <footer className="h-20 shrink-0 bg-card border border-bd flex items-center gap-3 pl-8 pr-6 overflow-auto">
        {[["Transport", T.transport, "#3d6473"], ["Lodging", T.lodging, "#e8592a"], ["Meals", T.meals, "#f59e0b"], ["Activities", T.activities, "#15803d"], ["Other", T.other, "#9ca3af"]].map(([l, x, c]) => <span key={l} className="lab bg-bg2 px-3.5 py-2 rounded-full flex gap-2 items-center whitespace-nowrap"><i className="w-2 h-2 rounded-full" style={{ background: c }} />{l} {fmt(x)}</span>)}
        <span className="flex-1" />
        {df > 0 ? <button className="bg-ebg text-df font-semibold px-3.5 py-2 rounded-full whitespace-nowrap" onClick={() => setM({ k: "opt" })}>Deficit -{fmt(df)}</button> : <span className="bg-ev text-ok font-semibold px-3.5 py-2 rounded-full whitespace-nowrap">Within budget · {fmt(-df)} left</span>}
        <button className="btn-p w-[200px]" onClick={() => r.push(`/trips/${itId}/${booked ? "receipt" : "checkout"}`)}>{booked ? "View receipt" : "Proceed to Checkout"}</button>
      </footer>

      {m?.k === "swap" && <SwapModal itId={itId} item={m.item} onPick={doSwap} onClose={close} fmt={fmt} />}
      {m?.k === "add" && <Modal onClose={close}><h2 className="text-[22px] font-semibold">Add activity</h2><p className="text-tx2">Day {day + 1} · must fit opening hours and the existing schedule</p>
        {activeActivities(db).filter((a) => place(db, a.DestinationID).Region === v.dest.Region && !D.stops.some((s) => s.row.ActivityID === a.ActivityID)).map((a) => <button key={a.ActivityID} className="opt" onClick={() => doAdd(a)}><span className="flex items-center gap-2"><Icon t={a.ActivityType} size={18} />{a.ActivityName}</span><span>{fmt(a.ActivityCost * it.NumberOfTravelers)}</span></button>)}
        <Ends><button className="btn" onClick={close}>Cancel</button></Ends></Modal>}
      {m?.k === "rem" && <Modal onClose={close}><h2 className="text-[22px] font-semibold">Remove this activity?</h2><p className="text-tx2">{m.name} will be removed from Day {day + 1}.</p><Ends><button className="btn" onClick={close}>Keep</button><button className="btn-p" onClick={() => doRem(m.item)}>Remove</button></Ends></Modal>}
      {m?.k === "edit" && <EditModal itId={itId} onClose={close} />}
      {m?.k === "exp" && <ExportModal itId={itId} onClose={close} />}
      {m?.k === "opt" && <AdjustModal itId={itId} onClose={close} onEdit={() => setM({ k: "edit" })} />}
    </Shell>
  );
}

function SwapModal({ itId, item, onPick, onClose, fmt }) {
  const { db } = useApp(), opts = swapOptions(db, itId, item.ItineraryItemID), it = db.itinerary.find((x) => x.ItineraryID === itId);
  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] font-semibold">Swap activity</h2><p className="text-tx2">Only options that fit the schedule and opening hours are shown.</p>
      {opts.map((o) => { const id = o.row.ActivityID || o.row.MealID, diff = (o.unit * it.NumberOfTravelers) - item.EstimatedCost; return (
        <button key={id} className="opt" onClick={() => onPick(item.ItineraryItemID, id)}><span>{o.name}</span><span className={diff < 0 ? "text-ok font-semibold" : ""}>{fmt(o.unit * it.NumberOfTravelers)}{diff < 0 ? ` · saves ${fmt(-diff)}` : ""}</span></button>); })}
      {!opts.length && <div className="note note-w">No alternatives fit this slot.</div>}
      <Ends><button className="btn" onClick={onClose}>Cancel</button></Ends>
    </Modal>
  );
}
