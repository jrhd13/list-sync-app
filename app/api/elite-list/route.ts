import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    const geekUrl = `https://api.nzbgeek.info/api?t=movie&cat=2000&apikey=${process.env.NZBGEEK_API_KEY}&o=json`;
    const res = await fetch(geekUrl);
    const data = await res.json();
    const items = data.channel?.item || [];

    const eliteItems = items.filter((item: any) => {
      const titleMatches = groupList.some(group => item.title.toUpperCase().includes(`-${group}`));
      const hasImdb = item.imdbid && item.imdbid !== "null" && item.imdbid !== "";
      return titleMatches && hasImdb;
    });

    const formattedData = eliteItems.map(item => ({
      title: item.title,
      imdbId: item.imdbid.startsWith('tt') ? item.imdbid : `tt${item.imdbid}`
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}