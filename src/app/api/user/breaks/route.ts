import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userBreaks, breaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user");
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const selected = await db
      .select({ breakId: userBreaks.breakId })
      .from(userBreaks)
      .where(eq(userBreaks.userId, userId));

    return NextResponse.json({ breakIds: selected.map((r) => r.breakId) });
  } catch (err) {
    console.error("Get user breaks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user");
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { breakIds } = body as { breakIds: string[] };

    if (!Array.isArray(breakIds)) {
      return NextResponse.json({ error: "breakIds must be an array" }, { status: 400 });
    }

    if (breakIds.length > 15) {
      return NextResponse.json({ error: "Maximum 15 breaks allowed" }, { status: 400 });
    }

    // Validate break IDs exist
    const validBreaks = await db
      .select({ id: breaks.id })
      .from(breaks);
    const validIds = new Set(validBreaks.map((b) => b.id));
    const invalidIds = breakIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: `Invalid break IDs: ${invalidIds.join(", ")}` }, { status: 400 });
    }

    // Delete existing selections and insert new ones
    await db.delete(userBreaks).where(eq(userBreaks.userId, userId));

    if (breakIds.length > 0) {
      await db.insert(userBreaks).values(
        breakIds.map((breakId) => ({ userId, breakId }))
      );
    }

    return NextResponse.json({ success: true, count: breakIds.length });
  } catch (err) {
    console.error("Update user breaks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
