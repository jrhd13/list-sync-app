import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  // 1. Check if keys exist (This will show in debug)
  const keysFound = {
    geek: !!process.env.NZBGEEK_API_KEY,
    planet: !!process.env.NZBPLANET_API_KEY
  };

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    // Simple URLs - no extra filters that might cause 0 results
    const urls = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=movie&apikey=${process.env.NZBGEEK_API_KEY}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=caps&apikey=${process.env.NZBPLANET_API_KEY}&o=json` } 
    ];

    const responses = await Promise.all(
      urls.map(u => fetch(u.url).then(res => res.json()).catch(() => null))
    );

    // Combine items (Planet uses channel.item, Geek uses channel.item)
    const allItems = responses.flatMap(data => data?.channel?.item || []);

    if (debug) {
      return NextResponse.json({
        total_found: allItems.length,
        api_keys_detected: keysFound,
        your_groups: groupList,
        raw_first_item: allItems[0] || "No items found"
      });
    }

    const eliteItems = allItems.filter((item: any) => {
      const title = item.title?.toUpperCase() || "";
      return groupList.some(group => title.includes(group)) && item.imdbid;
    });

    const formattedData = eliteItems.map((item: any) => ({
      title: item.title,
      imdbId: item.imdbid.toString().startsWith('tt') ? item.imdbid : `tt${item.imdbid}`
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}