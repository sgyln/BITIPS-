"use client";
import { useState } from "react";
import { Field, Logo } from "@/components/ui";
import { useApp } from "@/components/Providers";

export default function LoginPage() {
  const { login, register, toast } = useApp();
  const [up, setUp] = useState(false), [err, setErr] = useState({}), [banner, setBanner] = useState(""), [busy, setBusy] = useState(false);
  const blank = { first: "", last: "", email: "demo@bitips.ph", phone: "", pw: "bitips123", pw2: "" };
  const [f, setF] = useState(blank);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchTo = (u) => { setUp(u); setErr({}); setBanner(""); setF(u ? { ...blank, email: "", pw: "" } : blank); };
  const bad = (k) => (err[k] ? "border-df" : "");
  const submit = async (e) => {
    e.preventDefault();
    const em = f.email.trim().toLowerCase(), x = {};
    if (up && f.first.trim().length < 1) x.first = "Enter your first name";
    if (up && f.last.trim().length < 1) x.last = "Enter your last name";
    if (!/^\S+@\S+\.\S+$/.test(em)) x.email = "Enter a valid email";
    if (up && f.phone && !/^[0-9+\-\s]{7,20}$/.test(f.phone)) x.phone = "Enter a valid phone number";
    if (f.pw.length < 8) x.pw = "Use at least 8 characters";
    if (up && f.pw2 !== f.pw) x.pw2 = "Passwords do not match";
    setErr(x); setBanner(""); if (Object.keys(x).length) return;
    setBusy(true);
    const m = up ? await register(f.first.trim(), f.last.trim(), em, f.phone.trim(), f.pw) : await login(em, f.pw);
    if (m) { setBanner(m); setBusy(false); } else toast(up ? "Account created. Let's set your preferences." : "Welcome back");
  };
  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <div className="hidden lg:flex bg-bg2 px-20 py-16 flex-col gap-5 justify-center">
        <Logo size={72} />
        <h2 className="text-[40px] leading-[48px] tracking-[-1px] font-semibold max-w-[460px]">Plan trips that fit your budget.</h2>
        <p className="text-tx2 max-w-[440px]">Budget-Based Intelligent Travel Itinerary Planning System. Rule-based itineraries validated against your spending limit. Pilot destinations: Bacolod, Silay and Mambukal.</p>
        <div className="lab text-tx2 max-w-[440px]">Demo accounts: traveler demo@bitips.ph / bitips123 · administrator admin@bitips.ph / admin1234</div>
      </div>
      <div className="grid place-items-center p-6 overflow-auto">
        <form onSubmit={submit} noValidate className="bg-card border border-bd rounded-3xl p-9 w-full max-w-[480px]">
          <h3 className="text-[28px] leading-9 tracking-[-.5px] font-semibold">{up ? "Create account" : "Welcome back"}</h3>
          <p className="text-tx2">{up ? "Register as a traveler to start planning." : "Sign in as a traveler or administrator."}</p>
          <div className="flex gap-2 mt-4"><button type="button" onClick={() => switchTo(false)} className={`chip ${up ? "" : "chip-on"}`}>Sign in</button><button type="button" onClick={() => switchTo(true)} className={`chip ${up ? "chip-on" : ""}`}>Register</button></div>
          {banner && <div className="note note-w">{banner}</div>}
          {up && <div className="grid grid-cols-2 gap-3"><Field label="First name" error={err.first}><input className={`input ${bad("first")}`} value={f.first} onChange={on("first")} autoComplete="given-name" /></Field><Field label="Last name" error={err.last}><input className={`input ${bad("last")}`} value={f.last} onChange={on("last")} autoComplete="family-name" /></Field></div>}
          <Field label="Email" error={err.email}><input className={`input ${bad("email")}`} type="email" value={f.email} onChange={on("email")} autoComplete="email" /></Field>
          {up && <Field label="Phone number (optional)" error={err.phone}><input className={`input ${bad("phone")}`} value={f.phone} onChange={on("phone")} autoComplete="tel" /></Field>}
          <Field label="Password" error={err.pw}><input className={`input ${bad("pw")}`} type="password" value={f.pw} onChange={on("pw")} autoComplete={up ? "new-password" : "current-password"} /></Field>
          {up && <Field label="Confirm password" error={err.pw2}><input className={`input ${bad("pw2")}`} type="password" value={f.pw2} onChange={on("pw2")} autoComplete="new-password" /></Field>}
          <button className="btn-p w-full mt-5" disabled={busy}>{busy ? "Please wait…" : up ? "Create account" : "Sign in"}</button>
          <p className="lab text-tx2 text-center mt-3.5">Prototype: data is stored in this browser. Passwords are salted and hashed (SHA-256).</p>
        </form>
      </div>
    </div>
  );
}
