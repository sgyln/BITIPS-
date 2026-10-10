"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Ends } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { dateRange, viewTrip } from "@/lib/engine";
import { buildItineraryPdf } from "@/lib/pdf";
import { audit, insert, now } from "@/lib/db";

export default function ReceiptPage() {
  const { id } = useParams(), itId = Number(id), r = useRouter(), { db, user, commit, toast } = useApp(), v = viewTrip(db, itId);
  const bk = db.booking.find((b) => b.ItineraryID === itId && b.BookingStatus === "Confirmed"), tx = bk && db.transaction.find((t) => t.BookingID === bk.BookingID && t.TransactionStatus === "Success");
  if (!v || !bk || !tx) return <Shell active="Budget"><div className="p-8">No receipt yet. <Link className="underline" href={`/trips/${id}/checkout`}>Go to checkout</Link></div></Shell>;
  const dl = async () => { try { const { doc, name } = await buildItineraryPdf(db, itId); doc.save(name); commit((d) => { insert(d, "pdf_report", { ItineraryID: itId, UserID: user.UserID, ReportType: "Receipt & Itinerary Report", GeneratedDate: now(), FileName: name, ReportStatus: "Generated" }); audit(d, user.UserID, "PDF_EXPORT", name); }); toast("Receipt PDF saved"); } catch { toast("Couldn't create the PDF"); } };
  return (
    <Shell active="Budget">
      <main className="flex-1 grid place-items-center p-8"><div className="box w-[min(560px,100%)]">
        <h2 className="text-[22px] font-semibold">Simulated Booking Confirmed</h2><div className="text-tx2">Confirmation {bk.ConfirmationCode}</div>
        <div className="mt-3">{[["Trip", v.it.ItineraryName], ["Dates", dateRange(v.it.StartDate, v.it.EndDate)], ["Travelers", v.it.NumberOfTravelers], ["Destination", v.dest.DestinationName], ["Payment method", tx.PaymentMethod === "Card" ? "Test card" : "Mock " + tx.PaymentMethod], ["Transaction reference", tx.ReferenceNumber], ["Total paid", v.fmt(tx.Amount)]].map(([a, b]) => <div key={a} className="row"><span className="text-tx2">{a}</span><b className="text-right">{b}</b></div>)}</div>
        <div className="note">Receipt for demonstration only. No money moved and nothing was booked.</div>
        <Ends><button className="btn" onClick={dl}>Download PDF</button><button className="btn" onClick={() => r.push(`/trips/${itId}`)}>View itinerary</button><button className="btn-p" onClick={() => r.push("/trips")}>View My Trips</button></Ends>
      </div></main>
    </Shell>
  );
}
