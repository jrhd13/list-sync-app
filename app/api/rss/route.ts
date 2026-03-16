import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const selectedGroups = dbGroups?.map(g => g.name.toUpperCase()).slice(0, 10) || [];

    const keys = {
      geek: "YOUR_GEEK_KEY",
      planet: "YOUR_PLANET_KEY"
    };

    const endpoints = [
      { name: 'Geek', url: `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json` },
      { name: 'Planet', url: `https://nzbplanet.net/api?t=search&cat=2000&apikey=${keys.planet}&o=json` }
    ];

    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(e => 
        fetch(`${e.url}&q=${group}&limit=25`, { signal: AbortSignal.timeout(8000) })
          .then(res => res.json())
          .catch(() => ({ channel: { item: [] } }))
      )
    );

    const allResults = await Promise.all(searchPromises);
    const allItems = allResults.flatMap(data => data.channel?.item || []);

    // Unique items and Sort
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values());
    uniqueData.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Generate RSS XML
    const rssItems = uniqueData.slice(0, 50).map(item => {
      const title = item.title || "Unknown";
      const guid = item.guid?.['#text'] || item.guid || "";
      const date = new Date(item.pubDate).toUTCString();
      
      // Extract IMDb ID from raw string for the <imdbid> tag
      const idMatch = JSON.stringify(item).match(/tt(\d{7,9})/);
      const imdbTag = idMatch ? `<imdbid>${idMatch[1]}</imdbid>` : '';

      return `
        <item>
          <title><![CDATA[${title}]]></title>
          <guid isPermaLink="false">${guid}</guid>
          <link>${guid}</link>
          <pubDate>${date}</pubDate>
          <description>Elite Release</description>
          ${imdbTag}
          <enclosure url="${guid}" length="0" type="application/x-nzb" />
        </item>`;
    }).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>MediaFlow Elite RSS</title>
        <description>High-Quality Elite Group Feed</description>
        ${rssItems}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, {
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error) {
    return new NextResponse('<error>Failed to generate feed</error>', { status: 500 });
  }
}