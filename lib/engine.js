// Rule-based itinerary engine: Processes 3.0 (budget), 4.0 (generation / adjustment), 5.0 (routes).
import { insert, now, audit } from "@/lib/db";
import { CURS } from "@/lib/seed";

export const TBL = { activity: "activity", meal: "meal_option", lodging: "accommodation", transport: "transport_option" };
export const IDF = { activity: "ActivityID", meal: "MealID", lodging: "AccommodationID", transport: "TransportID" };
export const toMin = (t) => { if (typeof t === "number") return t; const [h, m] = String(t).split(":"); return +h * 60 + +m; };
export const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fT = (t) => { const m = toMin(t), h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const fD = (m) => (m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : m + "m");
export const money = (n, cur = "PHP", rate = 1) => { const c = CURS[cur] || CURS.PHP; return c.s + Math.round(n * rate).toLocaleString("en-US"); };
export const pesoPdf = (n) => "PHP " + Math.round(n).toLocaleString("en-US");
export const daysBetween = (a, b) => { const out = []; const d = new Date(a + "T00:00:00Z"), e = new Date(b + "T00:00:00Z"); for (; d <= e; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; };
export const fDate = (s, o = { month: "short", day: "numeric" }) => new Date(s + "T00:00:00").toLocaleDateString("en-US", o);
export const dateRange = (a, b) => { const x = new Date(a + "T00:00:00"), y = new Date(b + "T00:00:00"); return x.getMonth() === y.getMonth() ? `${fDate(a)} – ${y.getDate()}, ${y.getFullYear()}` : `${fDate(a)} – ${fDate(b)}, ${y.getFullYear()}`; };
export const hav = (a, b, c, d) => { const r = (x) => (x * Math.PI) / 180, dl = r(c - a), dg = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };

export const place = (db, id) => db.destination.find((d) => d.DestinationID === id);
export const kindOf = (i) => (i.ActivityID ? "activity" : i.MealID ? "meal" : i.AccommodationID ? "lodging" : "transport");
export const rowOf = (db, i) => { const k = kindOf(i); return db[TBL[k]].find((r) => r[IDF[k]] === i[IDF[k]]); };
export const unitOf = (r, k) => (k === "activity" ? r.ActivityCost : k === "meal" ? r.Price : k === "lodging" ? r.PricePerNight : r.Fare);
export const nameOf = (r, k) => (k === "activity" ? r.ActivityName : k === "meal" ? r.MealName : k === "lodging" ? r.AccommodationName : r.TransportType);
export const itemCost = (db, k, r, trav) => {
  const R = db.system_rule, u = unitOf(r, k);
  if (k === "lodging") return u * Math.ceil(trav / 2);
  if (k === "transport") return r.TransportType === "Jeepney" ? u * trav : u * Math.ceil(trav / (r.TransportType === "Tricycle" ? R.tricycleCapacity : R.taxiCapacity));
  return u * trav;
};
export const prefOf = (db, uid) => db.user_preference.find((p) => p.UserID === uid) || {};
export const regionOf = (db, it) => place(db, it.DestinationID)?.Region;
export function catalog(db, region) {
  const inR = (id) => { const p = place(db, id); return p && p.Region === region && p.Status !== "Archived"; };
  const live = (r) => r.AvailabilityStatus !== "Archived" && r.AvailabilityStatus !== "Unavailable";
  return {
    activities: db.activity.filter((a) => inR(a.DestinationID) && live(a)),
    meals: db.meal_option.filter((m) => inR(m.DestinationID) && live(m)),
    stays: db.accommodation.filter((s) => inR(s.DestinationID) && live(s)),
    transports: db.transport_option.filter((t) => inR(t.DestinationID) && live(t)),
  };
}
const complete = (db, k, r) => {
  const f = k === "activity" ? [r.Description, r.OpeningTime, r.ClosingTime, r.Duration] : k === "meal" ? [r.Description, r.Price, r.Cuisine] : [r.Rating, r.PricePerNight, r.AccommodationType];
  const p = place(db, r.DestinationID); f.push(p && p.Latitude != null);
  return f.filter((x) => x !== undefined && x !== null && x !== "").length / f.length;
};
export const legInfo = (db, aId, bId) => {
  const R = db.system_rule, a = place(db, aId), b = place(db, bId);
  if (!a || !b || a.Latitude == null || b.Latitude == null) return { km: 0, mins: 10, boat: false };
  const km = hav(a.Latitude, a.Longitude, b.Latitude, b.Longitude) * R.circuity;
  const boat = a.Accessibility === "Boat" || b.Accessibility === "Boat";
  return { km, mins: Math.max(5, Math.round((km / R.speedKmh) * 60)), boat };
};
const TYPE_RANK = { "Budget Inn": 0, Hotel: 1, Resort: 2 };
const pickStay = (stays, type) => {
  if (!stays.length) return null;
  const r = TYPE_RANK[type] ?? 1;
  return [...stays].sort((a, b) => Math.abs(TYPE_RANK[a.AccommodationType] - r) - Math.abs(TYPE_RANK[b.AccommodationType] - r) || b.Rating - a.Rating)[0];
};
const transportFor = (cat, type) => cat.transports.find((t) => t.TransportType === type) || cat.transports.find((t) => t.TransportType === "Jeepney") || cat.transports[0];

function addItem(db, itId, date, k, row, start, end, trav, status = "Planned") {
  return insert(db, "itinerary_item", { ItineraryID: itId, ActivityID: k === "activity" ? row.ActivityID : null, AccommodationID: k === "lodging" ? row.AccommodationID : null, MealID: k === "meal" ? row.MealID : null, TransportID: k === "transport" ? row.TransportID : null, ItemDate: date, StartTime: toTime(start), EndTime: end == null ? null : toTime(end), SequenceNumber: 0, EstimatedCost: itemCost(db, k, row, trav), ItemStatus: status });
}
export const itemsOf = (db, itId) => db.itinerary_item.filter((i) => i.ItineraryID === itId);
const stopsOn = (db, itId, date) => itemsOf(db, itId).filter((i) => i.ItemDate === date && (i.ActivityID || i.MealID)).sort((a, b) => toMin(a.StartTime) - toMin(b.StartTime));

// 5.x: rebuild transport legs, ROUTE rows and sequence numbers for one itinerary
export function rebuildRoutes(db, itId) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId), region = regionOf(db, it), cat = catalog(db, region), pref = prefOf(db, it.UserID);
  const tr = transportFor(cat, pref.PreferredTransportType);
  db.itinerary_item = db.itinerary_item.filter((i) => !(i.ItineraryID === itId && i.TransportID));
  db.route = db.route.filter((r) => r.ItineraryID !== itId);
  daysBetween(it.StartDate, it.EndDate).forEach((date) => {
    const s = stopsOn(db, itId, date);
    for (let k = 1; k < s.length; k++) {
      const A = rowOf(db, s[k - 1]), B = rowOf(db, s[k]), pa = place(db, A.DestinationID), pb = place(db, B.DestinationID);
      if (pa.DestinationID === pb.DestinationID) continue;
      const L = legInfo(db, pa.DestinationID, pb.DestinationID), st = toMin(s[k - 1].EndTime);
      insert(db, "route", { ItineraryID: itId, StartLocation: pa.DestinationName, EndLocation: pb.DestinationName, Distance: +L.km.toFixed(2), EstimatedTravelTime: L.mins, RouteDescription: L.boat ? "Boat access: road route unavailable (ocean boundary)" : `${tr?.TransportType || "Local"} · ${L.km.toFixed(1)} km`, CreatedAt: now() });
      if (tr && !L.boat) addItem(db, itId, date, "transport", tr, st, st + L.mins, it.NumberOfTravelers);
    }
    itemsOf(db, itId).filter((i) => i.ItemDate === date).sort((a, b) => toMin(a.StartTime) - toMin(b.StartTime)).forEach((i, n) => (i.SequenceNumber = n + 1));
  });
}
export function computeBudget(db, itId) {
  const b = db.trip_budget.find((x) => x.ItineraryID === itId), c = { transport: 0, lodging: 0, meals: 0, activities: 0 };
  itemsOf(db, itId).forEach((i) => { const k = kindOf(i); c[k === "meal" ? "meals" : k === "activity" ? "activities" : k] += i.EstimatedCost; });
  const other = b.OtherBudget || 0, sum = c.transport + c.lodging + c.meals + c.activities + other;
  return { ...c, other, sum, deficit: sum - b.TotalBudget, budget: b };
}
export function refreshBudget(db, itId) {
  const c = computeBudget(db, itId), it = db.itinerary.find((x) => x.ItineraryID === itId);
  c.budget.BudgetStatus = c.deficit > 0 ? "Over Budget" : "Within Budget"; c.budget.UpdatedAt = now();
  if (["Draft", "Validated", "Over Budget"].includes(it.Status)) it.Status = c.deficit > 0 ? "Over Budget" : "Validated";
  it.UpdatedAt = now();
}
export function recalc(db, itId) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId);
  itemsOf(db, itId).forEach((i) => { const k = kindOf(i), r = rowOf(db, i); if (r) i.EstimatedCost = itemCost(db, k, r, it.NumberOfTravelers); });
  rebuildRoutes(db, itId); itemsOf(db, itId).forEach((i) => { const k = kindOf(i), r = rowOf(db, i); if (r) i.EstimatedCost = itemCost(db, k, r, it.NumberOfTravelers); });
  refreshBudget(db, itId);
}

