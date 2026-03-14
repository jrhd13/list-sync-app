import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let query = supabase
      .from('saved_items')
      .select('*') // Get everything
      .not('imdb_id', 'is', null);

    if (type === 'movie') {
      query = query.eq('media_type', 'movie');
    } else if (type === 'tv') {
      query = query.eq('media_type', 'tv');
    }

    const { data, error } = await query;
    if (error) throw error;

    // This format is the "Golden Standard" for Radarr Custom Lists
    const formattedData = data.map(item => ({
      title: item.title,
      imdbId: item.imdb_id,
      imdb_id: item.imdb_id,
      tmdbId: item.tmdb_id,
      itemType: item.media_type === 'movie' ? 'movie' : 'show'
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}