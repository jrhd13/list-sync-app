import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    const urls = [
      { 
        name: 'Geek', 
        url: `https://api.nzbgeek.info/api?t=movie&cat=2000&limit=100&apikey=${process.env.NZBGEEK_API_KEY}&o=json` 
      },
      { 
        name: 'Planet', 
        url: `https://nzbplanet.net/api?t=movie&cat=2000&limit=100&apikey=${process.env.NZBPLANET_API_KEY}&o=json` 
      }
    ];

    const responses = await Promise.all(urls.map(u => fetch(u.url).then(res => res.json()).catch(() => null)));
    const allItems = responses.flatMap(data => data?.channel?.item || []);

    // DEBUG MODE: If you add ?debug=true to the URL, see everything found
    if (debug) {
      return NextResponse.json({
        total_found: allItems.length,
        your_groups: groupList,
        sample_titles: allItems.slice(0, 10).map(i => i.title)
      });
    }

    const eliteItems = allItems.filter((item: any) => {
      const title = item.title.toUpperCase();
      // We removed the hyphen requirement to make it easier to catch groups
      return groupList.some(group => title.includes(group)) && item.imdbid;
    });

    const seenIds = new Set();
    const formattedData = [];

    for (const item of eliteItems) {
      const cleanId = item.imdbid.toString().startsWith('tt') ? item.imdbid : `tt${item.imdbid}`;
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        formattedData.push({ title: item.title, imdbId: cleanId });
      }
    }

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}