import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';
  const force = searchParams.get('force') === 'true'; // New force flag

  // If force is true, we add a random string to the fetch to bypass caches
  const cacheBuster = force ? `&cb=${Date.now()}` : '';
  
  const getEnv = (name: string) => process.env[name] || process.env[`NEXT_PUBLIC_${name}`];
  
  const keys = {
    geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
    planet: "618518524733b41d3487ca5a8d7a29df",
    althub: "ea47819ba51fe784642118d3ad12fa65",
    scene: "b29985ef096f4e03ed11073f3f825aca",
    carnage: "4e9d540c1b2d8a543d64f9682cd490e5"
  };

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    const eliteCats = "2000,2030,2035,2050,2060";

    const endpoints = [];
    if (keys.geek) endpoints.push({ name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=${eliteCats}&limit=100&apikey=${keys.geek}&o=json` });
    if (keys.planet) endpoints.push({ name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=${eliteCats}&limit=100&apikey=${keys.planet}&o=json` });
    if (keys.althub) endpoints.push({ name: 'AltHub', url: `https://althub.co.za/api?t=search&cat=${eliteCats}&limit=100&apikey=${keys.althub}&o=json` });
    if (keys.scene) endpoints.push({ name: 'Scene', url: `https://scenenzbs.com/api?t=search&cat=${eliteCats}&limit=100&apikey=${keys.scene}&o=json` });
    if (keys.carnage) endpoints.push({ name: 'Carnage', url: `https://digitalcarnage.cc/api?t=movie&cat=${eliteCats}&limit=100&apikey=${keys.carnage}&o=json` });

    const allItems: any[] = [];
    const status: any[] = [];
    const groupQuery = groupList.join(',');

    // --- START OF NEW LOOP ---
    for (const e of endpoints) {
      try {
        // Try targeted group search
        const searchUrl = `${e.url}&q=${groupQuery}`;
        let res = await fetch(searchUrl, { next: { revalidate: 0 } });
        let data = await res.json();
        let found = data.channel?.item || [];

        // Fallback to general browse if specific search is empty
        if (found.length === 0) {
          res = await fetch(e.url, { next: { revalidate: 0 } });
          data = await res.json();
          found = data.channel?.item || [];
        }

        allItems.push(...found);
        status.push({ name: e.name, count: found.length, success: true });
      } catch (err) {
        status.push({ name: e.name, count: 0, success: false });
      }
    }
    // --- END OF NEW LOOP ---

    if (debug) {
      return NextResponse.json({
        indexer_status: status,
        total_scanned: allItems.length,
        groups_searching_for: groupList,
        sample: allItems.slice(0, 3).map(i => i.title)
      });
    }

    const eliteItems = allItems.filter((item: any) => {
      const title = item.title?.toUpperCase() || "";
      const matchesGroup = groupList.some(group => title.includes(group));
      return matchesGroup && item.imdbid && item.imdbid !== "null";
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