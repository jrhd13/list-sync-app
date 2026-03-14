import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 1. Get items from your list that don't have an IMDb ID yet
    const { data: items, error: dbError } = await supabase
      .from('saved_items')
      .select('id, tmdb_id, media_type')
      .is('imdb_id', null);

    if (dbError) throw dbError;
    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Everything is already synced!" });
    }

    // 2. Loop through them and ask TMDB for the IMDb ID (tt...)
    for (const item of items) {
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}/external_ids`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
            accept: 'application/json',
          },
        }
      );

      const externalIds = await tmdbResponse.json();

      // 3. Update Supabase with the new ID
      if (externalIds.imdb_id) {
        await supabase
          .from('saved_items')
          .update({ imdb_id: externalIds.imdb_id })
          .eq('id', item.id);
      }
    }

    return NextResponse.json({ success: true, message: `Synced ${items.length} items` });
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}