import { NextRequest, NextResponse } from "next/server";
import { getNearbyVessels } from "@/lib/ais-feed";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "10");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: "lat and lon query parameters are required" },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: "lat must be [-90,90] and lon must be [-180,180]" },
      { status: 400 }
    );
  }

  if (isNaN(radius) || radius <= 0 || radius > 50) {
    return NextResponse.json(
      { error: "radius must be between 0 and 50 NM" },
      { status: 400 }
    );
  }

  try {
    const vessels = await getNearbyVessels(lat, lon, radius);
    return NextResponse.json({ vessels, total: vessels.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
