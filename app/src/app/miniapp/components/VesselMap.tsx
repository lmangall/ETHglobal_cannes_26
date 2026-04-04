"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EnrichedVessel } from "@/lib/ais-feed";

/* ── Marker Factories ─────────────────────────────────────── */

function registeredIcon(heading: number, name: string) {
  const label = name.length > 14 ? name.slice(0, 13) + "…" : name;
  return L.divIcon({
    className: "",
    iconSize: [36, 56],
    iconAnchor: [18, 18],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="16" fill="#0C2340" stroke="#D4A853" stroke-width="2"/>
        <circle cx="18" cy="18" r="10" fill="#1A3A5C" stroke="#3B82F6" stroke-width="1.5" opacity="0.9"/>
        <polygon points="18,6 21,15 18,13 15,15" fill="#D4A853" transform="rotate(${heading}, 18, 18)" opacity="0.95"/>
        <circle cx="18" cy="18" r="3" fill="#D4A853"/>
        <circle cx="27" cy="9" r="6" fill="#16A34A" stroke="#0C2340" stroke-width="1.5"/>
        <path d="M24.5 9L26.5 11L30 7.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <span style="margin-top:2px;font-size:9px;font-weight:600;font-family:system-ui;color:#D4A853;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;letter-spacing:0.3px">${label}</span>
    </div>`,
  });
}

function unregisteredIcon(heading: number, name: string) {
  const label = name.length > 14 ? name.slice(0, 13) + "…" : name;
  return L.divIcon({
    className: "",
    iconSize: [28, 46],
    iconAnchor: [14, 14],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="#1E293B" stroke="#475569" stroke-width="1.5" opacity="0.85"/>
        <polygon points="14,5 16.5,12 14,10.5 11.5,12" fill="#94A3B8" transform="rotate(${heading}, 14, 14)" opacity="0.8"/>
        <circle cx="14" cy="14" r="2.5" fill="#64748B"/>
      </svg>
      <span style="margin-top:2px;font-size:8px;font-weight:500;font-family:system-ui;color:#64748B;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;letter-spacing:0.2px">${label}</span>
    </div>`,
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    html: `<div style="position:relative;width:48px;height:48px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.12);border:1.5px solid rgba(59,130,246,0.3);animation:pulse-ring 2s ease-out infinite"></div>
      <div style="position:absolute;top:50%;left:50%;width:18px;height:18px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(59,130,246,0.35);border:2px solid #3B82F6"></div>
      <div style="position:absolute;top:50%;left:50%;width:10px;height:10px;transform:translate(-50%,-50%);border-radius:50%;background:#3B82F6;box-shadow:0 0 8px rgba(59,130,246,0.6)"></div>
      <style>@keyframes pulse-ring{0%{transform:scale(0.8);opacity:1}100%{transform:scale(1.4);opacity:0}}</style>
    </div>`,
  });
}

/* ── Map Controls ──────────────────────────────────────────── */

function RecenterButton({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo([lat, lon], 13, { duration: 0.8 })}
      aria-label="Center on my location"
      className="absolute bottom-28 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full border border-[#1E3A5F] bg-[#0B1426]/90 shadow-lg shadow-black/40 backdrop-blur-sm transition-all active:scale-95"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
}

function MapEventHandler({
  onMoveEnd,
}: {
  onMoveEnd: (center: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoveEnd(center);
    },
  });
  return null;
}

/* ── Loading State ─────────────────────────────────────────── */

function MapSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B1426]">
      {/* Radar sweep animation */}
      <div className="relative mb-6 h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-[#1E3A5F]" />
        <div className="absolute inset-3 rounded-full border border-[#1E3A5F]/60" />
        <div className="absolute inset-6 rounded-full border border-[#1E3A5F]/40" />
        <div className="absolute inset-0 origin-center animate-spin rounded-full [animation-duration:3s]">
          <div className="h-1/2 w-1/2 rounded-tl-full bg-gradient-to-br from-[#3B82F6]/30 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>
      </div>
      <p className="font-[system-ui] text-sm font-medium tracking-widest text-[#64748B] uppercase">
        Acquiring Position
      </p>
      <div className="mt-2 flex gap-1">
        <span className="h-1 w-1 animate-pulse rounded-full bg-[#3B82F6] [animation-delay:0ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-[#3B82F6] [animation-delay:200ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-[#3B82F6] [animation-delay:400ms]" />
      </div>
    </div>
  );
}

/* ── Error State ───────────────────────────────────────────── */

