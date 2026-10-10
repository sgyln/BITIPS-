// Process 6.0: query the Mock Provider API; on failure fall back to cached AVAILABILITY rows, then to catalog status.
import { insert, now } from "@/lib/db";
import { IDF, catalog, place, daysBetween } from "@/lib/engine";

export const refsFor = (db, region, dates) => {
  const c = catalog(db, region), out = [];
  dates.forEach((d) => {
    c.activities.forEach((a) => out.push({ type: "activity", id: a.ActivityID, date: d }));
    c.stays.forEach((a) => out.push({ type: "lodging", id: a.AccommodationID, date: d }));
    c.transports.forEach((a) => out.push({ type: "transport", id: a.TransportID, date: d }));
    c.meals.forEach((a) => out.push({ type: "meal", id: a.MealID, date: d }));
  });
  return out;
};
export async function queryProvider(refs, { outage = false } = {}) {
  try {
    const r = await fetch("/api/provider/availability", { method: "POST", headers: { "content-type": "application/json", ...(outage ? { "x-simulate-outage": "1" } : {}) }, body: JSON.stringify({ items: refs }) });
    if (!r.ok) throw new Error("provider " + r.status);
    return { live: true, results: (await r.json()).results };
  } catch { return { live: false, results: [] }; }
}
const COL = { activity: "ActivityID", lodging: "AccommodationID", transport: "TransportID" };
// Writes provider results into D5 (AVAILABILITY) and returns a status map {type:id:date -> status}.
export function storeAvailability(db, refs, q) {
  const map = {};
  if (q.live) {
    q.results.forEach((x) => {
      map[`${x.type}:${x.id}:${x.date}`] = x.status;
      if (!COL[x.type]) return;
      const ex = db.availability.find((a) => a[COL[x.type]] === x.id && a.AvailabilityDate === x.date), row = { AvailableQuantity: x.qty, AvailabilityStatus: x.status, LastCheckedAt: now() };
      if (ex) Object.assign(ex, row); else insert(db, "availability", { ActivityID: null, AccommodationID: null, TransportID: null, [COL[x.type]]: x.id, AvailabilityDate: x.date, ...row });
    });
  } else {
    refs.forEach((r) => { const ex = COL[r.type] && db.availability.find((a) => a[COL[r.type]] === r.id && a.AvailabilityDate === r.date); if (ex) map[`${r.type}:${r.id}:${r.date}`] = ex.AvailabilityStatus; });
  }
  return map;
}
// Badge for one itinerary item: Live (checked <5 min ago), Cached (older record), otherwise the catalog data status.
export function sourceBadge(db, item, row, kind) {
  const rec = COL[kind] && db.availability.find((a) => a[COL[kind]] === item[IDF[kind]] && a.AvailabilityDate === item.ItemDate);
  if (rec) return Date.now() - Date.parse(rec.LastCheckedAt) < 5 * 60 * 1000 ? "Live" : "Cached";
  return row.DataStatus || "Admin-Maintained";
}
export { place, daysBetween };
