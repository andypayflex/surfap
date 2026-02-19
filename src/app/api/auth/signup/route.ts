import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, breaks, userBreaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Simple geocoding: map cities/zips to lat/lng
const LOCATION_MAP: Record<string, { lat: number; lng: number }> = {
  // --- Southern California ---
  "san diego": { lat: 32.7157, lng: -117.1611 },
  "la jolla": { lat: 32.8328, lng: -117.2713 },
  "encinitas": { lat: 33.0369, lng: -117.2919 },
  "oceanside": { lat: 33.1959, lng: -117.3795 },
  "carlsbad": { lat: 33.1581, lng: -117.3506 },
  "huntington beach": { lat: 33.6595, lng: -117.9988 },
  "newport beach": { lat: 33.6189, lng: -117.9289 },
  "dana point": { lat: 33.4672, lng: -117.6981 },
  "san clemente": { lat: 33.4270, lng: -117.6120 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "santa monica": { lat: 34.0195, lng: -118.4912 },
  "malibu": { lat: 34.0259, lng: -118.7798 },
  "manhattan beach": { lat: 33.8847, lng: -118.4109 },
  "hermosa beach": { lat: 33.8622, lng: -118.3995 },
  "venice": { lat: 33.9850, lng: -118.4695 },
  "ventura": { lat: 34.2746, lng: -119.2290 },
  "santa barbara": { lat: 34.4208, lng: -119.6982 },
  "oxnard": { lat: 34.1975, lng: -119.1771 },
  "92101": { lat: 32.7195, lng: -117.1628 },
  "92037": { lat: 32.8473, lng: -117.2742 },
  "92024": { lat: 33.0369, lng: -117.2919 },
  "92054": { lat: 33.1959, lng: -117.3795 },
  "92648": { lat: 33.6603, lng: -117.9992 },
  "90266": { lat: 33.8847, lng: -118.4109 },
  "90401": { lat: 34.0195, lng: -118.4912 },
  "90265": { lat: 34.0259, lng: -118.7798 },
  "93001": { lat: 34.2746, lng: -119.2290 },
  // --- South Africa ---
  "muizenberg": { lat: -34.1088, lng: 18.4735 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  "kalk bay": { lat: -34.1283, lng: 18.4483 },
  "kommetjie": { lat: -34.1365, lng: 18.3198 },
  "hout bay": { lat: -34.0446, lng: 18.3539 },
  "camps bay": { lat: -33.9510, lng: 18.3776 },
  "llandudno": { lat: -34.0080, lng: 18.3420 },
  "blouberg": { lat: -33.7980, lng: 18.4570 },
  "noordhoek": { lat: -34.1050, lng: 18.3660 },
  "scarborough": { lat: -34.1970, lng: 18.3720 },
  "melkbosstrand": { lat: -33.7180, lng: 18.4470 },
  "jeffreys bay": { lat: -33.9580, lng: 25.9340 },
  "j-bay": { lat: -33.9580, lng: 25.9340 },
  "durban": { lat: -29.8587, lng: 31.0218 },
  "ballito": { lat: -29.5360, lng: 31.2180 },
  "elands bay": { lat: -32.3100, lng: 18.3250 },
  "cape st francis": { lat: -34.2070, lng: 24.8360 },
  "st james": { lat: -34.1178, lng: 18.4590 },
  "fish hoek": { lat: -34.1358, lng: 18.4298 },
  "simons town": { lat: -34.1916, lng: 18.4324 },
  "strand": { lat: -34.1072, lng: 18.8285 },
  "gordons bay": { lat: -34.1608, lng: 18.8667 },
  "7945": { lat: -34.1088, lng: 18.4735 }, // Muizenberg postal code
  "7975": { lat: -34.1365, lng: 18.3198 }, // Kommetjie
  "8005": { lat: -33.9249, lng: 18.4241 }, // Cape Town CBD
};

function geocodeLocation(location: string): { lat: number; lng: number } {
  const normalized = location.trim().toLowerCase();
  if (LOCATION_MAP[normalized]) return LOCATION_MAP[normalized];

  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }

  return { lat: 32.7157, lng: -117.1611 };
}

// Haversine distance in miles
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, location } = body;

    if (!email || !location) {
      return NextResponse.json({ error: "Email and location are required." }, { status: 400 });
    }

    // Check for existing user — let them back into their dashboard
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Welcome back!",
        userId: existing[0].id,
      });
    }

    const coords = geocodeLocation(location);
    const userId = nanoid();
    const unsubscribeToken = nanoid(32);

    // Auto-verify the user so they get emails immediately
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase().trim(),
      locationLat: coords.lat,
      locationLng: coords.lng,
      emailVerified: true,
      unsubscribeToken,
      createdAt: new Date().toISOString(),
    });

    // Auto-select the nearest 10 breaks
    const allBreaks = await db.select().from(breaks);
    const nearest = allBreaks
      .map((b) => ({
        id: b.id,
        distance: distanceMiles(coords.lat, coords.lng, b.latitude, b.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    if (nearest.length > 0) {
      await db.insert(userBreaks).values(
        nearest.map((b) => ({ userId, breakId: b.id }))
      );
    }

    return NextResponse.json({
      message: "Account created!",
      userId,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
