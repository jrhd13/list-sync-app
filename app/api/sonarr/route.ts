import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 👇 1. PASTE YOUR SONARR URL AND KEY HERE 👇
    const SONARR_URL = "https://jrhd13-sonarr.elfhosted.party";
    const SONARR_KEY = "26b77cdbe7b5447fb0b6c8a2f2a28659";

    const body = await req.json();

    // 1. Ask Sonarr to "Lookup" the TMDB ID (Skyhook translates TMDB -> TVDB automatically)
    const lookupRes = await fetch(`${SONARR_URL}/api/v3/series/lookup?term=tmdb:${body.tmdbId}`, {
      headers: { 'X-Api-Key': SONARR_KEY }
    });
    
    if (!lookupRes.ok) {
       throw new Error(`Sonarr lookup failed with status: ${lookupRes.status}`);
    }

    const lookupData = await lookupRes.json();
    const series = lookupData[0]; // Grab the top match from Sonarr

    if (!series) {
      return NextResponse.json({ error: "Series not found in Sonarr search." }, { status: 404 });
    }

    // 2. Attach your specific settings to the payload 
    // (Notice: languageProfileId is completely removed for Sonarr V4 compatibility!)
    series.qualityProfileId = body.qualityProfileId;
    series.rootFolderPath = body.rootFolderPath;
    series.monitored = true;
    series.addOptions = { searchForMissingEpisodes: true };

    // 3. Send the final command to add the show to your library
    const addRes = await fetch(`${SONARR_URL}/api/v3/series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': SONARR_KEY
      },
      body: JSON.stringify(series)
    });

    if (!addRes.ok) {
      // If Sonarr rejects it, we try to grab the exact error message it sends back
      const errorData = await addRes.json().catch(() => ({}));
      const errorMessage = errorData[0]?.errorMessage || "Failed to add to Sonarr. It might already be in your library!";
      throw new Error(errorMessage);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("Sonarr Add Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}