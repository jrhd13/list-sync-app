import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1. Tells TypeScript what to expect from the indexer's JSON
interface RssItem {
  title?: string;
  link?: string;
  imdb?: string;   
  imdbid?: string; 
  attr?: any[];
  'newznab:attr'?: any[];
  attributes?: any[];
  [key: string]: any; 
}

// 2. Helper to dig into NZBGeek/Planet's hidden attributes array
function extractImdbId(item: RssItem): string | null {
  // Check the surface first
  if (item.imdb) return String(item.imdb);
  if (item.imdbid) return String(item.imdbid);

  // Dig into the hidden attributes array
  const attributes = item.attr || item['newznab:attr'] || item.attributes;
  
  if (Array.isArray(attributes)) {
    for (const attr of attributes) {
      // Geek format: { "@attributes": { "name": "imdb", "value": "1234567" } }
      if (attr?.['@attributes']?.name === 'imdb' && attr?.['@attributes']?.value) {
        return String(attr['@attributes'].value);
      }
      // Planet format: { "name": "imdb", "value": "1234567" }
      if (attr?.name === 'imdb' && attr?.value) {
        return String(attr.value);
      }
    }
  }
  return null;
}

// 3. The Upgraded TMDB Fetcher (with Reverse IMDb Lookup)
async function getTmdbMetadata(title: string, apiKey: string, imdbId?: string | null) {
  try {
    // SCENARIO A: We have an IMDb ID from the feed (Bulletproof Match)
    if (imdbId) {
      const formattedImdb = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      const findRes = await fetch(`https://api.themoviedb.org/3/find/${formattedImdb}?api_key=${apiKey}&external_source=imdb_id`);
      const findData = await findRes.json();
      
      const movie = findData.movie_results?.[0];
      if (movie) {
        return {
          tmdbId: movie.id,
          posterPath: movie.poster_path,
          score: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
        };
      }
    }

    // SCENARIO B: No IMDb ID found, fallback to Title Search (Safety Net)
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
    // 👇 4. PASTE YOUR ACTUAL KEYS HERE 👇
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
    const feedItemsList = await Promise.all(uniqueData.map(async (item) => {
      // TypeScript safety check
      if (!item.title) return null; 
      
      // Use our new decoder to dig out the hidden IMDb ID
      const rawImdb = extractImdbId(item);
      
      // Pass it to our upgraded fetcher
      const meta = await getTmdbMetadata(item.title, TMDB_KEY, rawImdb);
      
      return {
        title: item.title,
        link: item.link,
        tmdbId: meta?.tmdbId || null,
        posterPath: meta?.posterPath || null,
        score: meta?.score || null,
        imdbId: rawImdb // Pass this to the frontend too!
      };
    }));

    // Remove any items that failed to load properly
    const validItems = feedItemsList.filter(item => item !== null && item.tmdbId !== null);

    // Send perfectly clean data back to the Dashboard
    return NextResponse.json(validItems);
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch elite list" }, { status: 500 });
  }
}