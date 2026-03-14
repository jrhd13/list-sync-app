import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdb_id, title, media_type, poster_path } = body;

    const { data, error } = await supabase
      .from('saved_items')
      .insert([{ tmdb_id, title, media_type, poster_path }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}