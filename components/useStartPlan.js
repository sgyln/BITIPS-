"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";

export default function useStartPlan() {
  const r = useRouter(), { setDraft, cur } = useApp();
  return (destId) => { setDraft({ title: "", origin: "Manila", destId, start: "2026-11-14", end: "2026-11-16", trav: 2, budget: 15000, cur }); r.push("/plan"); };
}
