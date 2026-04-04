/* ── Compact crew profile card ────────────────────────────── */

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

interface ProfileCardProps {
  nullifier: string;
  role: string;
  rating: number;
  totalVoyages: number;
  verified: boolean;
  onClick?: () => void;
}

export default function ProfileCard({
  nullifier,
  role,
  rating,
  totalVoyages,
  verified,
  onClick,
}: ProfileCardProps) {
  const color = ROLE_COLORS[role] ?? "#64748B";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border bg-[#0C2340]/40 px-4 py-3 text-left transition-colors active:scale-[0.98] active:bg-[#1E3A5F]/40 ${
        verified
          ? "border-[#D4A853]/25 shadow-[0_0_12px_rgba(212,168,83,0.08)]"
          : "border-[#1E3A5F]/30"
      }`}
    >
      {/* Avatar */}
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: `${color}60`,
          backgroundColor: `${color}12`,
        }}
      >
        <span
          className="font-[system-ui] text-xs font-bold"
          style={{ color }}
        >
          {ROLE_ICONS[role] ?? "?"}
        </span>
        {verified && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#0C2340] bg-[#D4A853]">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-[system-ui] text-sm font-semibold text-[#E2E8F0] truncate">
            {truncateNullifier(nullifier)}
          </p>
          <span
            className="shrink-0 rounded px-1.5 py-0.5 font-[system-ui] text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${color}18`,
              color,
            }}
          >
            {role}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          {/* Mini stars */}
          <div className="flex items-center gap-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={i <= rating ? "#D4A853" : "none"}
                stroke={i <= rating ? "#D4A853" : "#475569"}
                strokeWidth="1.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="font-[system-ui] text-[11px] text-[#475569]">
            {totalVoyages} voyage{totalVoyages === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <svg
        className="shrink-0"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
