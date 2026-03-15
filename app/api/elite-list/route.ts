import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend Vercel timeout to 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  const getEnv = (name: string) => process.env[name] || process.env[`NEXT_PUBLIC_${name}`];
  
  // Use Hardcoded keys if the Env Vars are failing
  const keys = {
    geek: getEnv('NZBGEEK_API_KEY') || "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
    planet: getEnv('NZBPLANET_API_KEY') || "618518524733b41d3487ca5a8d7a29df",
    althub: getEnv('ALTHUB_API_KEY'),
    scene: getEnv('SCENENZB_API_KEY'),
    carnage: getEnv('DIGITALCARNAGE_API_KEY')
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
    if (keys.carnage) endpoints.push({ name: 'Carnage', url: `https://digitalcarnage.cc/api?t=search&cat=${eliteCats}&limit=100&apikey=${keys.carnage}&o=json` });

    const allItems: any[] = [];
    const status: any[] = [];

    // Fetch one by one to avoid timing out and see where it fails
    for (const e of endpoints) {
      try {
        const res = await fetch(e.url, { next: { revalidate: 0 } });
        const data = await res.json();
        const found = data.channel?.item || [];
        allItems.push(...found);
        status.push({ name: e.name, count: found.length, success: true });
      } catch (err) {
        status.push({ name: e.name, count: 0, success: false });
      }
    }

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