import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // This looks for ?type=movie or ?type=tv

  try {
    let query = supabase
      .from('saved_items')
      .select('imdb_id, title, media_type')
      .not('imdb_id', 'is', null);

    // Filter based on what the server (Radarr/Sonarr) asks for
    if (type === 'movie') {
      query = query.eq('media_type', 'movie');
    } else if (type === 'tv') {
      query = query.eq('media_type', 'tv');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}