function MapError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B1426] px-8">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#7F1D1D]/40 bg-[#7F1D1D]/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="mb-1 text-center font-[system-ui] text-base font-semibold text-white/90">
        Signal Lost
      </p>
      <p className="mb-6 max-w-[260px] text-center font-[system-ui] text-sm text-[#64748B] leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="rounded-lg border border-[#1E3A5F] bg-[#0C2340] px-6 py-3 font-[system-ui] text-sm font-medium text-[#3B82F6] tracking-wide transition-all active:scale-95 active:bg-[#1E3A5F]/40"
      >
        Retry Connection
      </button>
    </div>
  );
}

/* ── Vessel Count HUD ──────────────────────────────────────── */

function VesselHud({
  total,
  registered,
  loading,
}: {
  total: number;
  registered: number;
  loading: boolean;
}) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 rounded-xl border border-[#1E3A5F]/60 bg-[#0B1426]/85 px-4 py-2.5 shadow-lg shadow-black/30 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <div className="relative h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#3B82F6] opacity-40" />
          <span className="absolute inset-0 rounded-full bg-[#3B82F6]" />
        </div>
        <span className="font-[system-ui] text-xs font-semibold text-white/80 tabular-nums">
          {loading ? "--" : total}
        </span>
        <span className="font-[system-ui] text-[10px] text-[#64748B] uppercase tracking-wider">
          vessels
        </span>
      </div>
      {registered > 0 && (
        <>
          <div className="h-3 w-px bg-[#1E3A5F]" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D4A853]" />
            <span className="font-[system-ui] text-xs font-semibold text-[#D4A853] tabular-nums">
              {registered}
            </span>
            <span className="font-[system-ui] text-[10px] text-[#64748B] uppercase tracking-wider">
              verified
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main Map Component ────────────────────────────────────── */

interface VesselMapProps {
  onSelectVessel: (vessel: EnrichedVessel) => void;
}

export default function VesselMap({ onSelectVessel }: VesselMapProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [vessels, setVessels] = useState<EnrichedVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingVessels, setFetchingVessels] = useState(false);
  const fetchCenter = useRef<{ lat: number; lon: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchVessels = useCallback(
    async (lat: number, lon: number) => {
      setFetchingVessels(true);
      try {
        const res = await fetch(
          `/api/nearby-vessels?lat=${lat}&lon=${lon}&radius=3`
        );
        if (!res.ok) throw new Error("Failed to fetch vessels");
        const data = await res.json();
        setVessels(data.vessels ?? []);
      } catch {
        // Silently fail on refresh — keep stale data visible
      } finally {
        setFetchingVessels(false);
      }
    },
    []
  );

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserPos(loc);
        fetchCenter.current = loc;
        await fetchVessels(loc.lat, loc.lon);
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Enable GPS access in your device settings to see nearby vessels.",
          2: "Unable to determine your position. Check your device's GPS signal.",
          3: "Location request timed out. Move to an area with better signal.",
        };
        setError(messages[err.code] ?? "Unable to get location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [fetchVessels]);

  // Initial location request
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!userPos) return;
    intervalRef.current = setInterval(() => {
      const center = fetchCenter.current ?? userPos;
      fetchVessels(center.lat, center.lon);
    }, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userPos, fetchVessels]);

  const handleMapMoveEnd = useCallback(
    (center: { lat: number; lng: number }) => {
      fetchCenter.current = { lat: center.lat, lon: center.lng };
    },
    []
  );

  // ── Render states ──
  if (loading) return <MapSkeleton />;
  if (error || !userPos) {
    return (
      <MapError
        message={error ?? "Unable to determine position."}
        onRetry={requestLocation}
      />
    );
  }

  const registeredCount = vessels.filter((v) => v.registered).length;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[userPos.lat, userPos.lon]}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        style={{ background: "#0B1426" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapEventHandler onMoveEnd={handleMapMoveEnd} />
        <RecenterButton lat={userPos.lat} lon={userPos.lon} />

        {/* User location marker */}
        <Marker
          position={[userPos.lat, userPos.lon]}
          icon={userLocationIcon()}
          interactive={false}
        />

        {/* Vessel markers */}
        {vessels.map((v, i) => (
          <Marker
            key={`${v.mmsi}-${i}`}
            position={[v.lat, v.lon]}
            icon={
              v.registered
                ? registeredIcon(v.heading)
                : unregisteredIcon(v.heading)
            }
            eventHandlers={{
              click: () => onSelectVessel(v),
            }}
          />
        ))}
      </MapContainer>

      {/* HUD overlay */}
      <VesselHud
        total={vessels.length}
        registered={registeredCount}
        loading={fetchingVessels && vessels.length === 0}
      />

      {/* Refresh indicator */}
      {fetchingVessels && vessels.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-lg border border-[#1E3A5F]/40 bg-[#0B1426]/70 px-3 py-1.5 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3B82F6]" />
          <span className="font-[system-ui] text-[10px] text-[#64748B] uppercase tracking-wider">
            Updating
          </span>
        </div>
      )}
    </div>
  );
}
