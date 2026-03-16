import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper for IMDb lookup (Same as your elite-list)
async function getImdbByTitle(movieTitle: string) {
  try {
    const cleanTitle = movieTitle.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const searchUrl = `https://v3.sg.media-imdb.com/suggestion/${cleanTitle[0].toLowerCase()}/${encodeURIComponent(cleanTitle)}.json`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    const match = data.d?.find((item: any) => item.q === "feature" || item.id.startsWith("tt"));
    return match ? match.id : "N/A";
  } catch { return "N/A"; }
}

export async function GET() {
  try {
    // 1. Get your groups from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || ["NTB"];
    
    // 2. Search your main indexer (Using Geek as the primary source for the list)
    const geekKey = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV"; 
    const res = await fetch(`https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${geekKey}&q=${groupList[0]}&limit=50&o=json`);
    const data = await res.json();
    const items = data.channel?.item || [];

    // 3. Process the list and find IDs
    const formatted = await Promise.all(items.map(async (item: any) => {
      let cleanId = "N/A";
      
      // Try to find ID in raw data first
      const searchString = JSON.stringify(item);
      const match = searchString.match(/tt(\d{7,9})/);
      if (match) cleanId = match[0];
      
      // If missing, look it up
      if (cleanId === "N/A") cleanId = await getImdbByTitle(item.title);

      return {
        title: item.title,
        imdb_id: cleanId
      };
    }));

    // 4. Filter out any that failed to find an ID
    const finalSelection = formatted.filter(i => i.imdb_id !== "N/A");

    return NextResponse.json(finalSelection);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}