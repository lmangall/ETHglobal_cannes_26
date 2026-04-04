"use client";

import { useEffect, useRef, useCallback } from "react";
import type { EnrichedVessel } from "@/lib/ais-feed";
import { useChatWithUser } from "@/lib/use-chat";

/* ── Helpers ───────────────────────────────────────────────── */

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function countryFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "";
  const codePoints = [...iso.toUpperCase()].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

function speedLabel(knots: number): string {
  if (knots < 0.5) return "At anchor";
  if (knots < 3) return "Maneuvering";
  return `${knots.toFixed(1)} kn`;
}

function courseLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/* ── Component ─────────────────────────────────────────────── */

interface VesselSheetProps {
  vessel: EnrichedVessel | null;
  onClose: () => void;
}

export default function VesselSheet({ vessel, onClose }: VesselSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const isOpen = vessel !== null;

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Touch drag-to-dismiss ─── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    currentY.current = Math.max(0, delta); // Only allow downward drag
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition =
        "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
      if (currentY.current > 100) {
        onClose();
      } else {
        sheetRef.current.style.transform = "translateY(0)";
      }
    }
    currentY.current = 0;
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-x-0 bottom-0 z-[2001] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[#1E3A5F]/60 bg-[#0B1426] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle — enlarged touch area */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="flex h-8 w-16 items-center justify-center">
            <div className="h-1 w-10 rounded-full bg-[#334155]" />
          </div>
        </div>

        {vessel && (
          <div className="px-5 pb-8 pt-2">
            {/* Header row */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{countryFlag(vessel.countryIso)}</span>
                  <h2 className="font-[system-ui] text-lg font-bold tracking-tight text-white">
                    {vessel.name}
                  </h2>
                </div>
                <p className="font-[system-ui] text-xs text-[#64748B] tracking-wide">
                  MMSI {vessel.mmsi}
                  {vessel.typeSpecific && (
                    <span className="text-[#475569]">
                      {" "}
                      &middot; {vessel.typeSpecific}
                    </span>
                  )}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1E3A5F]/50 bg-[#0C2340] transition-colors active:bg-[#1E3A5F]/40"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Registration badge */}
            {vessel.registered ? (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#D4A853]/20 bg-gradient-to-r from-[#D4A853]/8 to-transparent px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A853]/15">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D4A853"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="font-[system-ui] text-sm font-semibold text-[#D4A853]">
                    Verified on YachtRegistry
                  </p>
                  <p className="font-[system-ui] text-[11px] text-[#D4A853]/70">
                    On-chain since{" "}
                    {vessel.registeredAt
                      ? formatDate(vessel.registeredAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#334155]/40 bg-[#1E293B]/30 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#334155]/30">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="font-[system-ui] text-sm font-medium text-[#64748B]">
                    Not Registered
                  </p>
                  <p className="font-[system-ui] text-[11px] text-[#64748B]">
                    AIS data only — not verified on-chain
                  </p>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <StatCard
                label="Speed"
                value={speedLabel(vessel.speed)}
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                }
              />
              <StatCard
                label="Course"
                value={`${vessel.course}° ${courseLabel(vessel.course)}`}
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 2L12 22M12 2l-4 4M12 2l4 4" />
                  </svg>
                }
              />
              <StatCard
                label="Distance"
                value={`${vessel.distance.toFixed(1)} NM`}
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                  </svg>
                }
              />
              <StatCard
                label="Destination"
                value={vessel.destination ?? "Unknown"}
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                }
              />
            </div>

            {/* Owner info + Message button for registered vessels */}
            {vessel.registered && vessel.ownerWallet && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#1E3A5F]/40 bg-[#0C2340]/60 px-4 py-3">
                  <p className="mb-1 font-[system-ui] text-[11px] font-medium text-[#64748B] uppercase tracking-widest">
                    Owner Wallet
                  </p>
                  <p className="font-[monospace] text-sm text-[#94A3B8] tracking-wide">
                    {truncateAddress(vessel.ownerWallet)}
                  </p>
                </div>
                <ChatOwnerButton
                  ownerWallet={vessel.ownerWallet}
                  vesselName={vessel.name}
                />
              </div>
            )}

            {/* Last update */}
            <p className="mt-4 text-center font-[system-ui] text-[11px] text-[#64748B] tracking-wide">
              Last AIS report:{" "}
              {new Date(vessel.lastPositionUtc).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              UTC
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Chat Owner Button ────────────────────────────────────── */

function ChatOwnerButton({
  ownerWallet,
  vesselName,
}: {
  ownerWallet: string;
  vesselName: string;
}) {
  const { sendChat, loading, error } = useChatWithUser(ownerWallet);

  return (
    <div>
      <button
        onClick={() =>
          sendChat(`Hi — I'm interested in daywork opportunities on ${vesselName}`)
        }
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 font-[system-ui] text-sm font-semibold text-[#3B82F6] transition-colors active:bg-[#3B82F6]/20 disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {loading ? "Opening chat…" : "Message Owner"}
      </button>
      {error && (
        <p className="mt-1 text-center font-[system-ui] text-[11px] text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Stat Card subcomponent ────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[#475569]">
        {icon}
        <span className="font-[system-ui] text-[11px] font-medium uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="font-[system-ui] text-sm font-semibold text-white/90 leading-tight truncate">
        {value}
      </p>
    </div>
  );
}
