import { NextResponse } from 'next/server';

export async function GET() {
  // --- HARDCODED KEYS ---
  const url = "https://jrhd13-radarr.elfhosted.party";
  const key = "5c1b945af2e44b10ac5762f5580e1df3"; // <--- Put your key here

  try {
    const res = await fetch(`${url}/api/v3/queue?apikey=${key}`);
    
    if (!res.ok) {
        return NextResponse.json({ error: "Radarr returned an error" }, { status: res.status });
    }

    const data = await res.json();
    
    // Simplify the data for our UI
    const queue = data.records?.map((r: any) => ({
      title: r.title,
      status: r.status,
      sizeleft: (r.sizeleft / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    })) || [];

    return NextResponse.json(queue);
  } catch (err) {
    return NextResponse.json({ error: "Radarr Unreachable" }, { status: 500 });
  }
}