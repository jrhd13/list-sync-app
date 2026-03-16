import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Get the data from your existing elite-list API
    // We use the full URL to ensure it works when Radarr calls it from the outside
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/elite-list?force=true`);
    const items = await res.json();

    if (!Array.isArray(items)) {
      return NextResponse.json([]);
    }

    // 2. Format for Radarr (StevenLu format)
    // Radarr only needs the title and the IMDb ID to add a movie
    const formattedForRadarr = items
      .filter(item => item.imdbId && item.imdbId !== "N/A")
      .map(item => ({
        title: item.title,
        imdb_id: item.imdbId
      }));

    return NextResponse.json(formattedForRadarr);
  } catch (err) {
    console.error("Radarr List Error:", err);
    return NextResponse.json([], { status: 500 });
  }
}