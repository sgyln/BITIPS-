"use client";
import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Ends, Field, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { audit, insert } from "@/lib/db";
import { isMain, place } from "@/lib/engine";

const T = ["Heritage", "Culinary", "Nature", "Coastal"], DS = ["Admin-Maintained", "Estimated"], AV = ["Available", "Limited", "Unavailable", "Archived"];
// Process 2.0: generic CRUD for the five catalog tables; "Archive" is a soft delete (status label).
const ENT = {
  destination: { label: "Destinations & POIs", pk: "DestinationID", name: "DestinationName", status: "Status", cols: ["DestinationName", "Region", "City", "Status"], fields: [["DestinationName", "Name", "text", 1], ["Region", "Region (itinerary cluster)", "text", 1], ["City", "City", "text"], ["Description", "Description", "text"], ["Latitude", "Latitude", "number", 1], ["Longitude", "Longitude", "number", 1], ["Accessibility", "Access", ["Road", "Boat"]], ["Status", "Status", ["Active", "Limited", "Archived"]], ["_main", "Main destination (selectable for trips)", "check"]] },
  activity: { label: "Activities", pk: "ActivityID", name: "ActivityName", status: "AvailabilityStatus", cols: ["ActivityName", "ActivityType", "ActivityCost", "AvailabilityStatus"], fields: [["DestinationID", "Location", "place", 1], ["ActivityName", "Name", "text", 1], ["ActivityType", "Type", T], ["Description", "Description", "text"], ["Duration", "Duration (minutes)", "number", 1], ["ActivityCost", "Cost per person (PHP)", "number", 1], ["OpeningTime", "Opening time", "time", 1], ["ClosingTime", "Closing time", "time", 1], ["AvailabilityStatus", "Availability", AV], ["DataStatus", "Data status", DS]] },
  accommodation: { label: "Accommodations", pk: "AccommodationID", name: "AccommodationName", status: "AvailabilityStatus", cols: ["AccommodationName", "AccommodationType", "PricePerNight", "AvailabilityStatus"], fields: [["DestinationID", "Location", "place", 1], ["AccommodationName", "Name", "text", 1], ["AccommodationType", "Type", ["Budget Inn", "Hotel", "Resort"]], ["Address", "Address", "text"], ["ContactNumber", "Contact number", "text"], ["PricePerNight", "Price per night (PHP)", "number", 1], ["Rating", "Rating (0-5)", "number"], ["AvailabilityStatus", "Availability", AV], ["DataStatus", "Data status", DS]] },
  meal_option: { label: "Meals", pk: "MealID", name: "MealName", status: "AvailabilityStatus", cols: ["MealName", "MealType", "Price", "AvailabilityStatus"], fields: [["DestinationID", "Location", "place", 1], ["MealName", "Name", "text", 1], ["MealType", "Meal type", ["Breakfast", "Lunch", "Dinner"]], ["Cuisine", "Cuisine", ["Local Cuisine", "Street Food", "Café", "Hotel Dining"]], ["Description", "Description", "text"], ["Price", "Price per person (PHP)", "number", 1], ["AvailabilityStatus", "Availability", AV], ["DataStatus", "Data status", DS]] },
  transport_option: { label: "Transport fares", pk: "TransportID", name: "TransportType", status: "AvailabilityStatus", cols: ["TransportType", "ProviderName", "Fare", "AvailabilityStatus"], fields: [["DestinationID", "Main destination", "main", 1], ["TransportType", "Type", ["Jeepney", "Tricycle", "Taxi"]], ["ProviderName", "Provider", "text"], ["RouteDescription", "Route description", "text"], ["Fare", "Fare per trip (PHP)", "number", 1], ["AvailabilityStatus", "Availability", AV], ["DataStatus", "Data status", DS]] },
};
const blank = (e) => Object.fromEntries(ENT[e].fields.map(([k, , t]) => [k, Array.isArray(t) ? t[0] : t === "number" ? "" : t === "check" ? false : t === "place" || t === "main" ? "" : ""]));

