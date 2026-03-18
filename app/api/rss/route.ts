import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1. This tells TypeScript what the NZBGeek/Planet data looks like
interface RssItem {
  title?: string;
  link?: string;
  [key: string]: unknown; // Allows for extra hidden data
}

// 2. TMDB Fetcher logic for your Dashboard posters and scores
async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    
    if (!movie) return null;

    return {
      tmdbId: movie.id,
      posterPath: movie.poster_path,
      score: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // 👇 3. PASTE YOUR ACTUAL KEYS HERE 👇
    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e";
    const GEEK_KEY = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV";
    const PLANET_KEY = "618518524733b41d3487ca5a8d7a29df";

    // All three feeds combined for maximum coverage
    const endpoints = [
      `https://api.nzbgeek.info/api?t=search&q=endorsed_movies&limit=40&apikey=${GEEK_KEY}&o=json`,
      `https://api.nzbgeek.info/api?t=search&q=geek_rated_movies&limit=40&apikey=${GEEK_KEY}&o=json`,
      `https://nzbplanet.net/api?t=movie&limit=40&apikey=${PLANET_KEY}&o=json`
    ];

    // Fetch from all sources at once
    const results = await Promise.all(
      endpoints.map(url => fetch(url).then(res => res.json()).catch(() => ({})))
    );

    // Extract the items
    const allItems: RssItem[] = results.flatMap(data => data.channel?.item || []);
    
    // De-duplicate movies so you don't see the same movie twice on your dashboard
    const uniqueMap = new Map<string, RssItem>();
    allItems.forEach(item => {
      if (item.title) uniqueMap.set(item.title, item);
    });
    const uniqueData = Array.from(uniqueMap.values()).slice(0, 40); // Limit to 40 for speed

    // Attach TMDB Posters and IDs to send to your UI
    const feedItems = await Promise.all(uniqueData.map(async (item) => {
      // TypeScript safety check
      if (!item.title) return null; 
      
      const meta = await getTmdbMetadata(item.title, TMDB_KEY);
      
      return {
        title: item.title,
        link: item.link,
        tmdbId: meta?.tmdbId || null,
        posterPath: meta?.posterPath || null,
        score: meta?.score || null,
      };
    }));

    // Remove any items that failed to load properly
    const validItems = feedItems.filter(item => item !== null && item.tmdbId !== null);

    // Send perfectly clean data back to the Dashboard
    return NextResponse.json(validItems);
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch elite list" }, { status: 500 });
  }
}