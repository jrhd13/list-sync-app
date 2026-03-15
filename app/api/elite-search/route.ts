import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const format = searchParams.get('format'); // Check if UI is asking for JSON
  
  if (!query) return new NextResponse('<error>No query</error>', { status: 400 });

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    const urls = [
      `https://api.nzbgeek.info/api?t=movie&q=${encodeURIComponent(query)}&apikey=${process.env.NZBGEEK_API_KEY}&o=json`,
      `https://nzbplanet.net/api?t=movie&q=${encodeURIComponent(query)}&apikey=${process.env.NZBPLANET_API_KEY}&o=json`
    ];

    const responses = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));
    
    let filteredItems: any[] = [];
    responses.forEach(data => {
      const results = data.channel?.item || [];
      results.forEach((item: any) => {
        if (groupList.some(group => item.title.toUpperCase().includes(`-${group}`))) {
          filteredItems.push(item);
        }
      });
    });

    // If the Tester UI asked for JSON, send it
    if (format === 'json') {
      return NextResponse.json(filteredItems);
    }

    // Otherwise, send XML for Radarr
    const xmlItems = filteredItems.map(item => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.link}</link>
        <guid isPermaLink="false">${item.guid}</guid>
        <pubDate>${item.pubDate}</pubDate>
      </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>MediaFlow Elite</title>${xmlItems}</channel></rss>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });

  } catch (error) {
    return new NextResponse('<error>Failed</error>', { status: 500 });
  }
}