import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. Helper function to find IMDb ID if the indexer fails us
async function getImdbByTitle(movieTitle: string) {
  try {
    // 1. Clean the title: "Dirty.Dancing.1987.2160p..." -> "Dirty Dancing"
    const cleanTitle = movieTitle
      .split(/(\d{4})|1080p|720p|2160p|4k|UHD|WEB-DL|BluRay/i)[0]
      .replace(/\./g, ' ')
      .trim();
    
    // 2. Use the Public IMDb Suggest API (No Key Needed)
    // This returns a list of potential matches
    const searchUrl = `https://v3.sg.media-imdb.com/suggestion/${cleanTitle[0].toLowerCase()}/${encodeURIComponent(cleanTitle)}.json`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    // 3. Find the first result that is a movie ("feature")
    const match = data.d?.find((item: any) => item.q === "feature" || item.id.startsWith("tt"));
    
    return match ? match.id : "N/A";
  } catch (err) {
    console.error("IMDb Search Error:", err);
    return "N/A";
  }
}

export async function GET(request: Request) {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    const eliteCats = "2000,2030,2035,2040,2045,2050,2060";

    // Hardcoded keys for stability
    const geekKey = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV";
    const planetKey = "618518524733b41d3487ca5a8d7a29df";
    const althubKey = "ea47819ba51fe784642118d3ad12fa65";
    const sceneKey = "b29985ef096f4e03ed11073f3f825aca";

    const endpoints = [];
    if (geekKey) endpoints.push({ name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=${eliteCats}&apikey=${geekKey}&o=json` });
    if (planetKey) endpoints.push({ name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=${eliteCats}&apikey=${planetKey}&o=json` });
    if (althubKey) endpoints.push({ name: 'AltHub', url: `https://althub.co.za/api?t=search&cat=${eliteCats}&apikey=${althubKey}&o=json` });
    if (sceneKey) endpoints.push({ name: 'Scene', url: `https://scenenzbs.com/api?t=search&cat=${eliteCats}&apikey=${sceneKey}&o=json` });

    const allItems: any[] = [];

    for (const group of groupList) {
      for (const e of endpoints) {
        try {
          const searchUrl = `${e.url}&q=${group}&limit=50`;
          const res = await fetch(searchUrl, { next: { revalidate: 0 } });
          const data = await res.json();
          const found = data.channel?.item || [];
          allItems.push(...(Array.isArray(found) ? found : [found]));
        } catch (err) { console.error(`Failed ${e.name}`); }
      }
    }

    // --- SMART EXTRACTION WITH IMDB LOOKUP ---
    // We use Promise.all because getImdbByTitle is an async (network) call
    const formattedData = await Promise.all(allItems.map(async (item: any) => {
      const title = item.title || "";
      let cleanId = "N/A";

      // Step A: Check if indexer actually provided it (the easy way)
      const searchString = JSON.stringify(item);
      const match = searchString.match(/tt(\d{7,9})/);
      if (match) {
        cleanId = match[0];
      }

      // Step B: If still N/A, use our OMDb "Brain"
      if (cleanId === "N/A" || cleanId === "tt0000000") {
        cleanId = await getImdbByTitle(title);
      }

      return {
        title: item.title,
        imdbId: cleanId,
        service: ["AMZN", "NF", "DSNP", "ATVP", "PCOK", "HMAX"].find(s => title.toUpperCase().includes(s)) || "WEB",
        pubDate: item.pubDate,
        size: item.enclosure?.['@attributes']?.length || 0,
        guid: item.guid?.['#text'] || item.guid || ""
      };
    }));

    // Remove duplicates
    const uniqueData = Array.from(new Map(formattedData.map(item => [item.title, item])).values());

    return NextResponse.json(uniqueData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}