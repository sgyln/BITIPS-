export const ACC = { "Budget Inn": 900, Hotel: 2800, Resort: 5600 };
export const ACC_RANGE = { "Budget Inn": "₱500–1,200 / night", Hotel: "₱1,500–3,000 / night", Resort: "₱3,500+ / night" };
export const INTS = ["Heritage", "Culinary", "Nature", "Coastal"];
export const PACE = ["Relaxed", "Moderate", "Fast-Paced"];
export const CURS = { PHP: { s: "₱", r: 1 }, USD: { s: "$", r: 0.0175 }, EUR: { s: "€", r: 0.016 }, JPY: { s: "¥", r: 2.6 } };
export const DESTS = ["Bacolod, Negros Occidental", "Silay Heritage District", "Dumaguete City", "Mambukal Mountain Resort"];
export const FEAT = [
  { name: "Bacolod City", dest: 0, avg: "₱6,800", rating: 4.7, tag: "Heritage", bg: "linear-gradient(135deg,#8a6a4a,#d1b383)" },
  { name: "Silay Heritage District", dest: 1, avg: "₱5,200", rating: 4.6, tag: "Heritage", bg: "linear-gradient(135deg,#7f8f5a,#d6c58b)" },
  { name: "Mambukal Mountain Resort", dest: 3, avg: "₱7,400", rating: 4.5, tag: "Nature", bg: "linear-gradient(135deg,#4f7a5a,#a9c9a0)" },
];
export const BD = { "Admin-Maintained": "bg-bg2 text-tx2", Estimated: "bg-ebg text-efg", Live: "bg-ev text-ok", Cached: "bg-af text-br" };
export const SET0 = { alerts: true, remind: true, tips: false, cur: "PHP", lang: "English" };

// [id, name, cat, slots, cost pp, minutes, tag, source, mapX, mapY, description]
const RAW = [
  [1, "Heritage Church Visit", "act", "MA", 0, 60, "Heritage", "Admin-Maintained", 132, 661, "San Sebastian Cathedral and the old plaza church."],
  [2, "Sugar Museum Tour", "act", "A", 150, 120, "Heritage", "Live", 251, 491, "Negros sugar-era history, tools and stories."],
  [3, "Negros Museum Tour", "act", "A", 120, 120, "Heritage", "Admin-Maintained", 300, 560, "Local art, culture and history exhibits."],
  [4, "Old Town Walking Tour", "act", "MA", 200, 120, "Heritage", "Live", 190, 430, "Guided walk through the heritage district."],
  [5, "Ancestral House Circuit", "act", "A", 450, 180, "Heritage", "Admin-Maintained", 420, 380, "Visit preserved ancestral houses."],
  [6, "Plaza & Lagoon Walk", "act", "MAE", 0, 60, "Nature", "Estimated", 340, 610, "Free, easy walk around the lagoon park."],
  [7, "Mambukal Mountain Falls", "act", "A", 600, 240, "Nature", "Live", 500, 250, "Resort trail with waterfalls and hot springs."],
  [8, "Sunset at The Ruins", "act", "E", 100, 60, "Heritage", "Admin-Maintained", 515, 283, "Golden-hour visit to the famous mansion ruins."],
  [9, "Island Hopping Tour", "act", "A", 1800, 300, "Coastal", "Estimated", 580, 160, "Boat tour of nearby islets and sandbars."],
  [10, "Art District Gallery Walk", "act", "MA", 80, 60, "Heritage", "Admin-Maintained", 230, 330, "Murals and small galleries downtown."],
  [11, "Campuestohan Highland", "act", "A", 500, 180, "Nature", "Live", 470, 200, "Highland resort with views and gardens."],
  [20, "Carinderia Breakfast", "meal", "M", 120, 60, "Food", "Estimated", 200, 520, "Local rice meals at a neighborhood carinderia."],
  [21, "Café Breakfast Set", "meal", "M", 280, 60, "Food", "Cached", 280, 450, "Coffee and breakfast set at a downtown café."],
  [22, "Public Market Breakfast", "meal", "M", 320, 90, "Food", "Estimated", 250, 350, "Breakfast among the market stalls."],
  [23, "Hotel Buffet Breakfast", "meal", "M", 650, 60, "Food", "Cached", 160, 320, "Full buffet at partner hotels."],
  [30, "Chicken Inasal Dinner", "meal", "E", 260, 90, "Food", "Estimated", 330, 440, "Bacolod's grilled chicken signature."],
  [31, "Night Market Crawl", "meal", "E", 350, 120, "Food", "Estimated", 380, 540, "Street-food tasting crawl."],
  [32, "Seaside Seafood Dinner", "meal", "E", 780, 120, "Food", "Cached", 540, 180, "Fresh seafood by the bay."],
  [33, "Hotel Rooftop Dinner", "meal", "E", 950, 120, "Food", "Cached", 520, 230, "Rooftop dinner with city views."],
];
export const POI = RAW.map((a) => ({ id: a[0], name: a[1], cat: a[2], sl: a[3], cost: a[4], dur: a[5], tag: a[6], src: a[7], x: a[8], y: a[9], d: a[10] }));
export const poi = (id) => POI.find((p) => p.id === id);

