import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const RADARR_URL = "https://jrhd13-radarr.elfhosted.party"; 
  const RADARR_API_KEY = "5c1b945af2e44b10ac5762f5580e1df3";

  try {
    const res = await fetch(`${RADARR_URL}/api/v3/movie?apiKey=${RADARR_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) return NextResponse.json({ success: true });
    
    const errData = await res.json();
    return NextResponse.json({ error: errData[0]?.errorMessage || "Radarr Error" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to connect to Radarr" }, { status: 500 });
  }
}