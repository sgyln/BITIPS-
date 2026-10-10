// Process 9.0: schedule + route overview + expense breakdown + booking/transaction reference -> PDF (+ PDF_REPORT record).
import { dateRange, fT, pesoPdf, viewTrip, fD } from "@/lib/engine";

export async function buildItineraryPdf(db, itId, size = "a4") {
  const { jsPDF } = await import("jspdf"), v = viewTrip(db, itId), d = new jsPDF({ unit: "pt", format: size.toLowerCase() });
  const H = d.internal.pageSize.getHeight(), rate = v.budget.ExchangeRate || 1, cur = v.budget.DisplayCurrency;
  let y = 56;
  const ln = (t, z = 11, b = false, g = 16, x = 56) => { if (y > H - 56) { d.addPage(); y = 56; } d.setFont("helvetica", b ? "bold" : "normal"); d.setFontSize(z); d.text(String(t), x, y); y += g; };
  const T = v.totals, bk = db.booking.find((b) => b.ItineraryID === itId && b.BookingStatus === "Confirmed"), tx = bk && db.transaction.find((t) => t.BookingID === bk.BookingID && t.TransactionStatus === "Success");
  ln(v.it.ItineraryName, 22, true, 28);
  ln(`${dateRange(v.it.StartDate, v.it.EndDate)} | ${v.it.NumberOfTravelers} traveler(s) | ${v.dest.DestinationName} | Origin: ${v.it.Origin}`, 10, false, 24);
  v.days.forEach((day, i) => {
    ln(`Day ${i + 1} - ${day.date}`, 14, true, 20);
    day.stops.forEach((s, k) => { ln(`${fT(s.item.StartTime)}  ${s.name}  (${s.pl.DestinationName})  -  ${pesoPdf(s.item.EstimatedCost)}`, 11, false, 16, 70); const g = day.legs.find((l) => l.to === k + 1); if (g) ln(g.boat ? "   > Boat access: road route unavailable" : `   > ${g.mode || "Local"}: ${g.km.toFixed(1)} km, ${fD(g.mins)}, ${pesoPdf(g.cost)}`, 9, false, 14, 70); });
    if (day.stay) ln(`Lodging: ${day.stay.row.AccommodationName} - ${pesoPdf(day.stay.item.EstimatedCost)}`, 10, false, 16, 70);
    y += 8;
  });
  ln("Route overview", 14, true, 20);
  db.route.filter((r) => r.ItineraryID === itId).forEach((r) => ln(`${r.StartLocation} -> ${r.EndLocation}: ${r.Distance} km, ${r.EstimatedTravelTime} min`, 10, false, 14, 70));
  y += 8; ln("Expense breakdown", 14, true, 20);
  [["Transportation", T.transport], ["Lodging", T.lodging], ["Meals", T.meals], ["Activities", T.activities], ["Other", T.other], ["Total", T.sum], ["Budget", v.budget.TotalBudget]].forEach(([a, b]) => ln(`${a}: ${pesoPdf(b)}`, 11, a === "Total", 16, 70));
  ln(T.deficit > 0 ? `Over budget by ${pesoPdf(T.deficit)}` : `Within budget (${pesoPdf(-T.deficit)} remaining)`, 11, true, 16, 70);
  if (cur !== "PHP") ln(`Display currency ${cur} at snapshot rate ${rate} (amounts above are PHP).`, 9, false, 16, 70);
  if (tx) { y += 8; ln("Simulated transaction", 14, true, 20); ln(`Booking ${bk.ConfirmationCode} | Ref ${tx.ReferenceNumber} | ${tx.PaymentMethod} | ${pesoPdf(tx.Amount)}`, 10, false, 14, 70); ln("SIMULATION ONLY - no money moved.", 9, true, 14, 70); }
  return { doc: d, name: (v.it.ItineraryName.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "-") || "itinerary") + ".pdf" };
}
