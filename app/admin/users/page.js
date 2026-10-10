"use client";
import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useApp } from "@/components/Providers";
import { audit, now } from "@/lib/db";

export default function UsersPage() {
  const { db, user: me, commit, toast } = useApp(), [q, setQ] = useState("");
  const rows = db.user.filter((u) => !q || `${u.FirstName} ${u.LastName} ${u.Email}`.toLowerCase().includes(q.toLowerCase()));
  const upd = (u, patch, what) => { commit((d) => { Object.assign(d.user.find((x) => x.UserID === u.UserID), patch, { UpdatedAt: now() }); audit(d, me.UserID, "USER_ADMIN", `${what}: ${u.Email}`); }); toast("User updated"); };
  return (
    <AdminShell active="Users">
      <div className="max-w-[1100px] flex flex-col gap-4">
        <div><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Users &amp; roles</h1><div className="text-tx2">Travelers and administrators. Suspended accounts cannot sign in.</div></div>
        <input className="input !max-w-[360px]" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="box !p-0 overflow-auto"><table className="w-full"><thead><tr>{["Name", "Email", "Phone", "Role", "Status", "Created", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{rows.map((u) => { const self = u.UserID === me.UserID; return (
            <tr key={u.UserID}><td className="td">{u.FirstName} {u.LastName}{self && <span className="badge bg-bg2 text-tx2 ml-2">you</span>}</td><td className="td">{u.Email}</td><td className="td">{u.PhoneNumber || "—"}</td>
              <td className="td"><select disabled={self} className="h-9 rounded-lg border border-bd px-2 bg-white" value={u.UserRole} onChange={(e) => upd(u, { UserRole: e.target.value }, "Role → " + e.target.value)}><option>Traveler</option><option>Administrator</option></select></td>
              <td className="td"><span className={`badge ${u.AccountStatus === "Active" ? "bg-ev text-ok" : "bg-ebg text-df"}`}>{u.AccountStatus}</span></td><td className="td">{u.CreatedAt.slice(0, 10)}</td>
              <td className="td text-right"><button disabled={self} className="btn-sm" onClick={() => upd(u, { AccountStatus: u.AccountStatus === "Active" ? "Suspended" : "Active" }, u.AccountStatus === "Active" ? "Suspended" : "Reactivated")}>{u.AccountStatus === "Active" ? "Suspend" : "Reactivate"}</button></td></tr>); })}</tbody></table></div>
      </div>
    </AdminShell>
  );
}