// ---- Process 4.0: preference filtering, daily generation, budget validation ----
export function generate(db, p) {
  const R = db.system_rule, A = R.alloc, pref = prefOf(db, p.userId), region = place(db, p.destId).Region, cat = catalog(db, region);
  const dates = daysBetween(p.start, p.end), n = dates.length, trav = p.trav, rate = CURS[p.cur]?.r || 1;
  const it = insert(db, "itinerary", { UserID: p.userId, DestinationID: p.destId, ItineraryName: p.title, StartDate: p.start, EndDate: p.end, NumberOfDays: n, Status: "Draft", CreatedAt: now(), UpdatedAt: now(), Origin: p.origin, NumberOfTravelers: trav });
  const r0 = (x) => Math.round(x);
  insert(db, "trip_budget", { ItineraryID: it.ItineraryID, TotalBudget: p.budget, AccommodationBudget: r0(p.budget * A.lodging), TransportationBudget: r0(p.budget * A.transport), ActivityBudget: r0(p.budget * A.activities), MealBudget: r0(p.budget * A.meals), OtherBudget: r0(p.budget * A.other), BudgetStatus: "Within Budget", CreatedAt: now(), UpdatedAt: now(), DisplayCurrency: p.cur, ExchangeRate: rate });
  const types = (pref.PreferredActivityType || "").split(",").filter(Boolean), pace = pref.TravelPace || "Moderate";
  const ok = (k, id, d) => p.avail?.[`${k}:${id}:${d}`] !== "Unavailable";
  const used = { a: new Set(), m: new Set() }, capA = (p.budget * A.activities) / n / trav, capM = (p.budget * A.meals) / n / trav / 2;
  const stay = pickStay(cat.stays.filter((s) => ok("lodging", s.AccommodationID, dates[0])), pref.PreferredAccommodationType);
  dates.forEach((date, di) => {
    const queue = (p.picks || []).filter((_, k) => k % n === di);
    let cursor = 0, prev = null; const stops = [];
    const tm = (pl) => (prev ? legInfo(db, prev, pl).mins : 0);
    const add = (k, row, start, dur) => { stops.push({ k, row, start, dur }); cursor = start + dur; prev = row.DestinationID; };
    const meal = (type, min) => {
      const c = cat.meals.filter((m) => m.MealType === type && ok("meal", m.MealID, date)); if (!c.length) return;
      const fr = c.filter((m) => !used.m.has(m.MealID)), pool = fr.length ? fr : c, sc = (m) => (pref.PreferredMealPreference === m.Cuisine ? 1 : 0.3);
      pool.sort((a, b) => sc(b) - sc(a) || a.Price - b.Price);
      const best = pool.find((m) => m.Price <= capM) || [...pool].sort((a, b) => a.Price - b.Price)[0];
      used.m.add(best.MealID); add("meal", best, Math.max(min, cursor + tm(best.DestinationID)), R.mealMinutes);
    };
    const act = (base, latest) => {
      const c = cat.activities.filter((a) => ok("activity", a.ActivityID, date)).map((a) => {
        const s = Math.max(base, cursor + tm(a.DestinationID), toMin(a.OpeningTime || "00:00"));
        return s <= latest && s + a.Duration <= toMin(a.ClosingTime || "23:59") ? { a, s, sc: types.includes(a.ActivityType) ? 1 : 0.2 } : null;
      }).filter(Boolean);
      if (!c.length) return;
      const forced = c.find((x) => queue.includes(x.a.ActivityID) && !used.a.has(x.a.ActivityID));
      const fr = c.filter((x) => !used.a.has(x.a.ActivityID)), pool = fr.length ? fr : c;
      pool.sort((x, y) => y.sc - x.sc || x.a.ActivityCost - y.a.ActivityCost);
      const best = forced || pool.find((x) => x.a.ActivityCost <= capA) || [...pool].sort((x, y) => x.a.ActivityCost - y.a.ActivityCost)[0];
      used.a.add(best.a.ActivityID); add("activity", best.a, best.s, best.a.Duration);
    };
    meal("Breakfast", R.breakfastStart);
    if (pace !== "Relaxed") act(R.minMorning, 660);
    act(R.minAfternoon, 960);
    if (pace === "Fast-Paced") act(R.minEvening, 1080);
    meal("Dinner", R.dinnerStart);
    stops.forEach((s) => addItem(db, it.ItineraryID, date, s.k, s.row, s.start, s.start + s.dur, trav));
    if (stay && di < n - 1) addItem(db, it.ItineraryID, date, "lodging", stay, 1230, null, trav);
  });
  recalc(db, it.ItineraryID);
  audit(db, p.userId, "ITINERARY_GENERATED", `Generated "${p.title}" (${n} days)`);
  return it.ItineraryID;
}
export const minFeasible = (db, destId, n, trav) => {
  const c = catalog(db, place(db, destId).Region), mn = (a) => (a.length ? Math.min(...a) : 0);
  return mn(c.stays.map((s) => s.PricePerNight)) * Math.ceil(trav / 2) * (n - 1) + (mn(c.meals.filter((m) => m.MealType === "Breakfast").map((m) => m.Price)) + mn(c.meals.filter((m) => m.MealType === "Dinner").map((m) => m.Price))) * n * trav;
};

