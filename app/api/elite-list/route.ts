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
    
    // Dates for the "What's New" calculations (last 3 months)
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // TMDB uses different date filters for Movies vs TV
    const dateParam = type === 'movie' ? 'primary_release_date' : 'first_air_date';

    // SCENARIO A: Genre Clicked
    if (filter.startsWith('genre-')) {
      const genreId = filter.split('-')[1];
      url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100`;
    } 
    // SCENARIO B: Streaming Service Clicked (Time filters removed for UK Terrestrial platforms!)
    else if (filter.startsWith('provider-')) {
      const providerId = filter.split('-')[1];
      url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&with_watch_providers=${providerId}&watch_region=GB&sort_by=popularity.desc`;
    }

    // Fetch Page 1 and 2
    const [res1, res2] = await Promise.all([
      fetch(`${url}&page=1`).then(res => res.json()),
      fetch(`${url}&page=2`).then(res => res.json())
    ]);

    const allResults = [...(res1.results || []), ...(res2.results || [])];

    // Format the data (TMDB uses 'title' for movies, but 'name' for TV!)
    const feedItems = allResults.map((item: any) => ({
      title: item.title || item.name, 
      tmdbId: item.id,
      posterPath: item.poster_path,
      score: item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
    }));

    return NextResponse.json(feedItems);
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch TMDB data" }, { status: 500 });
  }
}