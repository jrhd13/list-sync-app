import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. Updated Interface to include tmdbId
interface NZBItem {
  title?: string;
  pubDate?: string;
  guid?: any;
  tmdbId?: number; // Added this
  [key: string]: any; 
}

async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    
    if (!movie) return { score: 0, poster: null, id: "N/A", tmdbId: 0 };

    const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${apiKey}`);
    const details = await detailRes.json();
    
    return {
      score: movie.vote_average,
      poster: movie.poster_path,
      id: details.imdb_id || "N/A",
      tmdbId: movie.id // This is the ID Radarr was missing!
    };
  } catch { 
    return { score: 0, poster: null, id: "N/A", tmdbId: 0 }; 
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year') || ""; 
  const genreParam = searchParams.get('genre') || "";

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const selectedGroups = dbGroups?.sort(() => 0.5 - Math.random()).slice(0, 6).map(g => g.name.toUpperCase()) || [];

    // --- PASTE YOUR KEYS HERE ---
    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e";
    const keys = { 
      geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV", 
      planet: "618518524733b41d3487ca5a8d7a29df",
      scene: "b29985ef096f4e03ed11073f3f825aca" 
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=movie&apikey=${keys.planet}&o=json` },
      { name: 'Scene', url: `https://scenenzbs.com/api?t=movie&apikey=${keys.scene}&o=json` }
    ];

    const searchPromises = selectedGroups.flatMap(group => {
      const query = [yearParam, genreParam, group].filter(Boolean).join('+');
      return endpoints.map(e => 
        fetch(`${e.url}&q=${query}`, { signal: AbortSignal.timeout(7000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      );
    });

    const results = await Promise.all(searchPromises);
    const allItems: NZBItem[] = results.flatMap(data => data.channel?.item || []);
    
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title || '', item])).values());
    
    uniqueData.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    let lookupCount = 0;
    const finalData = await Promise.all(uniqueData.slice(0, 25).map(async (item) => {
      let meta = { score: 0, poster: null, id: "N/A", tmdbId: 0 };
      const itemTitle = item.title || "Unknown Release";

      if (lookupCount < 12) {
        lookupCount++;
        meta = await getTmdbMetadata(itemTitle, TMDB_KEY);
      }
      
      const guidValue = item.guid?.['#text'] || item.guid || "";

      return {
        title: itemTitle,
        imdbId: meta.id !== "N/A" ? meta.id : (JSON.stringify(item).match(/tt(\d{7,9})/)?.[0] || "N/A"),
        tmdbId: meta.tmdbId, // Passing the ID to the frontend
        posterPath: meta.poster,
        score: meta.score,
        pubDate: item.pubDate || new Date().toISOString(),
        guid: guidValue
      };
    }));

    return NextResponse.json(finalData);
  } catch (error) {
    return NextResponse.json({ error: "Aggregator Error" }, { status: 500 });
  }
}