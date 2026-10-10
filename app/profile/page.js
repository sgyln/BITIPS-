"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import PrefsForm from "@/components/PrefsForm";
import { Ends, Field, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { rowToPref } from "@/lib/consts";
import { dateRange, mainDestinations } from "@/lib/engine";

export default function ProfilePage() {
  const { db, user, prefRow, savePrefs, logout, updateProfile, toast } = useApp(), r = useRouter();
  const [p, setP] = useState(rowToPref(prefRow)), [m, setM] = useState(null), [err, setErr] = useState({});
  const [f, setF] = useState({ first: user.FirstName, last: user.LastName, email: user.Email, phone: user.PhoneNumber || "" });
  const trips = db.itinerary.filter((i) => i.UserID === user.UserID && i.Status !== "Deleted").sort((a, b) => b.ItineraryID - a.ItineraryID);
  const saveP = () => {
    const x = {}, em = f.email.trim().toLowerCase();
    if (!f.first.trim()) x.first = "Required"; if (!f.last.trim()) x.last = "Required"; if (!/^\S+@\S+\.\S+$/.test(em)) x.email = "Enter a valid email"; if (f.phone && !/^[0-9+\-\s]{7,20}$/.test(f.phone)) x.phone = "Enter a valid phone number";
    if (!Object.keys(x).length) { const e = updateProfile(f.first.trim(), f.last.trim(), em, f.phone.trim()); if (e) x.email = e; }
    setErr(x); if (!Object.keys(x).length) { setM(null); toast("Profile updated"); }
  };
  return (
    <Shell active="Profile">
      <main className="flex-1 overflow-auto p-8"><div className="max-w-[1120px] mx-auto">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px] mb-4">Profile</h1>
        <div className="grid lg:grid-cols-[minmax(260px,400px)_1fr] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <div className="box"><div className="w-[72px] h-[72px] rounded-full bg-hi grid place-items-center text-[26px] font-semibold">{user.FirstName[0].toUpperCase()}</div>
              <h2 className="text-[22px] font-semibold mt-3">{user.FirstName} {user.LastName}</h2><div className="text-tx2">{user.Email}</div>{user.PhoneNumber && <div className="text-tx2">{user.PhoneNumber}</div>}
              <div className="grid grid-cols-2 gap-3 mt-3.5">{[["Trips", trips.length], ["Booked", trips.filter((t) => t.Status === "Booked").length]].map(([a, b]) => <div key={a}><b className="block text-[28px] leading-9">{b}</b><span className="text-tx2">{a}</span></div>)}</div></div>
            <div className="box flex flex-col gap-2"><b>Account</b><button className="btn" onClick={() => setM("edit")}>Edit profile</button><button className="btn" onClick={() => r.push("/settings")}>Settings</button><button className="btn" onClick={() => setM("out")}>Sign out</button></div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="box"><b>Travel Preferences</b><PrefsForm value={p} onChange={setP} destinations={mainDestinations(db).map((d) => d.DestinationName)} /><Ends><button className="btn-p" onClick={() => { if (!p.interests.length) return toast("Pick at least one interest"); savePrefs(p); toast("Preferences saved"); }}>Save preferences</button></Ends></div>
            <div className="box"><b>Recent Itineraries</b>{trips.slice(0, 3).map((t) => <div key={t.ItineraryID} className="row items-center"><span>{t.ItineraryName}<br /><span className="lab text-tx2">{dateRange(t.StartDate, t.EndDate)}</span></span><Link href={`/trips/${t.ItineraryID}`} className="text-br font-medium">Open →</Link></div>)}{!trips.length && <div className="text-tx2 mt-2">Nothing yet.</div>}</div>
          </div>
        </div>
      </div></main>
      {m === "edit" && <Modal onClose={() => setM(null)}><h2 className="text-[22px] font-semibold">Edit profile</h2>
        <div className="grid grid-cols-2 gap-3"><Field label="First name" error={err.first}><input className="input" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} /></Field><Field label="Last name" error={err.last}><input className="input" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} /></Field></div>
        <Field label="Email" error={err.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone number" error={err.phone}><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Ends><button className="btn" onClick={() => setM(null)}>Cancel</button><button className="btn-p" onClick={saveP}>Save changes</button></Ends></Modal>}
      {m === "out" && <Modal onClose={() => setM(null)}><h2 className="text-[22px] font-semibold">Sign out?</h2><p className="text-tx2">{user.FirstName} {user.LastName} · {user.Email}</p><Ends><button className="btn" onClick={() => setM(null)}>Cancel</button><button className="btn-p" onClick={logout}>Sign out</button></Ends></Modal>}
    </Shell>
  );
}
