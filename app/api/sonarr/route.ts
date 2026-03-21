import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 👇 PASTE YOUR SONARR URL AND KEY HERE 👇
    const SONARR_URL = "https://jrhd13-sonarr.elfhosted.party";
    const SONARR_KEY = "26b77cdbe7b5447fb0b6c8a2f2a28659";

    const body = await req.json();

    // 1. Ask Sonarr to "Lookup" the TMDB ID so it can gather the TVDB ID and proper formatting
    const lookupRes = await fetch(`${SONARR_URL}/api/v3/series/lookup?term=tvdb:${body.tmdbId}`, {
      headers: { 'X-Api-Key': SONARR_KEY }
    });
    const lookupData = await lookupRes.json();
    const series = lookupData[0]; // Grab the perfect match from Sonarr

    if (!series) {
      return NextResponse.json({ error: "Series not found in Sonarr search" }, { status: 404 });
    }

    // 2. Attach your specific settings to the payload
    series.qualityProfileId = body.qualityProfileId;
    series.languageProfileId = 1; // 1 is usually English/Standard
    series.rootFolderPath = body.rootFolderPath;
    series.monitored = true;
    series.addOptions = { searchForMissingEpisodes: true };

    // 3. Send the final command to add the show
    const addRes = await fetch(`${SONARR_URL}/api/v3/series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': SONARR_KEY
      },
      body: JSON.stringify(series)
    });

    if (!addRes.ok) throw new Error("Failed to add to Sonarr");
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}