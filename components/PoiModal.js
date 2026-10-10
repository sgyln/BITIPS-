"use client";
import { Ends, Icon, Modal } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { BD } from "@/lib/consts";
import { fD, fT, place } from "@/lib/engine";

export default function PoiModal({ a, onClose, onPlan }) {
  const { db, fmt, picks, setPicks, toast } = useApp(), pl = place(db, a.DestinationID);
  const add = () => {
    onClose();
    if (picks.includes(a.ActivityID)) return toast("Already queued");
    setPicks([...picks, a.ActivityID]);
    toast(`${a.ActivityName} added. It's included when you plan a trip.`, "Plan trip", onPlan);
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] font-semibold">{a.ActivityName}</h2>
      <div className="grid sm:grid-cols-2 gap-3 mt-4 items-start">
        <div className="bg-bg2 rounded-2xl h-[200px] grid place-items-center"><Icon t={a.ActivityType} size={64} /></div>
        <div>
          <div className="text-df font-semibold text-base">{a.ActivityCost ? `From ${fmt(a.ActivityCost)} / guest` : "Free entry"}</div>
          <span className={`badge my-2 ${BD[a.DataStatus]}`}>{a.DataStatus}</span>
          <div className="text-tx2">{a.Description}</div>
          {[["Location", pl.DestinationName], ["Starts", fT(a.OpeningTime)], ["Duration", fD(a.Duration)], ["Hours", `${fT(a.OpeningTime)} – ${fT(a.ClosingTime)}`]].map(([x, y]) => <div key={x} className="flex justify-between py-1.5 gap-3"><span className="text-tx2">{x}</span><b className="text-right">{y}</b></div>)}
        </div>
      </div>
      <Ends><button className="btn" onClick={onClose}>Close</button><button className="btn-p" onClick={add}>Add to Itinerary</button></Ends>
    </Modal>
  );
}
