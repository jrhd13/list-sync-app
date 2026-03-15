import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get your Elite Groups from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    // 2. Fetch latest Movie releases from NZBGeek (RSS Feed)
    const geekUrl = `https://api.nzbgeek.info/api?t=movie&cat=2000&apikey=${process.env.NZBGEEK_API_KEY}&o=json`;
    const res = await fetch(geekUrl);
    const data = await res.json();
    const items = data.channel?.item || [];

    // 3. Filter: Only keep releases that match your Elite Groups
    const eliteItems = items.filter((item: any) => 
      groupList.some(group => item.title.toUpperCase().includes(`-${group}`))
    );

    // 4. Return as a clean JSON list for Radarr
    const formattedData = eliteItems.map(item => ({
      title: item.title,
      imdbId: item.imdb_id || null // NZBGeek usually includes this
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}