// ---- Itinerary view model ----
export function viewTrip(db, itId) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId); if (!it) return null;
  const dest = place(db, it.DestinationID), budget = db.trip_budget.find((b) => b.ItineraryID === itId), items = itemsOf(db, itId);
  const days = daysBetween(it.StartDate, it.EndDate).map((date) => {
    const day = items.filter((i) => i.ItemDate === date).sort((a, b) => a.SequenceNumber - b.SequenceNumber);
    const stops = day.filter((i) => i.ActivityID || i.MealID).map((i) => { const k = kindOf(i), row = rowOf(db, i); return { item: i, kind: k, row, name: nameOf(row, k), pl: place(db, row.DestinationID), unit: unitOf(row, k) }; });
    const legs = [];
    for (let k = 1; k < stops.length; k++) if (stops[k - 1].pl.DestinationID !== stops[k].pl.DestinationID) { const L = legInfo(db, stops[k - 1].pl.DestinationID, stops[k].pl.DestinationID), t = day.find((i) => i.TransportID && i.StartTime === stops[k - 1].item.EndTime); legs.push({ from: k - 1, to: k, ...L, cost: t?.EstimatedCost || 0, mode: t ? db.transport_option.find((x) => x.TransportID === t.TransportID).TransportType : null }); }
    const lodge = day.find((i) => i.AccommodationID); const stay = lodge ? { item: lodge, row: rowOf(db, lodge), pl: place(db, rowOf(db, lodge).DestinationID) } : null;
    return { date, stops, legs, stay };
  });
  return { it, dest, budget, days, totals: computeBudget(db, itId), fmt: (n) => money(n, budget.DisplayCurrency, budget.ExchangeRate) };
}

