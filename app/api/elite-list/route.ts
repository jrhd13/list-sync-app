import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper for quick IMDb lookup (Public API)
async function getImdbId(title: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/${clean[0].toLowerCase()}/${encodeURIComponent(clean)}.json`);
    const data = await res.json();
    return data.d?.[0]?.id || "N/A";
  } catch { return "N/A"; }
}

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const shuffled = dbGroups?.sort(() => 0.5 - Math.random()) || [];
    const selectedGroups = shuffled.slice(0, 5).map(g => g.name.toUpperCase());

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

    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=20`, { signal: AbortSignal.timeout(6000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);

    // Initial formatting + Regex ID check
    let formattedData = allItems.map((item: any) => {
      const title = item.title || "";
      const searchString = JSON.stringify(item);
      const idMatch = searchString.match(/tt(\d{7,9})/);
      
      return {
        title: title,
        imdbId: idMatch ? idMatch[0] : "N/A",
        pubDate: item.pubDate,
        guid: item.guid?.['#text'] || item.guid || ""
      };
    });

    // Remove duplicates
    formattedData = Array.from(new Map(formattedData.map(item => [item.title, item])).values());
    formattedData.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // --- THE SAFETY VALVE ---
    // Only lookup IDs for the top 10 items if they are still N/A
    // This prevents the 504 timeout while fixing the "N/A" issue
    let lookupCount = 0;
    const finalData = await Promise.all(formattedData.map(async (item) => {
      if (item.imdbId === "N/A" && lookupCount < 10) {
        lookupCount++;
        const foundId = await getImdbId(item.title);
        return { ...item, imdbId: foundId };
      }
      return item;
    }));

    return NextResponse.json(finalData);

  } catch (error: any) {
    return NextResponse.json({ error: "API Error" }, { status: 500 });
  }
}