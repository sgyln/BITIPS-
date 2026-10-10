"use client";
import { useEffect } from "react";

export const Logo = ({ size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} fill="none">
    <rect width="512" height="512" rx="128" fill="#F2ECE4" />
    <rect x="24" y="24" width="464" height="464" rx="104" fill="#FBF9F5" stroke="#E5DDD3" strokeWidth="3" />
    <circle cx="256" cy="256" r="148" stroke="#E5DDD3" strokeWidth="6" strokeDasharray="10 10" />
    <path d="M 160 312 C 160 216, 216 160, 312 160" stroke="#3D6473" strokeWidth="20" strokeLinecap="round" />
    <path d="M 194 318 L 322 190 M 322 190 L 254 190 M 322 190 L 322 258" stroke="#3D6473" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="256" cy="256" r="34" fill="#E8592A" />
    <circle cx="256" cy="256" r="14" fill="#FBF9F5" />
    <circle cx="160" cy="312" r="22" fill="#F59E0B" stroke="#FBF9F5" strokeWidth="6" />
  </svg>
);

const ICN = {
  Heritage: "M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18",
  Culinary: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10",
  Nature: "M12 21v-8M12 13c-4 0-6-3-6-7 4 0 6 3 6 7zM12 15c3 0 5-2 5-5-3 0-5 2-5 5z",
  Coastal: "M3 15c2.5-2 4.5-2 7 0s4.5 2 7 0 2.5-1 4-1M3 19c2.5-2 4.5-2 7 0s4.5 2 7 0M16 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  Explore: "M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM20 20l-4.5-4.5",
  Trips: "M6 7h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3zM9 7V5h6v2",
  Budget: "M6 6h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM16.5 12.5h.01",
  Profile: "M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c1-4 4-5 7-5s6 1 7 5",
  Map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  Dashboard: "M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-4H4z",
  Catalog: "M5 4h14v4H5zM5 10h14v4H5zM5 16h14v4H5z",
  Users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c.7-3.5 3-5 6-5s5.3 1.5 6 5M17 11a2.5 2.5 0 1 0 0-5M21 19c-.4-2.3-1.7-3.6-3.5-4",
  Audit: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6",
  Settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4",
};
export const Icon = ({ t, size = 24, color = "#4d4034" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICN[t] || ICN.Heritage} /></svg>
);

export function Modal({ children, onClose, dark, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-50 grid place-items-center p-5 ${dark ? "bg-tx/90" : "bg-tx/45"}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-card rounded-3xl p-8 w-full ${wide ? "max-w-[720px]" : "max-w-[560px]"} max-h-[92%] overflow-auto`}>{children}</div>
    </div>
  );
}
export const Field = ({ label, error, children }) => (
  <label className="block mt-3.5"><span className="block lab text-tx2 mb-1">{label}</span>{children}{error && <em className="not-italic text-df text-xs">{error}</em>}</label>
);
export const Ends = ({ children }) => <div className="flex gap-2 justify-end mt-5 flex-wrap">{children}</div>;
