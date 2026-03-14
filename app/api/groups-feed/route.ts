import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const mode = searchParams.get('t') || searchParams.get('mode');
  const cat = type === 'tv' ? '5000' : '2000';

  if (mode === 'caps') {
    const capsXml = `<?xml version="1.0" encoding="UTF-8"?><caps><searching><search available="yes" supportedParams="q"/></searching><categories><category id="2000" name="Movies"/><category id="5000" name="TV"/></categories></caps>`.trim();
    return new NextResponse(capsXml, { headers: { 'Content-Type': 'application/xml' } });
  }

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name').eq('is_active', true);
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    // Fetch from BOTH Geek and Planet
    const urls = [
      `https://api.nzbgeek.info/api?t=search&cat=${cat}&apikey=${process.env.NZBGEEK_API_KEY}&o=json`,
      `https://nzbplanet.net/api?t=search&cat=${cat}&apikey=${process.env.NZBPLANET_API_KEY}&o=json`
    ];

    const results = await Promise.all(urls.map(url => fetch(url).then(res => res.json()).catch(() => ({ channel: { item: [] } }))));
    let items = results.flatMap(data => data.channel?.item || []);
    
    let filteredItems = items.filter((item: any) => 
      groupList.length > 0 && groupList.some(group => item.title.toUpperCase().includes(`-${group}`))
    );

    // If empty, create a "Beefier" Dummy Item
    if (filteredItems.length === 0) {
      filteredItems = [{
        title: `MediaFlow.Elite.Quality.Test.S01E01-ELITE`,
        link: 'https://nzbgeek.info',
        guid: 'test-' + Date.now(),
        pubDate: new Date().toUTCString(),
        size: "2147483648" // 2GB
      }];
    }

    const rssItems = filteredItems.map((item: any) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.link}</link>
        <guid isPermaLink="false">${item.guid}</guid>
        <pubDate>${item.pubDate}</pubDate>
        <enclosure url="${item.link}" length="${item.size || '0'}" type="application/x-nzb" />
        <newznab:attr name="category" value="${cat}" />
        <newznab:attr name="size" value="${item.size || '2147483648'}" />
      </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
      <channel>
        <title>MediaFlow</title>
        <description>Elite RSS Feed</description>
        ${rssItems}
      </channel>
    </rss>`.trim();

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });
  } catch (error) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title></channel></rss>`, { headers: { 'Content-Type': 'application/xml' } });
  }
}