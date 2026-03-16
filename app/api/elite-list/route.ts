import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  // --- HARDCODED KEYS START ---
  const keys = {
    geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
    planet: "618518524733b41d3487ca5a8d7a29df",
    althub: "ea47819ba51fe784642118d3ad12fa65",
    scene: "b29985ef096f4e03ed11073f3f825aca"
  };

  const radarr = {
    url: "https://jrhd13-radarr.elfhosted.party",
    key: "5c1b945af2e44b10ac5762f5580e1df3"
  };
  // --- HARDCODED KEYS END ---

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    const eliteCats = "2000,2030,2035,2040,2045,2050,2060";

    const endpoints = [];
    if (keys.geek) endpoints.push({ name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=${eliteCats}&apikey=${keys.geek}&o=json` });
    if (keys.planet) endpoints.push({ name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=${eliteCats}&apikey=${keys.planet}&o=json` });
    if (keys.althub) endpoints.push({ name: 'AltHub', url: `https://althub.co.za/api?t=search&cat=${eliteCats}&apikey=${keys.althub}&o=json` });
    if (keys.scene) endpoints.push({ name: 'Scene', url: `https://scenenzbs.com/api?t=search&cat=${eliteCats}&apikey=${keys.scene}&o=json` });

    const allItems: any[] = [];

    // DEEP SEARCH LOOP: Search specifically for each group name
    for (const group of groupList) {
      for (const e of endpoints) {
        try {
          const searchUrl = `${e.url}&q=${group}&limit=100`;
          const res = await fetch(searchUrl, { next: { revalidate: 0 } });
          const data = await res.json();
          const found = data.channel?.item || [];
          allItems.push(...found);
        } catch (err) { console.error(`Failed ${e.name}`); }
      }
    }

    const services = ["AMZN", "NF", "DSNP", "ATVP", "PCOK", "HMAX", "MAXX", "DSNY"];
    // Inside app/api/elite-list/route.ts

const formattedData = allItems.map((item: any) => {
      const title = item.title?.toUpperCase() || "";
      const services = ["AMZN", "NF", "DSNP", "ATVP", "PCOK", "HMAX", "MAXX", "DSNY"];
      const serviceFound = services.find(s => title.includes(s)) || "WEB";

      let rawId = "";

      // 1. Look in the standard imdbid field
      if (item.imdbid) {
        rawId = item.imdbid.toString();
      } 
      // 2. Look inside the 'newznab:attr' tags (Crucial for SceneNZB/Planet/Geek)
      else if (item['newznab:attr']) {
        const attributes = Array.isArray(item['newznab:attr']) ? item['newznab:attr'] : [item['newznab:attr']];
        
        // Look for 'imdb' OR 'rid' OR 'imdbid'
        const found = attributes.find((a: any) => 
          a['@attributes']?.name === 'imdb' || 
          a['@attributes']?.name === 'imdbid'
        );
        
        if (found) {
          rawId = found['@attributes']?.value;
        }
      }

      // --- CLEAN THE ID ---
      let cleanId = "N/A";
      if (rawId && rawId !== "" && rawId !== "0") {
        // Remove 'tt' if it exists to clean it, then add it back correctly
        const numbersOnly = rawId.replace(/\D/g, "");
        if (numbersOnly.length > 3) {
           cleanId = `tt${numbersOnly}`;
        }
      }

      return {
        title: item.title,
        imdbId: cleanId,
        service: serviceFound,
        pubDate: item.pubDate,
        size: item.enclosure?.['@attributes']?.length || 0,
        guid: item.guid?.['#text'] || item.guid || ""
      };
    });
    // Remove duplicates by title
    const uniqueData = Array.from(new Map(formattedData.map(item => [item.title, item])).values());

    return NextResponse.json(uniqueData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}