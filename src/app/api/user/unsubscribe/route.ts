import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/unsubscribe?status=error`);
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.unsubscribeToken, token))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.redirect(`${BASE_URL}/unsubscribe?status=error`);
    }

    await db
      .update(users)
      .set({ emailVerified: false })
      .where(eq(users.unsubscribeToken, token));

    return NextResponse.redirect(`${BASE_URL}/unsubscribe?status=success`);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(`${BASE_URL}/unsubscribe?status=error`);
  }
}
