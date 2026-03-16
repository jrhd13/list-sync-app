import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch your group names from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    
    // 2. Optimization: Pick 5 random groups to search per request
    // This prevents the script from timing out by trying to search 25+ groups at once
    const shuffled = dbGroups?.sort(() => 0.5 - Math.random()) || [];
    const selectedGroups = shuffled.slice(0, 5).map(g => g.name.toUpperCase());

    // 3. HARDCODED KEYS (Replace the placeholder text with your actual keys)
    const keys = {
      geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
      planet: "618518524733b41d3487ca5a8d7a29df",
      althub: "ea47819ba51fe784642118d3ad12fa65",
      scene: "b29985ef096f4e03ed11073f3f825aca"
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=2000&apikey=${keys.planet}&o=json` },
      { name: 'AltHub', url: `https://althub.co.za/api?t=search&cat=2000&apikey=${keys.althub}&o=json` },
      { name: 'Scene', url: `https://scenenzbs.com/api?t=search&cat=2000&apikey=${keys.scene}&o=json` }
    ];

    // 4. PARALLEL FETCHING
    // We create a massive list of fetch requests and run them all at once
    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=25`, { signal: AbortSignal.timeout(7000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } })) // If one fails, return empty so it doesn't break the whole app
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);

    // 5. SMART DATA FORMATTING
    const formattedData = allItems.map((item: any) => {
      const title = item.title || "Unknown Title";
      const searchString = JSON.stringify(item);
      
      // Look for IMDb ID (tt followed by 7-9 digits)
      const idMatch = searchString.match(/tt(\d{7,9})/);
      let cleanId = idMatch ? idMatch[0] : "N/A";

      // Service tagging
      const services = ["AMZN", "NF", "DSNP", "ATVP", "PCOK", "HMAX", "MAXX"];
      const serviceFound = services.find(s => title.toUpperCase().includes(s)) || "WEB";

      return {
        title: title,
        imdbId: cleanId,
        service: serviceFound,
        pubDate: item.pubDate,
        size: item.enclosure?.['@attributes']?.length || 0,
        guid: item.guid?.['#text'] || item.guid || ""
      };
    });

    // 6. Remove duplicates based on title
    const uniqueData = Array.from(new Map(formattedData.map(item => [item.title, item])).values());

    // Sort by most recent first
    const sortedData = uniqueData.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    return NextResponse.json(sortedData);

  } catch (error: any) {
    console.error("Critical API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch list", details: error.message }, { status: 500 });
  }
}