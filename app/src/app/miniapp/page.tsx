"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import VesselSheet from "./components/VesselSheet";
import type { EnrichedVessel } from "@/lib/ais-feed";

const VesselMap = dynamic(
  () => import("./components/VesselMap"),
  { ssr: false }
);

export default function MiniAppHome() {
  const [selectedVessel, setSelectedVessel] = useState<EnrichedVessel | null>(
    null
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0B1426]">
      <VesselMap onSelectVessel={setSelectedVessel} />
      <VesselSheet
        vessel={selectedVessel}
        onClose={() => setSelectedVessel(null)}
      />
    </main>
  );
}
