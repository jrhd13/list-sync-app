import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 👇 1. PASTE YOUR TMDB KEY HERE 👇
    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e"; 
    
    // Get category AND media type from the URL
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'genre-28';
    const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'

    let url = '';
    const baseUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&sort_by=popularity.desc`;

    // SCENARIO A: Genre Clicked
    if (filter.startsWith('genre-')) {
      const genreId = filter.split('-')[1];
      url = `${baseUrl}&with_genres=${genreId}&vote_count.gte=100`;
    } 
    // SCENARIO B: Streaming Service Clicked (Netflix, Prime, iPlayer, NOW)
    else if (filter.startsWith('provider-')) {
      const providerId = filter.split('-')[1];
      // watch_region=GB ensures we see what's actually on UK Netflix/Prime
      url = `${baseUrl}&with_watch_providers=${providerId}&watch_region=GB`;
    }
    // SCENARIO C: The UK Network Bypass (ITVX, U&Dave, Channel 4)
    else if (filter.startsWith('network-')) {
      const networkId = filter.split('-')[1];
      url = `${baseUrl}&with_networks=${networkId}`;
    }

    // Fetch Page 1 and 2 simultaneously (TMDB limits to 20 per page, this gets us 40)
    const [res1, res2] = await Promise.all([
      fetch(`${url}&page=1`).then(res => res.json()),
      fetch(`${url}&page=2`).then(res => res.json())
    ]);

    const allResults = [...(res1.results || []), ...(res2.results || [])];

    // Format the data perfectly for your frontend 
    // (TMDB uses 'title' for movies, but 'name' for TV!)
    const feedItems = allResults.map((item: any) => ({
      title: item.title || item.name, 
      tmdbId: item.id,
      posterPath: item.poster_path,
      score: item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
    }));

    return NextResponse.json(feedItems);
    
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch TMDB data" }, { status: 500 });
  }
}