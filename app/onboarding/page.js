"use client";
import { useState } from "react";
import PrefsForm from "@/components/PrefsForm";
import { useApp } from "@/components/Providers";
import { rowToPref } from "@/lib/consts";
import { mainDestinations } from "@/lib/engine";

export default function OnboardingPage() {
  const { db, savePrefs, toast } = useApp();
  const [p, setP] = useState(rowToPref(null));
  const save = () => { if (!p.interests.length) return toast("Pick at least one interest"); savePrefs(p); toast("Preferences saved"); };
  return (
    <div className="min-h-screen grid place-items-start justify-center px-6 py-16">
      <div className="w-[min(720px,100%)]">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-.5px]">Personalize Your Travel Profile</h1>
        <p className="text-tx2">Tell us how you like to travel. These preferences weight every itinerary. You can change them later in Profile.</p>
        <PrefsForm value={p} onChange={setP} destinations={mainDestinations(db).map((d) => d.DestinationName)} />
        <button className="btn-p w-full mt-9" onClick={save}>Save Preferences &amp; Continue</button>
      </div>
    </div>
  );
}
