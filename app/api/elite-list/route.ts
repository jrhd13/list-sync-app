import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 👇 1. PASTE YOUR TMDB KEY HERE 👇
    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e"; 
    
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'genre-28';
    const type = searchParams.get('type') || 'movie'; 
    const query = searchParams.get('query') || ''; // NEW: Grabs your search term!

    let url = '';
    
    // SCENARIO S: You searched for a specific title!
    if (query) {
      url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
    } 
    // SCENARIO A, B, C: Normal Category Browsing
    else {
      const baseUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&sort_by=popularity.desc`;

      if (filter.startsWith('genre-')) {
        const genreId = filter.split('-')[1];
        url = `${baseUrl}&with_genres=${genreId}&vote_count.gte=100`;
      } else if (filter.startsWith('provider-')) {
        const providerId = filter.split('-')[1];
        url = `${baseUrl}&with_watch_providers=${providerId}&watch_region=GB`;
      } else if (filter.startsWith('network-')) {
        const networkId = filter.split('-')[1];
        url = `${baseUrl}&with_networks=${networkId}`;
      }
    }

    // Fetch Pages 1 and 2
    const [res1, res2] = await Promise.all([
      fetch(`${url}&page=1`).then(res => res.json()),
      fetch(`${url}&page=2`).then(res => res.json())
    ]);

    const allResults = [...(res1.results || []), ...(res2.results || [])];

    // Format the data
    const feedItems = allResults.map((item: any) => ({
      title: item.title || item.name, 
      tmdbId: item.id,
      posterPath: item.poster_path,
      score: item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
    }));

    // Remove any accidental duplicates TMDB might send
    const uniqueItems = Array.from(new Map(feedItems.map(item => [item.tmdbId, item])).values());

    return NextResponse.json(uniqueItems);
    
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch TMDB data" }, { status: 500 });
  }
}