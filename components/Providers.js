"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { audit, freshDb, insert, loadDb, now, saveDb } from "@/lib/db";
import { checkHash, makeHash } from "@/lib/hash";
import { money } from "@/lib/engine";
import { CURS } from "@/lib/seed";
import { prefToRow } from "@/lib/consts";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const SESSION = "bitips_session";

export default function Providers({ children }) {
  const router = useRouter(), path = usePathname();
  const [db, setDb] = useState(null);
  const [uid, setUid] = useState(null);
  const [picks, setPicks] = useState([]);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState({ q: "", c: "All" });
  const [toastS, setToastS] = useState(null);
  const ref = useRef(null), timer = useRef(null);
  const failProvider = useRef(false), failPayment = useRef(false);

  useEffect(() => {
    (async () => {
      let d = loadDb();
      if (!d || !d.user) { d = await freshDb(); saveDb(d); }
      ref.current = d; setDb(d);
      const s = Number(localStorage.getItem(SESSION));
      if (s && d.user.some((u) => u.UserID === s && u.AccountStatus === "Active")) setUid(s);
    })();
  }, []);

  const user = db && db.user.find((u) => u.UserID === uid);
  const isAdmin = user?.UserRole === "Administrator";
  const prefRow = db && user ? db.user_preference.find((p) => p.UserID === user.UserID) : null;

  // Route guards: login -> preferences (travelers) -> app; administrators go to /admin
  useEffect(() => {
    if (!db) return;
    if (!user) { if (path !== "/login") router.replace("/login"); return; }
    if (isAdmin) { if (!path.startsWith("/admin")) router.replace("/admin"); return; }
    if (path.startsWith("/admin")) { router.replace("/"); return; }
    if (!prefRow) { if (path !== "/onboarding") router.replace("/onboarding"); return; }
    if (path === "/login" || path === "/onboarding") router.replace("/");
  }, [db, user, isAdmin, prefRow, path, router]);

  const toast = useCallback((msg, label, fn) => {
    clearTimeout(timer.current); setToastS({ msg, label, fn });
    timer.current = setTimeout(() => setToastS(null), label ? 5000 : 2400);
  }, []);
  // Every write goes through commit(): clone -> mutate -> persist -> re-render.
  const commit = (fn) => { const n = structuredClone(ref.current); const r = fn(n); ref.current = n; setDb(n); saveDb(n); return r; };

  const api = {
    db, user, isAdmin, prefRow, commit, toast, picks, setPicks, draft, setDraft, search, setSearch, failProvider, failPayment,
    cur: prefRow?.DisplayCurrency || "PHP",
    fmt: (n) => money(n, prefRow?.DisplayCurrency || "PHP", (CURS[prefRow?.DisplayCurrency] || CURS.PHP).r),
    async register(first, last, email, phone, pw) {
      if (db.user.some((u) => u.Email.toLowerCase() === email)) return "An account with this email already exists.";
      const hash = await makeHash(pw);
      const id = commit((d) => { const u = insert(d, "user", { FirstName: first, LastName: last, Email: email, PasswordHash: hash, PhoneNumber: phone, UserRole: "Traveler", AccountStatus: "Active", CreatedAt: now(), UpdatedAt: null }); audit(d, u.UserID, "REGISTER", "New traveler account registered"); return u.UserID; });
      localStorage.setItem(SESSION, id); setUid(id); return null;
    },
    async login(email, pw) {
      const u = db.user.find((x) => x.Email.toLowerCase() === email);
      if (!u || !(await checkHash(pw, u.PasswordHash))) { if (u) commit((d) => audit(d, u.UserID, "LOGIN_FAILED", "Incorrect password", "Failed")); return "Incorrect email or password."; }
      if (u.AccountStatus !== "Active") { commit((d) => audit(d, u.UserID, "LOGIN_BLOCKED", "Suspended account", "Failed")); return "This account is suspended. Contact an administrator."; }
      commit((d) => audit(d, u.UserID, "LOGIN", `${u.UserRole} signed in`));
      localStorage.setItem(SESSION, u.UserID); setUid(u.UserID); return null;
    },
    logout() { if (user) commit((d) => audit(d, user.UserID, "LOGOUT", "Signed out")); localStorage.removeItem(SESSION); setUid(null); setDraft(null); router.replace("/login"); },
    savePrefs(p) {
      commit((d) => {
        const row = prefToRow(p), ex = d.user_preference.find((x) => x.UserID === user.UserID);
        if (ex) Object.assign(ex, row, { UpdatedAt: now() }); else insert(d, "user_preference", { UserID: user.UserID, ...row, UpdatedAt: now(), DisplayCurrency: "PHP", Language: "English", NotifyBudgetAlerts: true, NotifyReminders: true, NotifyTips: false });
        audit(d, user.UserID, "PREFERENCES_UPDATED", "Travel preferences saved");
      });
    },
    setSetting(patch) { commit((d) => { Object.assign(d.user_preference.find((x) => x.UserID === user.UserID), patch, { UpdatedAt: now() }); audit(d, user.UserID, "SETTINGS_UPDATED", Object.keys(patch).join(", ")); }); },
    updateProfile(first, last, email, phone) {
      if (email !== user.Email.toLowerCase() && db.user.some((u) => u.Email.toLowerCase() === email)) return "Email already in use";
      commit((d) => { Object.assign(d.user.find((u) => u.UserID === user.UserID), { FirstName: first, LastName: last, Email: email, PhoneNumber: phone, UpdatedAt: now() }); audit(d, user.UserID, "PROFILE_UPDATED", "Profile details changed"); });
      return null;
    },
  };
  if (!db) return null;
  if (!user && path !== "/login") return null;
  return (
    <Ctx.Provider value={api}>
      {children}
      {toastS && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] bg-tx text-white px-[18px] py-2.5 rounded-full">
          {toastS.msg}
          {toastS.label && <button className="ml-2.5 font-semibold text-mo" onClick={() => { toastS.fn?.(); setToastS(null); }}>{toastS.label}</button>}
        </div>
      )}
    </Ctx.Provider>
  );
}
