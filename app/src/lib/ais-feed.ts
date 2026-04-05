import { publicClient } from "./viem";
import { YACHT_REGISTRY_ADDRESS, yachtRegistryAbi } from "./contracts";
import { encodeAbiParameters, keccak256, toHex, pad } from "viem";

const DATALASTIC_BASE = "https://api.datalastic.com";

interface DatalasticVessel {
  uuid: string;
  name: string;
  mmsi: string;
  imo: string | null;
  country_iso: string;
  type: string | null;
  type_specific: string | null;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  navigation_status: string | null;
  destination: string | null;
  last_position_epoch: number;
  last_position_UTC: string;
  distance: number;
}

interface DatalasticResponse {
  data: {
    point: { lat: number; lon: number; radius: number };
    total: number;
    vessels: DatalasticVessel[];
  };
  meta: { success: boolean; duration: number };
}

export interface EnrichedVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  type: string | null;
  typeSpecific: string | null;
  destination: string | null;
  countryIso: string;
  distance: number;
  lastPositionUtc: string;
  registered: boolean;
  ownerWallet: string | null;
  registeredAt: number | null;
}

function mmsiToBytes32(mmsi: string): `0x${string}` {
  return pad(toHex(mmsi), { size: 32 }) as `0x${string}`;
}

async function checkRegistration(
  mmsi: string
): Promise<{ registered: boolean; ownerWallet: string | null; registeredAt: number | null }> {
  try {
    const result = await publicClient.readContract({
      address: YACHT_REGISTRY_ADDRESS,
      abi: yachtRegistryAbi,
      functionName: "getVessel",
      args: [mmsiToBytes32(mmsi)],
    });

    const vessel = result as {
      mmsi: `0x${string}`;
      ownerWallet: `0x${string}`;
      ownerNullifier: `0x${string}`;
      registeredAt: bigint;
      active: boolean;
    };

    if (vessel.active) {
      return {
        registered: true,
        ownerWallet: vessel.ownerWallet,
        registeredAt: Number(vessel.registeredAt),
      };
    }
  } catch {
    // Vessel not found on-chain — that's fine
  }

  return { registered: false, ownerWallet: null, registeredAt: null };
}

export async function getNearbyVessels(
  lat: number,
  lon: number,
  radiusNm: number = 10
): Promise<EnrichedVessel[]> {
  const apiKeys = [
    process.env.DATALASTIC_API_KEY,
    process.env.DATALASTIC_API_KEY_2,
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    throw new Error("DATALASTIC_API_KEY not set");
  }

  const clampedRadius = Math.min(radiusNm, 50); // API max is 50 NM

  let res: Response | null = null;
  for (const apiKey of apiKeys) {
    const url = `${DATALASTIC_BASE}/api/v0/vessel_inradius?api-key=${apiKey}&lat=${lat}&lon=${lon}&radius=${clampedRadius}`;
    res = await fetch(url, { next: { revalidate: 300 } });
    if (res.ok) break;
    // If rate-limited (402) or 429, try next key
    if (res.status !== 402 && res.status !== 429) break;
  }

  if (!res || !res.ok) {
    const text = res ? await res.text() : "No API keys available";
    throw new Error(`Datalastic API error (${res?.status}): ${text}`);
  }

  const json: DatalasticResponse = await res.json();

  if (!json.meta.success || !json.data?.vessels) {
    return [];
  }

  // Enrich with on-chain registration data (batch in parallel)
  const vessels = json.data.vessels;
  const registrations = await Promise.all(
    vessels.map((v) => checkRegistration(v.mmsi))
  );

  return vessels.map((v, i) => ({
    mmsi: v.mmsi,
    name: v.name || "Unknown Vessel",
    lat: v.lat,
    lon: v.lon,
    speed: v.speed,
    course: v.course,
    heading: v.heading,
    type: v.type,
    typeSpecific: v.type_specific,
    destination: v.destination,
    countryIso: v.country_iso,
    distance: v.distance,
    lastPositionUtc: v.last_position_UTC,
    registered: registrations[i].registered,
    ownerWallet: registrations[i].ownerWallet,
    registeredAt: registrations[i].registeredAt,
  }));
}
