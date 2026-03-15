import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === 'true';

  const getEnv = (name: string) => process.env[name] || process.env[`NEXT_PUBLIC_${name}`];
  const keys = {
    geek: getEnv('NZBGEEK_API_KEY'),
    planet: getEnv('NZBPLANET_API_KEY'),
    althub: getEnv('ALTHUB_API_KEY'),
    scene: getEnv('SCENENZB_API_KEY'),
    carnage: getEnv('DIGITALCARNAGE_API_KEY')
  };

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    const eliteCats = "2000,2010,2030,2035,2050,2060"; // HD only, no 4K

    const endpoints = [];
    if (keys.geek) endpoints.push({ name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=${eliteCats}&limit=200&apikey=${keys.geek}&o=json` });
    if (keys.planet) endpoints.push({ name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=${eliteCats}&limit=200&apikey=${keys.planet}&o=json` });
    if (keys.althub) endpoints.push({ name: 'AltHub', url: `https://althub.co.za/api?t=search&cat=${eliteCats}&limit=200&apikey=${keys.althub}&o=json` });
    if (keys.scene) endpoints.push({ name: 'Scene', url: `https://scenenzbs.com/api?t=search&cat=${eliteCats}&limit=200&apikey=${keys.scene}&o=json` });
    if (keys.carnage) endpoints.push({ name: 'Carnage', url: `https://digitalcarnage.cc/api?t=search&cat=${eliteCats}&limit=200&apikey=${keys.carnage}&o=json` });

    const responses = await Promise.all(
      endpoints.map(e => fetch(e.url).then(res => res.json()).catch(() => null))
    );

    const allItems = responses.flatMap(data => data?.channel?.item || []);

    if (debug) {
      // Create a sample of titles and identify their qualities to see what we are scanning
      const sampleWithQualities = allItems.slice(0, 20).map((item: any) => {
        const title = item.title.toUpperCase();
        let quality = "Unknown";
        if (title.includes("2160P") || title.includes("4K") || title.includes("UHD")) quality = "4K (Should be filtered out)";
        else if (title.includes("1080P")) quality = "1080p";
        else if (title.includes("720P")) quality = "720p";
        
        return {
          title: item.title,
          quality: quality,
          has_imdb: !!item.imdbid,
          matches_group: groupList.some(group => title.includes(group))
        };
      });

      return NextResponse.json({
        total_scanned: allItems.length,
        groups_searching_for: groupList,
        scan_sample: sampleWithQualities
      });
    }

    const eliteItems = allItems.filter((item: any) => {
      const title = item.title?.toUpperCase() || "";
      const matches = groupList.some(group => title.includes(group));
      return matches && item.imdbid && item.imdbid !== "null";
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