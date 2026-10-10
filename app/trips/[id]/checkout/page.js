"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Ends, Field, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { BD } from "@/lib/consts";
import { dateRange, viewTrip } from "@/lib/engine";
import { audit, insert, now } from "@/lib/db";

const WAL = { GCash: ["MOCK GCASH · TEST ONLY", "0917 000 0000"], Maya: ["MOCK MAYA · TEST ONLY", "0918 000 0000"], Card: ["TEST CARD · TEST ONLY", "4242 4242 4242 4242"] };
const code = (p) => p + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CheckoutPage() {
  const { id } = useParams(), itId = Number(id), r = useRouter(), { db, user, commit, failPayment } = useApp(), v = viewTrip(db, itId);
  const [pm, setPm] = useState("GCash"), [modal, setModal] = useState(null), [err, setErr] = useState("");
  if (!v || v.it.UserID !== user.UserID) return <Shell active="Budget"><div className="p-8">Trip not found.</div></Shell>;
  const { totals: T, fmt, it } = v, w = WAL[pm], df = T.deficit;
  const banner = <div className="bg-ebg text-efg px-8 py-3 font-semibold text-xs tracking-wide">PROTOTYPE ENVIRONMENT: Simulation only. No real charges.</div>;

  // 7.1 prepare booking -> 7.2 sandbox gateway -> 7.3 confirm, record transaction + expenses
  async function pay(number) {
    setModal("busy");
    const bookingId = commit((d) => {
      let b = d.booking.find((x) => x.ItineraryID === itId && x.BookingStatus === "Pending");
      if (!b) b = insert(d, "booking", { UserID: user.UserID, ItineraryID: itId, BookingDate: now(), BookingStatus: "Pending", TotalAmount: T.sum, ConfirmationCode: code("BK") });
      b.TotalAmount = T.sum; return b.BookingID;
    });
    const declined = failPayment.current || number.endsWith("1111") || number === "4000000000000002";
    failPayment.current = false;
    let res; try { res = await (await fetch("/api/payment/charge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: pm, token: declined ? "tok_test_declined" : `tok_test_${pm.toLowerCase()}`, amount: T.sum }) })).json(); } catch { res = { status: "Failed", message: "Gateway unreachable (simulated)" }; }
    const ok = res.status === "Success";
    commit((d) => {
      const b = d.booking.find((x) => x.BookingID === bookingId);
      insert(d, "transaction", { BookingID: bookingId, UserID: user.UserID, TransactionDate: now(), Amount: T.sum, PaymentMethod: pm, TransactionType: "Payment", TransactionStatus: ok ? "Success" : "Failed", ReferenceNumber: res.reference || code("SBX-FAIL") });
      if (ok) {
        b.BookingStatus = "Confirmed"; const itn = d.itinerary.find((x) => x.ItineraryID === itId); itn.Status = "Booked"; itn.UpdatedAt = now();
        d.itinerary_item.filter((i) => i.ItineraryID === itId).forEach((i) => (i.ItemStatus = "Booked"));
        const bd = d.trip_budget.find((x) => x.ItineraryID === itId);
        [["Transportation", T.transport], ["Lodging", T.lodging], ["Meals", T.meals], ["Activities", T.activities], ["Other", T.other]].filter(([, a]) => a > 0).forEach(([c, a]) => insert(d, "expense", { BudgetID: bd.BudgetID, ItineraryID: itId, ExpenseCategory: c, ExpenseDescription: `${c} for "${itn.ItineraryName}" (simulated)`, ExpenseAmount: a, ExpenseDate: now().slice(0, 10), PaymentMethod: pm, ExpenseStatus: "Paid (Simulated)" }));
        audit(d, user.UserID, "PAYMENT_SUCCESS", `${b.ConfirmationCode} via ${pm}`);
      } else { b.BookingStatus = "Pending"; audit(d, user.UserID, "PAYMENT_FAILED", `${pm} declined (simulated)`, "Failed"); }
    });
    if (ok) r.push(`/trips/${itId}/receipt`); else { setErr(res.message || "Declined"); setModal("fail"); }
  }
  return (
    <Shell active="Budget" banner={banner}>
      <main className="flex-1 overflow-auto p-8"><div className="max-w-[1240px] grid gap-6">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="box"><h2 className="text-[22px] font-semibold mb-3">Cost breakdown</h2>
            {[["Transportation", T.transport], ["Lodging", T.lodging], ["Meals", T.meals], ["Activities", T.activities], ["Other", T.other]].map(([a, b]) => <div key={a} className="flex justify-between py-1"><span>{a}</span><span>{fmt(b)}</span></div>)}
            <div className="row border-t border-b-0 mt-2"><b>Grand total</b><b>{fmt(T.sum)}</b></div>
            <span className={`badge ${df > 0 ? "bg-ebg text-df" : "bg-ev text-ok"}`}>{df > 0 ? `Over budget by ${fmt(df)}` : `Within budget · ${fmt(-df)} remaining`}</span></div>
          <div className="box"><h2 className="text-[22px] font-semibold mb-3">Test payment</h2>
            <div className="flex gap-2">{["GCash", "Maya", "Card"].map((m) => <button key={m} className={`chip ${pm === m ? "chip-on" : ""}`} onClick={() => setPm(m)}>{m === "Card" ? "Test Card" : "Mock " + m}</button>)}</div>
            <div className="bg-tx text-white rounded-2xl p-5 mt-3.5 flex flex-col gap-1.5"><span className="lab">{w[0]}</span><span className="text-lg">{w[1]}</span><span className="lab opacity-80">Simulated wallet. No funds move.</span></div>
            <button className="btn-p w-full mt-3.5" onClick={() => setModal("pay")}>Complete Simulated Payment ({fmt(T.sum)})</button></div>
        </div>
        <div className="box"><h2 className="text-[22px] font-semibold mb-3">Trip summary</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">{[["Trip", it.ItineraryName], ["Dates", dateRange(it.StartDate, it.EndDate)], ["Travelers", it.NumberOfTravelers], ["Destination", v.dest.DestinationName], ["Total budget", fmt(v.budget.TotalBudget)]].map(([a, b]) => <div key={a}><div className="lab text-tx2">{a}</div>{b}</div>)}</div>
          <div className="flex gap-2 flex-wrap items-center mt-3.5"><span className="lab text-tx2">Data sources in this plan</span>{["Live", "Cached", "Admin-Maintained", "Estimated"].map((k) => <span key={k} className={`badge ${BD[k]}`}>{k}</span>)}</div>
          <Ends><button className="btn" onClick={() => r.push(`/trips/${itId}`)}>← Back to itinerary</button></Ends></div>
      </div></main>
      {modal === "pay" && <PayModal pm={pm} total={fmt(T.sum)} def={w[1]} onClose={() => setModal(null)} onPay={pay} />}
      {modal === "busy" && <Modal onClose={() => {}}><div className="spin" /><h2 className="text-center text-[22px] font-semibold mt-4">Contacting sandbox gateway…</h2></Modal>}
      {modal === "fail" && <Modal onClose={() => setModal(null)}><h2 className="text-[22px] font-semibold">Payment failed</h2><div className="note note-w">{err}</div><Ends><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn-p" onClick={() => setModal("pay")}>Try again</button></Ends></Modal>}
    </Shell>
  );
}
function PayModal({ pm, total, def, onClose, onPay }) {
  const card = pm === "Card", [n, setN] = useState(def), [ex, setEx] = useState("12/28"), [cv, setCv] = useState("123"), [e, setE] = useState({});
  const submit = () => {
    const raw = n.replace(/\s/g, ""), x = {};
    if (card) { if (!/^\d{16}$/.test(raw)) x.n = "Enter 16 digits"; if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(ex)) x.ex = "Use MM/YY"; if (!/^\d{3}$/.test(cv)) x.cv = "3 digits"; } else if (!/^09\d{9}$/.test(raw)) x.n = "Use 11 digits starting with 09";
    setE(x); if (!Object.keys(x).length) onPay(raw);
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] font-semibold">Pay with {card ? "test card" : pm} (mock)</h2>
      <div className="note">Test data: a number ending in 1111 (or card 4000 0000 0000 0002) is declined. Press F on the itinerary for a one-time decline.</div>
      <Field label={card ? "Card number" : `${pm} number`} error={e.n}><input className="input" value={n} onChange={(x) => setN(x.target.value)} inputMode="numeric" /></Field>
      {card && <div className="grid grid-cols-2 gap-3"><Field label="Expiry (MM/YY)" error={e.ex}><input className="input" value={ex} onChange={(x) => setEx(x.target.value)} /></Field><Field label="CVC" error={e.cv}><input className="input" value={cv} onChange={(x) => setCv(x.target.value)} /></Field></div>}
      <Field label="Amount"><input className="input" value={total} readOnly /></Field>
      <Ends><button className="btn" onClick={onClose}>Cancel</button><button className="btn-p" onClick={submit}>Pay {total}</button></Ends>
    </Modal>
  );
}
