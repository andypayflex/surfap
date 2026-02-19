import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breaks, conditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region");

  try {
    let query = db
      .select({
        id: breaks.id,
        name: breaks.name,
        region: breaks.region,
        latitude: breaks.latitude,
        longitude: breaks.longitude,
        breakType: breaks.breakType,
        qualityScore: conditions.qualityScore,
        qualityLabel: conditions.qualityLabel,
      })
      .from(breaks)
      .leftJoin(conditions, eq(breaks.id, conditions.breakId));

    if (region) {
      query = query.where(eq(breaks.region, region)) as typeof query;
    }

    const results = await query;

    return NextResponse.json({ breaks: results });
  } catch (err) {
    console.error("Breaks fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
