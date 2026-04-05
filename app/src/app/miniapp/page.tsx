"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import VesselSheet from "./components/VesselSheet";
import ProfileView from "./components/ProfileView";
import ChatView from "./components/ChatView";
import type { EnrichedVessel } from "@/lib/ais-feed";

const VesselMap = dynamic(
  () => import("./components/VesselMap"),
  { ssr: false }
);

type Tab = "map" | "chat" | "profile";

export default function MiniAppHome() {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [selectedVessel, setSelectedVessel] = useState<EnrichedVessel | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0B1426]">
      {/* ── Map Tab ─── */}
      <div className={activeTab === "map" ? "h-full" : "hidden"}>
        <VesselMap onSelectVessel={setSelectedVessel} onUserLocation={setUserLocation} />
        <VesselSheet
          vessel={selectedVessel}
          onClose={() => setSelectedVessel(null)}
          userLocation={userLocation}
        />
      </div>

      {/* ── Chat Tab ─── */}
      <div className={activeTab === "chat" ? "h-full" : "hidden"}>
        <ChatView />
      </div>

      {/* ── Profile Tab ─── */}
      <div className={activeTab === "profile" ? "h-full" : "hidden"}>
        <ProfileView />
      </div>

      {/* ── Bottom Tab Bar ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-1000 flex border-t border-[#1E3A5F]/40 bg-[#0B1426]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 min-h-[52px] justify-center transition-colors ${
            activeTab === "map" ? "text-[#3B82F6]" : "text-[#475569]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span className="font-[system-ui] text-[11px] font-medium">Map</span>
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 min-h-[52px] justify-center transition-colors ${
            activeTab === "chat" ? "text-[#3B82F6]" : "text-[#475569]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="font-[system-ui] text-[11px] font-medium">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 min-h-[52px] justify-center transition-colors ${
            activeTab === "profile" ? "text-[#3B82F6]" : "text-[#475569]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="font-[system-ui] text-[11px] font-medium">Profile</span>
        </button>
      </nav>
    </main>
  );
}