// ---- Traveler-controlled budget adjustment (ranked alternatives) ----
export function fitSlot(db, itId, item, alt, k) {
  const R = db.system_rule, st = toMin(item.StartTime), day = stopsOn(db, itId, item.ItemDate), idx = day.findIndex((x) => x.ItineraryItemID === item.ItineraryItemID);
  const prev = day[idx - 1], next = day[idx + 1], dur = k === "activity" ? alt.Duration : R.mealMinutes;
  const s = Math.max(st, k === "activity" ? toMin(alt.OpeningTime || "00:00") : 0), e = s + dur;
  if (k === "activity" && e > toMin(alt.ClosingTime || "23:59")) return null;
  if (prev && s < toMin(prev.EndTime) + legInfo(db, rowOf(db, prev).DestinationID, alt.DestinationID).mins) return null;
  if (next && e + legInfo(db, alt.DestinationID, rowOf(db, next).DestinationID).mins > toMin(next.StartTime)) return null;
  return { s, e, dur };
}
export function swapOptions(db, itId, itemId) {
  const item = db.itinerary_item.find((i) => i.ItineraryItemID === itemId), k = kindOf(item), cur = rowOf(db, item), it = db.itinerary.find((x) => x.ItineraryID === itId), cat = catalog(db, regionOf(db, it));
  const day = itemsOf(db, itId).filter((x) => x.ItemDate === item.ItemDate);
  const pool = k === "activity" ? cat.activities : cat.meals.filter((m) => m.MealType === cur.MealType);
  return pool.filter((c) => c[IDF[k]] !== cur[IDF[k]] && !day.some((x) => x[IDF[k]] === c[IDF[k]])).map((c) => ({ row: c, fit: fitSlot(db, itId, item, c, k), name: nameOf(c, k), unit: unitOf(c, k) })).filter((o) => o.fit);
}
export function suggestAdjustments(db, itId) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId), R = db.system_rule, W = R.weights, pref = prefOf(db, it.UserID), trav = it.NumberOfTravelers, cat = catalog(db, regionOf(db, it));
  const { deficit } = computeBudget(db, itId), types = (pref.PreferredActivityType || "").split(",").filter(Boolean), out = [];
  const need = deficit > 0 ? deficit : 1;
  itemsOf(db, itId).filter((i) => i.ActivityID || i.MealID).forEach((i) => {
    const k = kindOf(i), cur = rowOf(db, i), cu = unitOf(cur, k), day = stopsOn(db, itId, i.ItemDate), idx = day.findIndex((x) => x.ItineraryItemID === i.ItineraryItemID);
    const pv = day[idx - 1] && rowOf(db, day[idx - 1]), nx = day[idx + 1] && rowOf(db, day[idx + 1]);
    const km = (a, b) => (a && b ? legInfo(db, a.DestinationID, b.DestinationID).km : 0), before = km(pv, cur) + km(cur, nx);
    const pool = (k === "activity" ? cat.activities : cat.meals.filter((m) => m.MealType === cur.MealType)).filter((c) => unitOf(c, k) < cu && !day.some((x) => x[IDF[k]] === c[IDF[k]]));
    let best = null;
    pool.forEach((c) => {
      const fit = fitSlot(db, itId, i, c, k); if (!fit) return;
      const parts = { pref: k === "activity" ? (types.includes(c.ActivityType) ? 1 : 0.2) : pref.PreferredMealPreference === c.Cuisine ? 1 : 0.3, budget: Math.min(1, ((cu - unitOf(c, k)) * trav) / need), schedule: Math.max(0, 1 - Math.abs(fit.dur - (k === "activity" ? cur.Duration : R.mealMinutes)) / 120 - (fit.s - toMin(i.StartTime)) / 240), data: complete(db, k, c), route: 1 / (1 + Math.max(0, km(pv, c) + km(c, nx) - before) / 5) };
      const score = Object.keys(parts).reduce((s, x) => s + W[x] * parts[x], 0);
      if (!best || score > best.score) best = { id: `i${i.ItineraryItemID}`, kind: k, itemIds: [i.ItineraryItemID], fromName: nameOf(cur, k), toName: nameOf(c, k), toId: c[IDF[k]], fit, saving: (cu - unitOf(c, k)) * trav, parts, score };
    });
    if (best) out.push(best);
  });
  const lodging = itemsOf(db, itId).filter((i) => i.AccommodationID);
  if (lodging.length) {
    const cur = rowOf(db, lodging[0]), acts = db.itinerary_item.filter((i) => i.ItineraryID === itId && i.ActivityID).map((i) => place(db, rowOf(db, i).DestinationID));
    let best = null;
    cat.stays.filter((s) => s.PricePerNight < cur.PricePerNight).forEach((s) => {
      const sp = place(db, s.DestinationID), avg = acts.length ? acts.reduce((t, a) => t + hav(sp.Latitude, sp.Longitude, a.Latitude, a.Longitude), 0) / acts.length : 0;
      const sv = (cur.PricePerNight - s.PricePerNight) * Math.ceil(trav / 2) * lodging.length;
      const parts = { pref: pref.PreferredAccommodationType === s.AccommodationType ? 1 : 0.4, budget: Math.min(1, sv / need), schedule: 1, data: complete(db, "lodging", s), route: 1 / (1 + avg / 5) };
      const score = Object.keys(parts).reduce((t, x) => t + W[x] * parts[x], 0);
      if (!best || score > best.score) best = { id: "lodging", kind: "lodging", itemIds: lodging.map((l) => l.ItineraryItemID), fromName: cur.AccommodationName, toName: s.AccommodationName, toId: s.AccommodationID, saving: sv, parts, score, nights: true };
    });
    if (best) out.push(best);
  }
  out.sort((a, b) => b.score - a.score);
  let left = deficit; out.forEach((s) => { s.preselected = left > 0; if (left > 0) left -= s.saving; });
  return out;
}
export function applyAdjustments(db, itId, sugs) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId);
  sugs.forEach((s) => {
    s.itemIds.forEach((id) => {
      const i = db.itinerary_item.find((x) => x.ItineraryItemID === id); if (!i) return;
      if (s.kind === "lodging") i.AccommodationID = s.toId;
      else { i[IDF[s.kind]] = s.toId; i.StartTime = toTime(s.fit.s); i.EndTime = toTime(s.fit.e); }
      i.ItemStatus = "Adjusted";
    });
  });
  recalc(db, itId);
  audit(db, it.UserID, "BUDGET_ADJUSTED", `Accepted ${sugs.length} adjustment(s) on "${it.ItineraryName}"`);
}
export function swapItem(db, itId, itemId, toId) {
  const item = db.itinerary_item.find((i) => i.ItineraryItemID === itemId), k = kindOf(item), alt = db[TBL[k]].find((r) => r[IDF[k]] === toId), fit = fitSlot(db, itId, item, alt, k);
  if (!fit) return "That option doesn't fit the schedule.";
  item[IDF[k]] = toId; item.StartTime = toTime(fit.s); item.EndTime = toTime(fit.e); item.ItemStatus = "Adjusted";
  recalc(db, itId); return null;
}
export function addActivity(db, itId, date, actId) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId), R = db.system_rule, a = db.activity.find((x) => x.ActivityID === actId), day = stopsOn(db, itId, date);
  for (const base of [R.minMorning, R.minAfternoon, R.minEvening, 600, 840, 960, 1200]) {
    const s = Math.max(base, toMin(a.OpeningTime || "00:00")), e = s + a.Duration;
    if (e > toMin(a.ClosingTime || "23:59")) continue;
    const clash = day.some((x) => { const A = toMin(x.StartTime), B = toMin(x.EndTime); return s < B + 20 && e + 20 > A; });
    if (clash) continue;
    addItem(db, itId, date, "activity", a, s, e, it.NumberOfTravelers); recalc(db, itId); return null;
  }
  return "No free time slot fits this activity's opening hours on that day.";
}
export function removeItem(db, itId, itemId) { db.itinerary_item = db.itinerary_item.filter((i) => i.ItineraryItemID !== itemId); recalc(db, itId); }
export function updateTrip(db, itId, v) {
  const it = db.itinerary.find((x) => x.ItineraryID === itId), b = db.trip_budget.find((x) => x.ItineraryID === itId), A = db.system_rule.alloc;
  it.ItineraryName = v.title; it.NumberOfTravelers = v.trav; b.TotalBudget = v.budget; b.AccommodationBudget = Math.round(v.budget * A.lodging); b.TransportationBudget = Math.round(v.budget * A.transport); b.ActivityBudget = Math.round(v.budget * A.activities); b.MealBudget = Math.round(v.budget * A.meals); b.OtherBudget = Math.round(v.budget * A.other);
  if (v.cur !== b.DisplayCurrency) { b.DisplayCurrency = v.cur; b.ExchangeRate = CURS[v.cur].r; }
  recalc(db, itId); audit(db, it.UserID, "ITINERARY_UPDATED", `Updated trip details for "${v.title}"`);
}
export function benchmark(db, region) {
  const c = catalog(db, region), avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const b = avg(c.meals.filter((m) => m.MealType === "Breakfast").map((m) => m.Price)), d = avg(c.meals.filter((m) => m.MealType === "Dinner").map((m) => m.Price));
  const stays = c.stays.map((s) => s.PricePerNight).sort((x, y) => x - y), mid = stays.length ? stays[Math.floor(stays.length / 2)] : 0;
  return { avg: (b + d) * 3 + avg(c.activities.map((a) => a.ActivityCost)) * 6 + (mid / 2) * 2 + 15 * 12, rating: avg(c.stays.map((s) => s.Rating)) };
}
export const isMain = (d) => /\(main destination\)$/.test(d.Description || "");
export const mainDestinations = (db) => db.destination.filter((d) => isMain(d) && d.Status !== "Archived");
export const activeActivities = (db) => db.activity.filter((a) => a.AvailabilityStatus !== "Archived" && place(db, a.DestinationID)?.Status !== "Archived");
