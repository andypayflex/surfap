import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface UnsplashPhoto {
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
  links: { html: string };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const { id } = await params;

    const result = await db
      .select({ name: breaks.name, region: breaks.region })
      .from(breaks)
      .where(eq(breaks.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 });
    }

    const { name, region } = result[0];

    // Try break-specific search first, fall back to region
    let photos = await searchUnsplash(`${name} surf`, accessKey);
    if (photos.length === 0) {
      photos = await searchUnsplash(`surf ${region}`, accessKey);
    }

    const mapped = photos.slice(0, 4).map((p) => ({
      url: p.urls.regular,
      smallUrl: p.urls.small,
      photographer: p.user.name,
      photographerUrl: p.user.links.html,
      unsplashUrl: p.links.html,
    }));

    return NextResponse.json({ photos: mapped });
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    return NextResponse.json({ photos: [] });
  }
}

async function searchUnsplash(query: string, accessKey: string): Promise<UnsplashPhoto[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "4");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}
