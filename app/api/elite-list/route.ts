import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get Elite Groups from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    // 2. Prepare API URLs for both Planet and Geek
    // Note: NZBPlanet uses 't=search&cat=2000' for their movie RSS
    const urls = [
      {
        name: 'Geek',
        url: `https://api.nzbgeek.info/api?t=movie&cat=2000&limit=200&apikey=${process.env.NZBGEEK_API_KEY}&o=json`
      },
      {
        name: 'Planet',
        url: `https://nzbplanet.net/api?t=search&cat=2000&limit=200&apikey=${process.env.NZBPLANET_API_KEY}&o=json`
      }
    ];

    // 3. Fetch from both simultaneously
    const results = await Promise.all(
      urls.map(source => 
        fetch(source.url)
          .then(res => res.json())
          .catch(e => ({ channel: { item: [] } })) // Safe fallback if one is down
      )
    );
    
    // 4. Combine all items from both sources
    const allItems = results.flatMap(data => data.channel?.item || []);

    // 5. Filter for Elite Groups + Valid IMDb IDs
    const eliteItems = allItems.filter((item: any) => {
      const title = item.title.toUpperCase();
      const titleMatches = groupList.some(group => 
        title.includes(`-${group}`) || title.includes(` ${group}`)
      );
      
      const hasImdb = item.imdbid && item.imdbid !== "null";
      return titleMatches && hasImdb;
    });

    // 6. Format and De-duplicate (so Radarr doesn't see the same movie twice)
    const seenIds = new Set();
    const formattedData = [];

    for (const item of eliteItems) {
      const cleanId = item.imdbid.toString().startsWith('tt') ? item.imdbid : `tt${item.imdbid}`;
      
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        formattedData.push({
          title: item.title,
          imdbId: cleanId
        });
      }
    }

    return NextResponse.json(formattedData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}