export const rid = () => Math.floor(Math.random() * 1e9);
export const cl = (o) => JSON.parse(JSON.stringify(o));
export const slot = (t) => (t < 720 ? "M" : t < 1020 ? "A" : "E");
export const fT = (t) => { const h = Math.floor(t / 60); return `${((h + 11) % 12) + 1}:${String(t % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const fD = (m) => (m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : m + "m");
export const pesoPdf = (n) => "PHP " + Math.round(n).toLocaleString("en-US");

export const nd = (t) => Math.max(1, Math.round((new Date(t.end) - new Date(t.start)) / 864e5) + 1);
export const rooms = (t) => Math.ceil(t.trav / 2);
export const lodg = (t) => ACC[t.acc] * rooms(t) * (nd(t) - 1);
export function tot(t) {
  let a = 0, m = 0;
  t.days.flat().forEach((i) => (i.cat === "act" ? (a += i.cost * t.trav) : (m += i.cost * t.trav)));
  const tr = nd(t) * 400 * t.trav, lo = lodg(t);
  return { tr, lo, m, a, sum: tr + lo + m + a };
}
export function dr(t) {
  const a = new Date(t.start + "T00:00"), b = new Date(t.end + "T00:00"), o = { month: "short", day: "numeric" };
  return a.getMonth() === b.getMonth()
    ? `${a.toLocaleDateString("en-US", o)} – ${b.getDate()}, ${b.getFullYear()}`
    : `${a.toLocaleDateString("en-US", o)} – ${b.toLocaleDateString("en-US", o)}, ${b.getFullYear()}`;
}
export const mkI = (p, t) => ({ id: rid(), pid: p.id, name: p.name, cat: p.cat, cost: p.cost, dur: p.dur, src: p.src, em: p.tag, x: p.x, y: p.y, t });
const setFrom = (i, p) => Object.assign(i, { pid: p.id, name: p.name, cost: p.cost, dur: p.dur, src: p.src, em: p.tag, x: p.x, y: p.y });
export const swapOptions = (day, item) => POI.filter((p) => p.cat === item.cat && p.sl.includes(slot(item.t)) && !day.some((x) => x.pid === p.id));
export const addOptions = (day) => POI.filter((p) => p.cat === "act" && !day.some((x) => x.pid === p.id));
export function applySwap(trip, dayIdx, itemId, p) { setFrom(trip.days[dayIdx].find((i) => i.id === itemId), p); }
export function addActivity(trip, dayIdx, p) {
  const d = trip.days[dayIdx]; let t = { M: 570, A: 780, E: 1020 }[p.sl[0]];
  while (d.some((x) => x.t === t)) t += 90;
  d.push(mkI(p, t));
}
export function minCost(t) {
  const n = nd(t);
  return n * 400 * t.trav + ACC["Budget Inn"] * rooms(t) * (n - 1) + n * 380 * t.trav;
}
export function gen(t, pf, picks = []) {
  const n = nd(t), used = new Set(), M = { Food: "Culinary" };
  const d0 = Math.max(0, (t.budget - n * 400 * t.trav - lodg(t)) / n / t.trav);
  const pick = (cat, sl, cap) => {
    let f = POI.filter((p) => p.cat === cat && p.sl.includes(sl));
    const fr = f.filter((p) => !used.has(p.id)); if (fr.length) f = fr;
    const sc = (p) => (pf.interests.includes(M[p.tag] || p.tag) ? 1 : 0);
    const s = [...f].sort((a, b) => sc(b) - sc(a) || a.cost - b.cost);
    const r = s.find((p) => p.cost <= cap) || [...f].sort((a, b) => a.cost - b.cost)[0];
    used.add(r.id); return r;
  };
  const days = [];
  for (let d = 0; d < n; d++) {
    const a = [mkI(pick("meal", "M", d0 * 0.18), 480)];
    if (pf.pace !== "Relaxed") a.push(mkI(pick("act", "M", d0 * 0.25), 570));
    a.push(mkI(pick("act", "A", d0 * 0.3), 780));
    if (pf.pace === "Fast-Paced") a.push(mkI(pick("act", "E", d0 * 0.2), 1020));
    a.push(mkI(pick("meal", "E", d0 * 0.22), 1110));
    days.push(a);
  }
  picks.forEach((id, k) => {
    const d = days[k % n], p = poi(id);
    if (!p || d.some((x) => x.pid === id)) return;
    let tm = { M: 570, A: 780, E: 1020 }[p.sl[0]];
    while (d.some((x) => x.t === tm)) tm += 90;
    d.push(mkI(p, tm));
  });
  return days;
}
// Budget optimizer: lodging downgrade first, then biggest per-item savings.
export function plan(t) {
  const pr = []; let left = tot(t).sum - t.budget;
  if (left > 0 && t.acc !== "Budget Inn") {
    const a = Object.keys(ACC).filter((k) => ACC[k] < ACC[t.acc]).sort((x, y) => ACC[y] - ACC[x])[0];
    const sv = (ACC[t.acc] - ACC[a]) * rooms(t) * (nd(t) - 1);
    if (sv > 0) { pr.push({ acc: a, from: t.acc, sv, m: 94 }); left -= sv; }
  }
  const c = t.days.flat().map((i) => {
    const a = POI.filter((p) => p.cat === i.cat && p.sl.includes(slot(i.t)) && p.cost < i.cost).sort((x, y) => x.cost - y.cost)[0];
    return a ? { iid: i.id, name: i.name, cost: i.cost, a, sv: (i.cost - a.cost) * t.trav, m: a.tag === i.em ? 94 : 88 } : null;
  }).filter(Boolean).sort((x, y) => y.sv - x.sv);
  for (const x of c) { if (left <= 0 || pr.length >= 6) break; pr.push(x); left -= x.sv; }
  return { pr, left };
}
export function applyPlan(t, pr) {
  const all = t.days.flat();
  pr.forEach((p) => { if (p.acc) t.acc = p.acc; else setFrom(all.find((i) => i.id === p.iid), p.a); });
}
