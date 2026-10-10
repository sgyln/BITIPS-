"use client";
import { ACC_RANGE, ACC_TYPES, CUISINES, INTS, LEVELS, PACE, STYLES, TRANSPORTS } from "@/lib/consts";

const Chips = ({ list, on, onPick }) => (
  <div className="flex gap-2 flex-wrap mt-2">{list.map((i) => <button key={i} onClick={() => onPick(i)} className={`chip ${on(i) ? "chip-on" : ""}`}>{on(i) ? "✓ " : ""}{i}</button>)}</div>
);
export default function PrefsForm({ value, onChange, destinations = [] }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const toggle = (i) => set("interests", value.interests.includes(i) ? value.interests.filter((x) => x !== i) : [...value.interests, i]);
  return (
    <div>
      <div className="mt-6">Travel Pace</div>
      <div className="grid grid-cols-3 bg-bg2 rounded-full mt-2">
        {PACE.map((p) => <button key={p} onClick={() => set("pace", p)} className={`h-12 rounded-full ${value.pace === p ? "bg-tx text-white font-semibold" : "text-tx2"}`}>{p}</button>)}
      </div>
      <div className="mt-6">Interests (preferred activity types)</div>
      <Chips list={INTS} on={(i) => value.interests.includes(i)} onPick={toggle} />
      <div className="mt-6">Accommodation</div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {ACC_TYPES.map((k) => (
          <button key={k} onClick={() => set("acc", k)} className={`relative text-left rounded-2xl p-4 border ${value.acc === k ? "bg-bg2 border-tx" : "bg-white border-bd"}`}>
            <i className={`absolute right-3.5 top-3.5 w-3.5 h-3.5 rounded-full border ${value.acc === k ? "bg-hi border-hi" : "bg-white border-bd"}`} />
            <div>{k}</div><div className="lab text-tx2">{ACC_RANGE[k]}</div>
          </button>
        ))}
      </div>
      <div className="mt-6">Local transport</div><Chips list={TRANSPORTS} on={(i) => value.transport === i} onPick={(i) => set("transport", i)} />
      <div className="mt-6">Meal preference</div><Chips list={CUISINES} on={(i) => value.meal === i} onPick={(i) => set("meal", i)} />
      <div className="mt-6">Budget level</div><Chips list={LEVELS} on={(i) => value.level === i} onPick={(i) => set("level", i)} />
      <div className="mt-6">Travel style</div><Chips list={STYLES} on={(i) => value.style === i} onPick={(i) => set("style", i)} />
      {destinations.length > 0 && (
        <div className="mt-6"><div>Preferred destination</div>
          <select className="input mt-2" value={value.dest} onChange={(e) => set("dest", e.target.value)}><option value="">No preference</option>{destinations.map((d) => <option key={d}>{d}</option>)}</select></div>
      )}
    </div>
  );
}
