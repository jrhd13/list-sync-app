import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.RADARR_URL;
  const key = process.env.RADARR_API_KEY;

  try {
    const res = await fetch(`${url}/api/v3/queue?apikey=${key}`);
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