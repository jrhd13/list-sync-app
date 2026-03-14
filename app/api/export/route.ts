import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let query = supabase.from('saved_items').select('*').not('imdb_id', 'is', null);
    
    if (type === 'movie') query = query.eq('media_type', 'movie');
    else if (type === 'tv') query = query.eq('media_type', 'tv');

    const { data, error } = await query;
    if (error) throw error;

    // IF MOVIE: Send RSS (Radarr's favorite)
    if (type === 'movie') {
      const rssItems = (data || []).map(item => `
        <item>
          <title><![CDATA[${item.title}]]></title>
          <link>https://www.imdb.com/title/${item.imdb_id}/</link>
          <guid isPermaLink="false">${item.imdb_id}</guid>
          <pubDate>${new Date().toUTCString()}</pubDate>
        </item>`).join('');

      const rssFeed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Movies</title>${rssItems}</channel></rss>`;
      return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });
    }

    // IF TV: Send JSON (Sonarr's favorite for Import Lists)
    const sonarrData = (data || []).map(item => ({
      title: item.title,
      tvdbId: item.tmdb_id, // Sonarr often uses TVDB/TMDB IDs for matching
      imdbId: item.imdb_id
    }));

    return NextResponse.json(sonarrData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}