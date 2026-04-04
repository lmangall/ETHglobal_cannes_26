"use client";

import { useState, useEffect } from "react";
import { useChatWithUser } from "@/lib/use-chat";

/* ── Types ────────────────────────────────────────────────── */

interface AttestationRecord {
  id: number;
  attesterNullifier: string;
  subjectNullifier: string;
  vesselMmsi: string;
  role: string;
  rating: number;
  referenceText: string;
  subjectConfirmed: boolean;
  createdAt: number;
  confirmedAt: number;
  disputeNote: string;
  disputed: boolean;
}

interface ProfileData {
  nullifier: string;
  attestationsReceived: AttestationRecord[];
  attestationsGiven: AttestationRecord[];
  stats: {
    totalVoyages: number;
    avgRating: number;
    rolesHeld: string[];
    vesselMmsis: string[];
    yearsExperience: number;
    totalAttestationsGiven: number;
  };
}

type ViewMode = "pro" | "social";

/* ── Helpers ──────────────────────────────────────────────── */

const ROLE_COLORS: Record<string, string> = {
  CAPTAIN: "#D4A853",
  OFFICER: "#3B82F6",
  ENGINEER: "#F97316",
  CHEF: "#EF4444",
  STEWARD: "#A855F7",
  CREW: "#94A3B8",
};

const ROLE_ICONS: Record<string, string> = {
  CAPTAIN: "C",
  OFFICER: "O",
  ENGINEER: "E",
  CHEF: "CH",
  STEWARD: "S",
  CREW: "CR",
};

function truncateNullifier(n: string): string {
  if (n.length <= 12) return n;
  return `${n.slice(0, 6)}...${n.slice(-4)}`;
}

function formatDate(epoch: number): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncateMmsi(hex: string): string {
  if (!hex || hex === "0x0000000000000000000000000000000000000000000000000000000000000000") return "Unknown";
  const stripped = hex.replace(/^0x0+/, "");
  return stripped.length > 8 ? `${stripped.slice(0, 8)}...` : stripped || "0";
}

/* ── Star Rating ─────────────────────────────────────────── */

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#D4A853" : "none"}
          stroke={i <= rating ? "#D4A853" : "#475569"}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Skeleton Loading ────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center px-5 pt-10 pb-8 animate-pulse">
      {/* Avatar skeleton */}
      <div className="h-20 w-20 rounded-full bg-[#1E3A5F]/40" />
      <div className="mt-4 h-4 w-32 rounded bg-[#1E3A5F]/40" />
      <div className="mt-2 h-3 w-24 rounded bg-[#1E3A5F]/30" />

      {/* Stats skeleton */}
      <div className="mt-6 flex w-full gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-xl bg-[#0C2340]/40 p-4">
            <div className="mx-auto h-6 w-10 rounded bg-[#1E3A5F]/40" />
            <div className="mx-auto mt-2 h-3 w-16 rounded bg-[#1E3A5F]/30" />
          </div>
        ))}
      </div>

      {/* Toggle skeleton */}
      <div className="mt-6 h-10 w-48 rounded-full bg-[#0C2340]/60" />

      {/* Cards skeleton */}
      <div className="mt-6 w-full space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#1E3A5F]/20 bg-[#0C2340]/40 p-4">
            <div className="h-4 w-2/3 rounded bg-[#1E3A5F]/40" />
            <div className="mt-2 h-3 w-1/2 rounded bg-[#1E3A5F]/30" />
            <div className="mt-2 h-3 w-full rounded bg-[#1E3A5F]/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#1E3A5F]/40 bg-[#0C2340]/60">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 22c0-7 4-10 4-16a4 4 0 00-8 0c0 6 4 9 4 16z" />
          <circle cx="12" cy="6" r="1" fill="#475569" />
        </svg>
      </div>
      <p className="font-[system-ui] text-sm font-medium text-[#94A3B8]">No attestations yet</p>
      <p className="mt-1 font-[system-ui] text-xs text-[#475569]">
        Verify your identity on the map to start building your crew reputation
      </p>
    </div>
  );
}

/* ── Error State ─────────────────────────────────────────── */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#EF4444]/20 bg-[#EF4444]/5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <p className="font-[system-ui] text-sm font-semibold text-[#EF4444]">Signal Lost</p>
      <p className="mt-1 font-[system-ui] text-xs text-[#475569]">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg border border-[#1E3A5F]/40 bg-[#0C2340]/60 px-5 py-2 font-[system-ui] text-xs font-medium text-[#94A3B8] transition-colors active:scale-95 active:bg-[#1E3A5F]/40"
      >
        Retry
      </button>
    </div>
  );
}

