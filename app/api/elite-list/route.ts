import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper to get Poster and ID from TMDB
async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    
    if (!movie) return { poster: null, id: "N/A" };

    // If we already have the poster, we can skip the extra ID fetch if needed, 
    // but usually, it's safer to get the external ID for Radarr.
    const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${apiKey}`);
    const details = await detailRes.json();

    return {
      poster: movie.poster_path,
      id: details.imdb_id || "N/A"
    };
  } catch { return { poster: null, id: "N/A" }; }
}

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const shuffled = dbGroups?.sort(() => 0.5 - Math.random()) || [];
    const selectedGroups = shuffled.slice(0, 10).map(g => g.name.toUpperCase());

    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e"; // <--- DOUBLE CHECK THIS KEY
    const keys = {
      geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
      planet: "618518524733b41d3487ca5a8d7a29df"
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=2000&apikey=${keys.planet}&o=json` }
    ];

    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=30`, { signal: AbortSignal.timeout(7000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);

    // Unique by title
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values());
    uniqueData.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // SAFETY VALVE: Populate posters and missing IDs
    let lookupCount = 0;
    const finalData = await Promise.all(uniqueData.slice(0, 40).map(async (item: any) => {
      const searchString = JSON.stringify(item);
      const idMatch = searchString.match(/tt(\d{7,9})/);
      let cleanId = idMatch ? idMatch[0] : "N/A";
      let posterPath = null;

      // Even if we have an ID, we still need TMDB to get the posterPath for the dashboard
      if (lookupCount < 15) {
        lookupCount++;
        const meta = await getTmdbMetadata(item.title, TMDB_KEY);
        if (cleanId === "N/A") cleanId = meta.id; // Only overwrite if missing
        posterPath = meta.poster;
      }

      return {
        title: item.title,
        imdbId: cleanId,
        posterPath: posterPath,
        pubDate: item.pubDate,
        guid: item.guid?.['#text'] || item.guid || ""
      };
    }));

    return NextResponse.json(finalData);
  } catch (error: any) {
    return NextResponse.json({ error: "Sync Fail" }, { status: 500 });
  }
}