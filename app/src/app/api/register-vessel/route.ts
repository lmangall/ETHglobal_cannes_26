import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DATALASTIC_BASE = "https://api.datalastic.com";
// Demo: 0.5 NM (~926 m) — in production this would be ~0.01–0.05 NM (20–90 m)
const MAX_REGISTRATION_DISTANCE_NM = 0.5;
// Demo: 0.5 kn — vessel must be underway, not docked/moored
// In production this would be higher (~2–3 kn) to ensure genuinely at sea
const MIN_VESSEL_SPEED_KN = 0.5;

const DOCKED_NAV_STATUSES = ["moored", "at anchor", "aground"] as const;

/** Haversine distance in nautical miles between two GPS coordinates. */
function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 3440.065 * c; // Earth radius in NM
}

interface VesselAisData {
  lat: number;
  lon: number;
  speed: number;
  navigation_status: string | null;
}

/** Fetch vessel AIS data from Datalastic by MMSI. */
async function getVesselAisData(
  mmsi: string
): Promise<VesselAisData | null> {
  const apiKeys = [
    process.env.DATALASTIC_API_KEY,
    process.env.DATALASTIC_API_KEY_2,
  ].filter(Boolean) as string[];

  for (const apiKey of apiKeys) {
    const url = `${DATALASTIC_BASE}/api/v0/vessel?api-key=${apiKey}&mmsi=${mmsi}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 402 || res.status === 429) continue;
      return null;
    }
    const json = await res.json();
    if (json?.meta?.success && json?.data?.lat != null && json?.data?.lon != null) {
      return {
        lat: json.data.lat,
        lon: json.data.lon,
        speed: json.data.speed ?? 0,
        navigation_status: json.data.navigation_status ?? null,
      };
    }
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { mmsi, owner_wallet, user_lat, user_lon } = await req.json();

  if (!mmsi || typeof mmsi !== "string") {
    return NextResponse.json({ error: "mmsi is required" }, { status: 400 });
  }

  if (!owner_wallet || typeof owner_wallet !== "string") {
    return NextResponse.json(
      { error: "owner_wallet is required" },
      { status: 400 }
    );
  }

  if (typeof user_lat !== "number" || typeof user_lon !== "number") {
    return NextResponse.json(
      { error: "user_lat and user_lon are required for proximity verification" },
      { status: 400 }
    );
  }

  // Read nullifier_hash from httpOnly cookie set by /api/verify-proof
  const cookieStore = await cookies();
  const nullifierHash = cookieStore.get("wld_nullifier")?.value;

  if (!nullifierHash) {
    return NextResponse.json(
      { error: "Not verified — complete World ID verification first" },
      { status: 401 }
    );
  }

  // Fetch vessel AIS data for proximity + underway checks
  const vessel = await getVesselAisData(mmsi);
  if (!vessel) {
    return NextResponse.json(
      { error: "Could not verify vessel position — vessel not found in AIS data" },
      { status: 404 }
    );
  }

  // Docked check: vessel must be underway, not moored/anchored
  const navStatus = vessel.navigation_status?.toLowerCase() ?? "";
  const isDocked =
    DOCKED_NAV_STATUSES.some((s) => navStatus.includes(s)) ||
    vessel.speed < MIN_VESSEL_SPEED_KN;

  if (isDocked) {
    return NextResponse.json(
      {
        error: "Vessel appears to be docked — registration is only allowed while underway",
        speed_kn: vessel.speed,
        navigation_status: vessel.navigation_status,
      },
      { status: 403 }
    );
  }

  // Proximity check: user must be physically near the vessel to register
  const distanceNm = haversineNm(user_lat, user_lon, vessel.lat, vessel.lon);
  if (distanceNm > MAX_REGISTRATION_DISTANCE_NM) {
    return NextResponse.json(
      {
        error: "Too far from vessel — you must be onboard to register",
        distance_nm: Math.round(distanceNm * 100) / 100,
        max_distance_nm: MAX_REGISTRATION_DISTANCE_NM,
      },
      { status: 403 }
    );
  }

  const creUrl = process.env.CRE_WORKFLOW_TRIGGER_URL;
  if (!creUrl) {
    return NextResponse.json(
      { error: "CRE_WORKFLOW_TRIGGER_URL not configured" },
      { status: 500 }
    );
  }

  // Trigger CRE workflow via HTTP
  const creRes = await fetch(creUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mmsi,
      owner_nullifier: nullifierHash,
      owner_wallet,
    }),
  });

  if (!creRes.ok) {
    const error = await creRes.text();
    return NextResponse.json(
      { error: "CRE workflow trigger failed", details: error },
      { status: 502 }
    );
  }

  return NextResponse.json({ pending: true, mmsi });
}
