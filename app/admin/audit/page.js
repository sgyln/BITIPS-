"use client";
import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useApp } from "@/components/Providers";

export default function AuditPage() {
  const { db } = useApp(), [type, setType] = useState("All"), [st, setSt] = useState("All"), [q, setQ] = useState("");
  const types = ["All", ...new Set(db.audit_log.map((a) => a.ActionType))].sort(), who = (id) => { const u = db.user.find((x) => x.UserID === id); return u ? `${u.FirstName} ${u.LastName}` : "Unknown"; };
  const rows = [...db.audit_log].reverse().filter((a) => (type === "All" || a.ActionType === type) && (st === "All" || a.ActivityStatus === st) && (!q || `${a.ActionDescription} ${who(a.UserID)}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 300);
  return (
    <AdminShell active="Audit Log">
      <div className="max-w-[1200px] flex flex-col gap-4">
        <div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Audit log</h1><div className="text-tx2">User and administrator actions (latest 300 matching).</div></div>
        <div className="flex gap-2 flex-wrap"><select className="input !w-[220px] !h-10" value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select><select className="input !w-[160px] !h-10" value={st} onChange={(e) => setSt(e.target.value)}>{["All", "Success", "Failed"].map((t) => <option key={t}>{t}</option>)}</select><input className="input !w-[280px] !h-10" placeholder="Search description or user" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="box !p-0 overflow-auto"><table className="w-full"><thead><tr>{["Time", "User", "Action", "Description", "IP", "Status"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{rows.map((a) => <tr key={a.AuditLogID}><td className="td whitespace-nowrap">{a.ActionDateTime.replace("T", " ").slice(0, 19)}</td><td className="td">{who(a.UserID)}</td><td className="td"><span className="badge bg-bg2 text-tx2">{a.ActionType}</span></td><td className="td">{a.ActionDescription}</td><td className="td lab text-tx2">{a.IPAddress}</td><td className="td"><span className={`badge ${a.ActivityStatus === "Success" ? "bg-ev text-ok" : "bg-ebg text-df"}`}>{a.ActivityStatus}</span></td></tr>)}</tbody></table>{!rows.length && <div className="p-5 text-tx2">No events match.</div>}</div>
      </div>
    </AdminShell>
  );
}
