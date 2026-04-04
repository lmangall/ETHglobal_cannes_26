# Who's Around Map — Feature 4 Demo Guide

The map is the main screen of the Mini App. It shows real-time AIS vessel positions from the Datalastic API, cross-referenced with the YachtRegistry smart contract on World Chain to highlight verified vessels.

---

## Architecture

```
User (World App webview)
  │
  ├── 1. navigator.geolocation        ← Device GPS (Web2)
  │
  ▼
Next.js API (/api/nearby-vessels)
  │
  ├── 2. Datalastic API                ← Web2: AIS vessel tracking
  │     GET /api/v0/vessel_inradius
  │     (lat, lon, radius in NM)
  │
  ├── 3. YachtRegistry.getVessel()     ← Web3: on-chain read (free, no gas)
  │     For each vessel MMSI, check
  │     if registered on-chain
  │     Contract: 0xdEd...EC9
  │
  ▼
Enriched vessel data
  → registered: true/false
  → ownerWallet, registeredAt (if registered)
  │
  ▼
VesselMap.tsx (Leaflet dark tiles)
  → Gold+blue markers = registered vessels
  → Grey markers = AIS-only (unregistered)
  → Tap → VesselSheet.tsx (bottom sheet)
```

### Web2 vs Web3

| Layer | What | Cost |
|-------|------|------|
| **Web2** | Datalastic API — real AIS positions, vessel names, speeds | 1 credit/vessel found (20K/month on Starter) |
| **Web2** | Browser geolocation — user's GPS position | Free |
| **Web3** | `readContract` on YachtRegistry — checks MMSI registration | Free (view call, no gas) |

---

## Run Locally

```bash
cd app && npm run dev
```

Open http://localhost:3000/miniapp — allow GPS when prompted.

### Test the API directly

```bash
# Monaco harbor — yachts & pleasure craft (small radius)
curl "http://localhost:3000/api/nearby-vessels?lat=43.7384&lon=7.4246&radius=1" | jq .

# Port of Rotterdam — busy shipping traffic
curl "http://localhost:3000/api/nearby-vessels?lat=51.8951&lon=4.3973&radius=2" | jq .

# Antibes — yacht marina
curl "http://localhost:3000/api/nearby-vessels?lat=43.5804&lon=7.1251&radius=1" | jq .
```

### What to expect

1. Map loads with radar-sweep animation while GPS resolves
2. Dark CartoDB tiles render (maritime chart room aesthetic)
3. Pulsing blue dot = your position
4. Vessel markers appear within 3 NM radius
5. HUD top-left shows: vessel count + verified count
6. Tap a vessel → bottom sheet slides up with details
7. Registered vessels show gold "Verified on YachtRegistry" badge
8. Auto-refreshes every 60 seconds

### Test the bottom sheet

- Tap registered vessel → gold badge, owner wallet, registration date
- Tap unregistered vessel → grey "Not Registered" label, AIS data only
- Swipe down to dismiss, or tap backdrop

### Test error states

- Deny GPS permission → "Signal Lost" screen with retry button
- Remove `DATALASTIC_API_KEY` from `.env.local` → API error handling

---

## Environment

Requires in `app/.env.local`:

```
DATALASTIC_API_KEY=<your-key>
```

---

## Key Files

```
app/src/
├── lib/ais-feed.ts                          ← Datalastic API + on-chain enrichment
├── app/api/nearby-vessels/route.ts          ← GET API route (lat, lon, radius)
└── app/miniapp/
    ├── page.tsx                             ← Main view (map + sheet)
    └── components/
        ├── VesselMap.tsx                    ← Leaflet map, GPS, vessel markers
        └── VesselSheet.tsx                  ← Bottom sheet detail panel
```

---

## Defaults

| Setting | Value |
|---------|-------|
| API radius | 3 NM |
| Map zoom | 15 (marina-level) |
| Auto-refresh | 60 seconds |
| Max API radius | 50 NM (Datalastic limit) |
