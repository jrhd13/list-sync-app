import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get Elite Groups from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    if (groupList.length === 0) {
      return NextResponse.json([{ title: "No Elite Groups Configured", imdbId: null }]);
    }

    // 2. Fetch latest Movie releases (Category 2000) from NZBGeek
    const geekUrl = `https://api.nzbgeek.info/api?t=movie&cat=2000&apikey=${process.env.NZBGEEK_API_KEY}&o=json`;
    const res = await fetch(geekUrl);
    
    if (!res.ok) throw new Error('NZBGeek connection failed');
    
    const data = await res.json();
    const items = data.channel?.item || [];

    // 3. Filter for Elite Groups + Ensure an IMDb ID exists
    const eliteItems = items.filter((item: any) => {
      const titleMatches = groupList.some(group => item.title.toUpperCase().includes(`-${group}`));
      const hasImdb = item.imdbid && item.imdbid !== "null" && item.imdbid !== "";
      return titleMatches && hasImdb;
    });

    // 4. Format for Radarr Custom List
    const formattedData = eliteItems.map(item => ({
      title: item.title,
      // NZBGeek uses 'imdbid' (lowercase). Radarr wants 'imdbId' (CamelCase)
      imdbId: item.imdbid.startsWith('tt') ? item.imdbid : `tt${item.imdbid}`
    }));

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error("Elite List Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}