export default function CatalogPage() {
  const { db, user, commit, toast } = useApp(), [tab, setTab] = useState("destination"), [form, setForm] = useState(null), [err, setErr] = useState({}), [q, setQ] = useState("");
  const E = ENT[tab], rows = db[tab].filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const places = db.destination.filter((d) => d.Status !== "Archived"), mains = places.filter(isMain);
  const open = (r) => { setErr({}); setForm(r ? { id: r[E.pk], v: { ...blank(tab), ...r, _main: tab === "destination" ? isMain(r) : false } } : { id: null, v: blank(tab) }); };
  const save = () => {
    const x = {}, v = form.v;
    E.fields.forEach(([k, l, t, req]) => { const val = v[k]; if (req && (val === "" || val == null)) x[k] = "Required"; if (t === "number" && val !== "" && (isNaN(+val) || +val < 0) && k !== "Latitude" && k !== "Longitude") x[k] = "Must be 0 or more"; });
    if (tab === "destination") { if (v.Latitude !== "" && Math.abs(+v.Latitude) > 90) x.Latitude = "−90 to 90"; if (v.Longitude !== "" && Math.abs(+v.Longitude) > 180) x.Longitude = "−180 to 180"; }
    if (tab === "activity" && v.OpeningTime && v.ClosingTime && v.ClosingTime <= v.OpeningTime) x.ClosingTime = "Must be after opening time";
    if (tab === "accommodation" && v.Rating !== "" && v.Rating != null && +v.Rating > 5) x.Rating = "Max 5";
    setErr(x); if (Object.keys(x).length) return;
    commit((d) => {
      const row = { ...v }; delete row._main;
      E.fields.forEach(([k, , t]) => { if (t === "number" && row[k] !== "") row[k] = +row[k]; if (t === "number" && row[k] === "") row[k] = null; if (t === "place" || t === "main") row[k] = +row[k]; });
      if (tab === "destination") { const base = (row.Description || row.DestinationName).replace(/\s*\(main destination\)$/, ""); row.Description = v._main ? `${base} (main destination)` : base; row.Country = row.Country || "Philippines"; }
      if (form.id) Object.assign(d[tab].find((r) => r[E.pk] === form.id), row); else insert(d, tab, row);
      audit(d, user.UserID, form.id ? "CATALOG_UPDATE" : "CATALOG_CREATE", `${E.label}: ${row[E.name]}`);
    });
    setForm(null); toast("Saved");
  };
  const archive = (r) => { const was = r[E.status]; const to = was === "Archived" ? (tab === "destination" ? "Active" : "Available") : "Archived"; commit((d) => { d[tab].find((x) => x[E.pk] === r[E.pk])[E.status] = to; audit(d, user.UserID, "CATALOG_" + to.toUpperCase(), `${E.label}: ${r[E.name]}`); }); toast(to === "Archived" ? "Archived (hidden from itineraries)" : "Restored"); };
  const show = (r, c) => (c === "ActivityCost" || c === "PricePerNight" || c === "Price" || c === "Fare" ? "₱" + r[c] : r[c]);
  return (
    <AdminShell active="Catalog">
      <div className="max-w-[1200px] flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-3"><div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Travel master data</h1><div className="text-tx2">Add, edit or archive catalog records. Changes feed the itinerary generator immediately.</div></div><button className="btn-p" onClick={() => open(null)}>+ Add record</button></div>
        <div className="flex gap-2 flex-wrap">{Object.entries(ENT).map(([k, e]) => <button key={k} className={`chip ${tab === k ? "chip-on" : ""}`} onClick={() => { setTab(k); setQ(""); }}>{e.label}</button>)}</div>
        <input className="input !max-w-[360px]" placeholder="Filter records" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="box !p-0 overflow-auto"><table className="w-full"><thead><tr>{E.cols.map((c) => <th key={c} className="th">{c.replace(/([A-Z])/g, " $1").trim()}</th>)}{tab !== "destination" && <th className="th">Location</th>}<th className="th">Data status</th><th className="th" /></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[E.pk]} className={r[E.status] === "Archived" ? "opacity-50" : ""}>{E.cols.map((c) => <td key={c} className="td">{show(r, c)}</td>)}{tab !== "destination" && <td className="td">{place(db, r.DestinationID)?.DestinationName}</td>}<td className="td">{r.DataStatus || (tab === "destination" && isMain(r) ? "Main destination" : "—")}</td><td className="td whitespace-nowrap text-right"><button className="btn-sm mr-2" onClick={() => open(r)}>Edit</button><button className="btn-sm" onClick={() => archive(r)}>{r[E.status] === "Archived" ? "Restore" : "Archive"}</button></td></tr>)}</tbody></table>
          {!rows.length && <div className="p-5 text-tx2">No records.</div>}</div>
      </div>
      {form && <Modal onClose={() => setForm(null)} wide><h2 className="text-[22px] font-semibold">{form.id ? "Edit" : "Add"} {E.label.toLowerCase()}</h2>
        <div className="grid sm:grid-cols-2 gap-x-3">{E.fields.map(([k, l, t]) => <div key={k} className={t === "check" ? "sm:col-span-2" : ""}>{t === "check" ? <label className="flex gap-2 items-center mt-4"><input type="checkbox" checked={!!form.v[k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [k]: e.target.checked } })} />{l}</label> :
          <Field label={l} error={err[k]}>{Array.isArray(t) ? <select className="input" value={form.v[k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [k]: e.target.value } })}>{t.map((o) => <option key={o}>{o}</option>)}</select>
            : t === "place" || t === "main" ? <select className="input" value={form.v[k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [k]: e.target.value } })}><option value="">Select…</option>{(t === "main" ? mains : places).map((d) => <option key={d.DestinationID} value={d.DestinationID}>{d.DestinationName}</option>)}</select>
            : <input className={`input ${err[k] ? "border-df" : ""}`} type={t === "number" ? "number" : t === "time" ? "time" : "text"} step={t === "number" ? "any" : undefined} value={form.v[k] ?? ""} onChange={(e) => setForm({ ...form, v: { ...form.v, [k]: e.target.value } })} />}</Field>}</div>)}</div>
        <Ends><button className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn-p" onClick={save}>Save</button></Ends></Modal>}
    </AdminShell>
  );
}
