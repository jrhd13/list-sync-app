import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Use your REAL Vercel URL here
    // Replace 'your-app-name.vercel.app' with your actual production link
    const domain = "https://list-sync-app-w1hi-eight.vercel.app/"; 
    
    const res = await fetch(`${domain}/api/elite-list?force=true`, {
      cache: 'no-store' // This ensures it doesn't get stuck on old data
    });

    const items = await res.json();

    if (!Array.isArray(items)) {
      console.log("Elite list did not return an array");
      return NextResponse.json([]);
    }

    // 2. Format for Radarr
    // We only take items that have a valid IMDb ID
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