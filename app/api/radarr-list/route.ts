import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // We're going to hit the database directly here to be safe
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    
    // Hardcode your key for a quick test
    const geekKey = "YOUR_NZBGEEK_KEY_HERE"; 
    const eliteCats = "2000,2030,2035,2040,2045,2050,2060";

    // Just fetch from one indexer for the Radarr List to keep it fast
    const res = await fetch(`https://api.nzbgeek.info/api?t=search&cat=${eliteCats}&apikey=${geekKey}&q=${groupList[0] || 'NTB'}&limit=50&o=json`);
    const data = await res.json();
    const items = data.channel?.item || [];

    const formatted = items.map((item: any) => {
      let id = "";
      if (item['newznab:attr']) {
        const attrs = Array.isArray(item['newznab:attr']) ? item['newznab:attr'] : [item['newznab:attr']];
        const attr = attrs.find((a: any) => a['@attributes']?.name === 'imdb');
        id = attr ? attr['@attributes']?.value : "";
      }
      return { title: item.title, imdb_id: id.startsWith('tt') ? id : `tt${id}` };
    }).filter((i: any) => i.imdb_id.length > 5);

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json([]);
  }
}