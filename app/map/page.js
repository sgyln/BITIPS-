"use client";
import Shell from "@/components/Shell";
import MapView from "@/components/MapView";
import { useApp } from "@/components/Providers";
import { mainDestinations } from "@/lib/engine";

export default function MapPage() {
  const { db } = useApp();
  const stops = mainDestinations(db).map((d) => ({ lat: d.Latitude, lng: d.Longitude, name: d.DestinationName }));
  return (
    <Shell active="Explore">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-8 py-4"><h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Map explorer</h1><p className="text-tx2">Browse and search anywhere in the world. Detailed itineraries are available for the curated pilot destinations (pins).</p></div>
        <MapView stops={stops} legs={[]} className="flex-1 min-h-[400px]" />
      </div>
    </Shell>
  );
}