/* ── Pro Mode ────────────────────────────────────────────── */

function ProMode({
  attestations,
  rolesHeld,
  targetWallet,
}: {
  attestations: AttestationRecord[];
  rolesHeld: string[];
  targetWallet?: string;
}) {
  const [availableForHire, setAvailableForHire] = useState(false);

  const sorted = [...attestations].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-5">
      {/* Available for Hire toggle */}
      <div className="flex items-center justify-between rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-4 py-3">
        <div>
          <p className="font-[system-ui] text-sm font-medium text-[#E2E8F0]">Available for Hire</p>
          <p className="font-[system-ui] text-[11px] text-[#64748B]">Let captains know you&apos;re looking</p>
        </div>
        <button
          onClick={() => setAvailableForHire(!availableForHire)}
          className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
            availableForHire ? "bg-[#D4A853]" : "bg-[#1E3A5F]/60"
          }`}
        >
          <div
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
              availableForHire ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Request Position button (when viewing someone else) */}
      {targetWallet && (
        <ChatButton
          walletAddress={targetWallet}
          message="Hi — I'd like to discuss a crew position opportunity with you"
          label="Request for Position"
          variant="subtle"
        />
      )}

      {/* Roles held */}
      {rolesHeld.length > 0 && (
        <div>
          <p className="mb-2 font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
            Roles Held
          </p>
          <div className="flex flex-wrap gap-2">
            {rolesHeld.map((role) => (
              <span
                key={role}
                className="rounded-lg px-3 py-1.5 font-[system-ui] text-xs font-semibold"
                style={{
                  backgroundColor: `${ROLE_COLORS[role] ?? "#64748B"}15`,
                  color: ROLE_COLORS[role] ?? "#64748B",
                  border: `1px solid ${ROLE_COLORS[role] ?? "#64748B"}30`,
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work history timeline */}
      <div>
        <p className="mb-3 font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
          Work History
        </p>

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative ml-3 border-l border-[#1E3A5F]/40 pl-6 space-y-4">
            {sorted.map((att) => (
              <div key={att.id} className="relative">
                {/* Timeline dot */}
                <div
                  className="absolute -left-[31px] top-3 h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: ROLE_COLORS[att.role] ?? "#64748B",
                    backgroundColor: att.subjectConfirmed && !att.disputed
                      ? ROLE_COLORS[att.role] ?? "#64748B"
                      : "transparent",
                  }}
                />

                <div className="rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 p-4">
                  {/* Header: role + status */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 font-[system-ui] text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${ROLE_COLORS[att.role] ?? "#64748B"}20`,
                          color: ROLE_COLORS[att.role] ?? "#64748B",
                        }}
                      >
                        {att.role}
                      </span>
                      <Stars rating={att.rating} size={12} />
                    </div>

                    {/* Status badge */}
                    {att.disputed ? (
                      <span className="flex items-center gap-1 rounded-md bg-[#EF4444]/10 px-2 py-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span className="font-[system-ui] text-[10px] font-semibold text-[#EF4444]">DISPUTED</span>
                      </span>
                    ) : att.subjectConfirmed ? (
                      <span className="flex items-center gap-1 rounded-md bg-[#16A34A]/10 px-2 py-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="font-[system-ui] text-[10px] font-semibold text-[#16A34A]">CONFIRMED</span>
                      </span>
                    ) : (
                      <span className="font-[system-ui] text-[10px] font-medium text-[#475569]">PENDING</span>
                    )}
                  </div>

                  {/* Vessel */}
                  <p className="font-[system-ui] text-xs text-[#94A3B8]">
                    <span className="text-[#64748B]">Vessel</span>{" "}
                    {truncateMmsi(att.vesselMmsi)}
                  </p>

                  {/* Reference text */}
                  {att.referenceText && (
                    <p className="mt-2 font-[system-ui] text-xs leading-relaxed text-[#94A3B8]/80 italic">
                      &ldquo;{att.referenceText}&rdquo;
                    </p>
                  )}

                  {/* Dispute note */}
                  {att.disputed && att.disputeNote && (
                    <div className="mt-2 rounded-lg border border-[#EF4444]/15 bg-[#EF4444]/5 px-3 py-2">
                      <p className="font-[system-ui] text-[11px] font-medium text-[#EF4444]/70">
                        Dispute: {att.disputeNote}
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <p className="mt-2 font-[system-ui] text-[11px] text-[#64748B]">
                    {formatDate(att.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Social Mode ─────────────────────────────────────────── */

function SocialMode({
  attestations,
  targetWallet,
}: {
  attestations: AttestationRecord[];
  targetWallet?: string;
}) {
  const sorted = [...attestations].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sorted[0] ?? null;
  const primaryRole = latest?.role ?? "CREW";

  return (
    <div className="space-y-5">
      {/* Large role badge */}
      <div className="flex flex-col items-center py-4">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full border-2"
          style={{
            borderColor: ROLE_COLORS[primaryRole] ?? "#64748B",
            backgroundColor: `${ROLE_COLORS[primaryRole] ?? "#64748B"}15`,
          }}
        >
          <span
            className="font-[system-ui] text-2xl font-bold"
            style={{ color: ROLE_COLORS[primaryRole] ?? "#64748B" }}
          >
            {ROLE_ICONS[primaryRole] ?? "?"}
          </span>
        </div>
        <p
          className="mt-3 font-[system-ui] text-lg font-bold tracking-wide"
          style={{ color: ROLE_COLORS[primaryRole] ?? "#64748B" }}
        >
          {primaryRole}
        </p>
        <p className="font-[system-ui] text-xs text-[#64748B]">Primary Role</p>
      </div>

      {/* Current vessel card */}
      {latest && (
        <div className="rounded-xl border border-[#1E3A5F]/40 bg-gradient-to-br from-[#0C2340]/80 to-[#0C2340]/40 p-4">
          <p className="mb-2 font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
            Current Vessel
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 20l2-2h4l2 2" />
                <path d="M14 20l2-2h4l2 2" />
                <path d="M6 12l-2 6h16l-2-6" />
                <path d="M12 4v8" />
                <path d="M8 8l4-4 4 4" />
              </svg>
            </div>
            <div>
              <p className="font-[system-ui] text-sm font-semibold text-[#E2E8F0]">
                {truncateMmsi(latest.vesselMmsi)}
              </p>
              <p className="font-[system-ui] text-[11px] text-[#64748B]">
                {latest.subjectConfirmed ? "Actively serving" : "Pending confirmation"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity feed */}
      <div>
        <p className="mb-3 font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
          Recent Activity
        </p>
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 rounded-xl border border-[#1E3A5F]/20 bg-[#0C2340]/30 px-4 py-3"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${ROLE_COLORS[att.role] ?? "#64748B"}15`,
                  }}
                >
                  <span
                    className="font-[system-ui] text-[11px] font-bold"
                    style={{ color: ROLE_COLORS[att.role] ?? "#64748B" }}
                  >
                    {ROLE_ICONS[att.role] ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[system-ui] text-xs font-medium text-[#E2E8F0] truncate">
                    {att.role} — {truncateMmsi(att.vesselMmsi)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Stars rating={att.rating} size={10} />
                    <span className="font-[system-ui] text-[11px] text-[#64748B]">{formatDate(att.createdAt)}</span>
                  </div>
                </div>
                {att.subjectConfirmed && !att.disputed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat button (when viewing someone else) */}
      {targetWallet ? (
        <ChatButton
          walletAddress={targetWallet}
          message="Hey from Yacht Trust! 👋"
          label="Say Hi"
          variant="primary"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[#1E3A5F]/40 bg-[#0C2340]/20 px-4 py-6 text-center">
          <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <p className="font-[system-ui] text-xs font-medium text-[#475569]">Crew Aboard</p>
          <p className="mt-0.5 font-[system-ui] text-[11px] text-[#475569]/60">
            Connect with crew on your vessel
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Chat Button ────────────────────────────────────────── */

function ChatButton({
  walletAddress,
  message,
  label,
  variant = "primary",
}: {
  walletAddress: string;
  message: string;
  label: string;
  variant?: "primary" | "subtle";
}) {
  const { sendChat, loading, error } = useChatWithUser(walletAddress);

  const styles =
    variant === "primary"
      ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6] active:bg-[#3B82F6]/20"
      : "border-[#D4A853]/30 bg-[#D4A853]/10 text-[#D4A853] active:bg-[#D4A853]/20";

  return (
    <div>
      <button
        onClick={() => sendChat(message)}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-[system-ui] text-sm font-semibold transition-colors disabled:opacity-50 ${styles}`}
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
        {loading ? "Opening chat…" : label}
      </button>
      {error && (
        <p className="mt-1 text-center font-[system-ui] text-[11px] text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Main ProfileView ────────────────────────────────────── */

interface ProfileViewProps {
  /** When set, shows chat buttons (viewing someone else's profile) */
  targetWallet?: string;
}

export default function ProfileView({ targetWallet }: ProfileViewProps) {
  const [mode, setMode] = useState<ViewMode>("pro");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to load profile" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!data) return <EmptyState />;

  const primaryRole = data.stats.rolesHeld[0] ?? "CREW";

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* ── Header ─── */}
      <div className="flex flex-col items-center px-5 pt-8 pb-2">
        {/* Avatar */}
        <div className="relative">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-2"
            style={{
              borderColor: ROLE_COLORS[primaryRole] ?? "#64748B",
              backgroundColor: `${ROLE_COLORS[primaryRole] ?? "#64748B"}12`,
            }}
          >
            <span
              className="font-[system-ui] text-2xl font-bold"
              style={{ color: ROLE_COLORS[primaryRole] ?? "#64748B" }}
            >
              {ROLE_ICONS[primaryRole] ?? "?"}
            </span>
          </div>
          {/* World ID verified badge */}
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0B1426] bg-[#D4A853]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Identity */}
        <p className="mt-3 font-[system-ui] text-sm font-semibold text-[#E2E8F0]">
          {truncateNullifier(data.nullifier)}
        </p>
        <p className="font-[system-ui] text-[11px] text-[#64748B]">World ID Verified</p>

        {/* Stats row */}
        <div className="mt-5 flex w-full gap-3">
          <div className="flex-1 rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-3 py-3 text-center">
            <p className="font-[system-ui] text-lg font-bold text-white">{data.stats.totalVoyages}</p>
            <p className="font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
              Voyages
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="font-[system-ui] text-lg font-bold text-white">
                {data.stats.avgRating > 0 ? data.stats.avgRating.toFixed(1) : "—"}
              </p>
              {data.stats.avgRating > 0 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A853" stroke="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </div>
            <p className="font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
              Rating
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-3 py-3 text-center">
            <p className="font-[system-ui] text-lg font-bold text-white">
              {data.stats.yearsExperience > 0 ? data.stats.yearsExperience : "—"}
            </p>
            <p className="font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
              Years
            </p>
          </div>
        </div>
      </div>

      {/* ── Mode Toggle ─── */}
      <div className="flex justify-center px-5 py-5">
        <div className="relative flex h-10 w-full max-w-[220px] rounded-full border border-[#1E3A5F]/40 bg-[#0C2340]/60 p-1">
          {/* Sliding indicator */}
          <div
            className="absolute top-1 h-8 w-[calc(50%-4px)] rounded-full bg-[#3B82F6] shadow-lg shadow-[#3B82F6]/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: mode === "pro" ? "translateX(0)" : "translateX(100%)",
            }}
          />
          <button
            onClick={() => setMode("pro")}
            className={`relative z-10 flex-1 rounded-full font-[system-ui] text-xs font-semibold tracking-wide transition-colors duration-200 ${
              mode === "pro" ? "text-white" : "text-[#475569]"
            }`}
          >
            Pro
          </button>
          <button
            onClick={() => setMode("social")}
            className={`relative z-10 flex-1 rounded-full font-[system-ui] text-xs font-semibold tracking-wide transition-colors duration-200 ${
              mode === "social" ? "text-white" : "text-[#475569]"
            }`}
          >
            Social
          </button>
        </div>
      </div>

      {/* ── Content ─── */}
      <div className="px-5">
        {mode === "pro" ? (
          <ProMode
            attestations={data.attestationsReceived}
            rolesHeld={data.stats.rolesHeld}
            targetWallet={targetWallet}
          />
        ) : (
          <SocialMode
            attestations={data.attestationsReceived}
            targetWallet={targetWallet}
          />
        )}

        {/* Attestations given count */}
        {data.stats.totalAttestationsGiven > 0 && (
          <div className="mt-6 rounded-xl border border-[#1E3A5F]/20 bg-[#0C2340]/30 px-4 py-3 text-center">
            <p className="font-[system-ui] text-xs text-[#64748B]">
              <span className="font-semibold text-[#94A3B8]">{data.stats.totalAttestationsGiven}</span>{" "}
              attestation{data.stats.totalAttestationsGiven === 1 ? "" : "s"} given to other crew
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
