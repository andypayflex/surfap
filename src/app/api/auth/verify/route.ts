import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user");

  if (!userId) {
    return NextResponse.redirect(`${BASE_URL}/verify?status=error`);
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.redirect(`${BASE_URL}/verify?status=error`);
    }

    if (user[0].emailVerified) {
      return NextResponse.redirect(`${BASE_URL}/verify?status=already&user=${userId}`);
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));

    return NextResponse.redirect(`${BASE_URL}/verify?status=success&user=${userId}`);
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.redirect(`${BASE_URL}/verify?status=error`);
  }
}
