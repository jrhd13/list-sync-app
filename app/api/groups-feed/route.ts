import { NextResponse } from 'next/server';

const TARGET_GROUPS = ['-NTb', '-FLUX', '-DON', '-EPSiLON', '-HiFi'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  
  // NZBPlanet/Geek use 't=movie' or 't=tvsearch' for API calls
  const category = type === 'movie' ? '2000' : '5000'; 
  
  const geekUrl = `https://api.nzbgeek.info/api?t=search&cat=${category}&apikey=${process.env.NZBGEEK_API_KEY}&o=json`;

  try {
    const res = await fetch(geekUrl);
    const data = await res.json();
    
    // Filter results to ONLY include your target groups
    const filteredItems = data.channel.item.filter((item: any) => 
      TARGET_GROUPS.some(group => item.title.toUpperCase().includes(group.toUpperCase()))
    );

    // Build RSS XML
    const rssItems = filteredItems.map((item: any) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.link}</link>
        <guid>${item.guid}</guid>
        <pubDate>${item.pubDate}</pubDate>
      </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>
      <title>Elite Group Feed: ${type}</title>
      ${rssItems}
    </channel></rss>`;

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch indexer data" }, { status: 500 });
  }
}