import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  // This helper function looks for the key with or without the NEXT_PUBLIC prefix
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

    const endpoints = [];
    if (keys.geek) endpoints.push({ name: 'Geek', url: `https://api.nzbgeek.info/api?t=movie&cat=2000&limit=50&apikey=${keys.geek}&o=json` });
    if (keys.planet) endpoints.push({ name: 'Planet', url: `https://nzbplanet.net/api?t=movie&cat=2000&limit=50&apikey=${keys.planet}&o=json` });
    if (keys.althub) endpoints.push({ name: 'AltHub', url: `https://althub.co.za/api?t=movie&cat=2000&limit=50&apikey=${keys.althub}&o=json` });
    if (keys.scene) endpoints.push({ name: 'Scene', url: `https://scenenzbs.com/api?t=movie&cat=2000&limit=50&apikey=${keys.scene}&o=json` });
    if (keys.carnage) endpoints.push({ name: 'Carnage', url: `https://digitalcarnage.cc/api?t=movie&cat=2000&limit=50&apikey=${keys.carnage}&o=json` });

    if (endpoints.length === 0 && debug) {
      return NextResponse.json({ 
        error: "Still no keys found", 
        all_detected_vars: Object.keys(process.env).filter(k => k.includes('API_KEY')) 
      });
    }

    const responses = await Promise.all(
      endpoints.map(e => fetch(e.url).then(res => res.json()).catch(() => null))
    );

    const allItems = responses.flatMap(data => data?.channel?.item || []);

    if (debug) {
      return NextResponse.json({
        active_indexers: endpoints.map(e => e.name),
        total_items: allItems.length,
        groups: groupList,
        keys_found_status: {
          geek: !!keys.geek,
          planet: !!keys.planet,
          althub: !!keys.althub,
          scene: !!keys.scene,
          carnage: !!keys.carnage
        }
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