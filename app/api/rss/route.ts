import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. TMDB Metadata Helper (Crucial for Radarr Identification)
async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    
    if (!movie) return { id: "" };

    const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${apiKey}`);
    const details = await detailRes.json();
    // Return only the numeric part (Radarr RSS standard)
    return { id: details.imdb_id ? details.imdb_id.replace('tt', '') : "" };
  } catch { return { id: "" }; }
}

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const selectedGroups = dbGroups?.sort(() => 0.5 - Math.random()).slice(0, 10).map(g => g.name.toUpperCase()) || [];

    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e"; 
    const keys = {
      geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
      planet: "618518524733b41d3487ca5a8d7a29df"
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=2000&apikey=${keys.planet}&o=json` }
    ];

    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=20`, { signal: AbortSignal.timeout(8000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values());
    uniqueData.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 2. Resolve IDs (Top 15 items for speed)
    let lookupCount = 0;
    const finalData = await Promise.all(uniqueData.slice(0, 40).map(async (item: any) => {
      const searchString = JSON.stringify(item);
      const idMatch = searchString.match(/tt(\d{7,9})/);
      let numericId = idMatch ? idMatch[1] : "";

      if (!numericId && lookupCount < 15) {
        lookupCount++;
        const meta = await getTmdbMetadata(item.title, TMDB_KEY);
        numericId = meta.id;
      }

      return { ...item, numericId };
    }));

    // 3. Build the XML
    const rssItems = finalData.map(item => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <guid isPermaLink="false">${item.guid?.['#text'] || item.guid || ""}</guid>
        <link>${item.guid?.['#text'] || item.guid || ""}</link>
        <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
        <enclosure url="${item.guid?.['#text'] || item.guid || ""}" length="0" type="application/x-nzb" />
        <newznab:attr name="category" value="2000" />
        <newznab:attr name="imdb" value="${item.numericId}" />
      </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
      <channel>
        <title>MediaFlow Elite RSS</title>
        <link>https://vercel.app</link>
        <description>Elite Feed</description>
        ${rssItems}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });

  } catch (error) {
    return new NextResponse('<error>Fail</error>', { status: 500 });
  }
}