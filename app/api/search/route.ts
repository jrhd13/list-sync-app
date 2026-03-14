import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const endpoint = searchParams.get('endpoint');

  // 1. Determine which TMDB URL to use
  let url = "";
  if (endpoint) {
    // If we're using Discovery/Trending, use the provided endpoint
    url = decodeURIComponent(endpoint);
  } else if (query) {
    // If it's a manual search, use the multi-search URL
    url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1&region=GB`;
  } else {
    return NextResponse.json({ error: "No search criteria provided" }, { status: 400 });
  }

  // 2. Add the API Key if it's not already in the URL
  // (TMDB typically requires the Bearer token in the header, which we have below)
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("TMDB API Error:", errorData);
      return NextResponse.json({ error: "Failed to fetch from TMDB" }, { status: res.status });
    }

    const data = await res.json();
    
    // 3. Return the results array
    // Note: /discover and /search return results inside a 'results' key
    // but /trending sometimes has them directly or also in 'results'
    return NextResponse.json(data.results || data || []);
    
  } catch (err: any) {
    console.error("Server Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}