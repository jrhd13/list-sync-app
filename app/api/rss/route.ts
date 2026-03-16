import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get Groups from Supabase
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const shuffled = dbGroups?.sort(() => 0.5 - Math.random()) || [];
    const selectedGroups = shuffled.slice(0, 10).map(g => g.name.toUpperCase());

    const keys = {
      geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV",
      planet: "618518524733b41d3487ca5a8d7a29df"
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=2000&apikey=${keys.planet}&o=json` }
    ];

    // 2. Parallel Fetch
    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=25`, { signal: AbortSignal.timeout(8000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);

    // 3. De-duplicate and Sort
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values());
    uniqueData.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 4. Build Newznab-Compliant XML
    const rssItems = uniqueData.slice(0, 50).map(item => {
      const title = item.title || "Unknown";
      const guid = item.guid?.['#text'] || item.guid || "";
      const date = new Date(item.pubDate).toUTCString();
      
      // Extract numeric part of tt1234567 -> 1234567
      const idMatch = JSON.stringify(item).match(/tt(\d{7,9})/);
      const imdbNumeric = idMatch ? idMatch[1] : "";

      return `
        <item>
          <title><![CDATA[${title}]]></title>
          <guid isPermaLink="false">${guid}</guid>
          <link>${guid}</link>
          <pubDate>${date}</pubDate>
          <description>Elite Tier Release</description>
          <enclosure url="${guid}" length="0" type="application/x-nzb" />
          
          {/* CRITICAL FOR RADARR RSS LISTS */}
          <newznab:attr name="category" value="2000" />
          <newznab:attr name="imdb" value="${imdbNumeric}" />
        </item>`;
    }).join('');

    // 5. Wrap in RSS Envelope with Newznab Namespace
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
      <channel>
        <title>MediaFlow Elite RSS</title>
        <description>Newznab Compatible Elite Feed</description>
        <link>https://your-app.vercel.app</link>
        ${rssItems}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, {
      headers: { 
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=1800' 
      }
    });

  } catch (error) {
    return new NextResponse('<error>Feed Generation Failed</error>', { status: 500 });
  }
}