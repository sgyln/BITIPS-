"use client";
// Leaflet + OpenStreetMap (Process 5.0): destination markers, route polylines with distance/time,
// worldwide browsing and destination search (Nominatim), ocean-boundary "route unavailable" state.
import { useEffect, useRef, useState } from "react";

export default function MapView({ stops = [], legs = [], center, search = true, className = "" }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), LRef = useRef(null);
  const [q, setQ] = useState(""), [msg, setMsg] = useState("");

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || map.current) return;
      LRef.current = L;
      map.current = L.map(el.current, { zoomControl: true }).setView(center || [10.6713, 122.9511], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      draw();
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sig = JSON.stringify([stops.map((s) => [s.lat, s.lng, s.name]), legs.map((l) => [l.from, l.to, l.boat, Math.round(l.km * 10), l.mins])]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { draw(); }, [sig]);

  function draw() {
    const L = LRef.current; if (!L || !map.current) return;
    layer.current.clearLayers();
    const pts = stops.filter((s) => s.lat != null).map((s) => [s.lat, s.lng]);
    legs.forEach((g) => {
      const a = stops[g.from], b = stops[g.to]; if (!a || !b) return;
      L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color: g.boat ? "#e8592a" : "#3d6473", weight: 4, dashArray: g.boat ? "8 8" : null })
        .bindTooltip(g.boat ? "Route unavailable · ocean boundary" : `${g.km.toFixed(1)} km · ${g.mins} min`, { permanent: true, direction: "center", className: "" }).addTo(layer.current);
    });
    stops.forEach((s, i) => s.lat != null && L.marker([s.lat, s.lng], { icon: L.divIcon({ className: "", html: `<div class="pin">${i + 1}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).bindPopup(`<b>${s.name}</b>`).addTo(layer.current));
    if (pts.length > 1) map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1) map.current.setView(pts[0], 15);
  }
  async function find(e) {
    e.preventDefault(); if (!q.trim()) return; setMsg("Searching…");
    try {
      const r = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`)).json();
      if (!r[0]) return setMsg("No match found.");
      map.current.flyTo([+r[0].lat, +r[0].lon], 13); setMsg(r[0].display_name.slice(0, 60));
    } catch { setMsg("Search unavailable (offline?)."); }
  }
  return (
    <section className={`relative ${className}`}>
      <div ref={el} className="absolute inset-0" />
      {search && (
        <form onSubmit={find} className="absolute top-3 left-3 right-14 z-[500] flex gap-2 max-w-[420px]">
          <input className="flex-1 h-10 rounded-full border border-bd px-4 bg-white shadow" placeholder="Search any place worldwide" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn shadow">Go</button>
        </form>
      )}
      {msg && <div className="absolute bottom-6 left-3 z-[500] bg-white rounded-full px-3 py-1 lab shadow">{msg}</div>}
    </section>
  );
}
