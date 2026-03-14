import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const mode = searchParams.get('t') || searchParams.get('mode');
  const categoryId = type === 'tv' ? '5000' : '2000';

  if (mode === 'caps') {
    const capsXml = `<?xml version="1.0" encoding="UTF-8"?><caps><searching><search available="yes" supportedParams="q"/></searching><categories><category id="2000" name="Movies"/><category id="5000" name="TV"/></categories></caps>`.trim();
    return new NextResponse(capsXml, { headers: { 'Content-Type': 'application/xml' } });
  }

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name').eq('is_active', true);
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];
    const apiKey = process.env.NZBGEEK_API_KEY;
    
    const geekUrl = `https://api.nzbgeek.info/api?t=search&cat=${categoryId}&apikey=${apiKey}&o=json`;
    const res = await fetch(geekUrl);
    const apiData = await res.json();
    let items = apiData.channel?.item || [];
    
    let filteredItems = items.filter((item: any) => 
      groupList.length > 0 && groupList.some(group => item.title.toUpperCase().includes(`-${group}`))
    );

    // If empty, create a dummy item WITH proper Newznab attributes
    if (filteredItems.length === 0) {
      filteredItems = [{
        title: `MediaFlow.Elite.Test.Show.S01E01-ELITE`,
        link: 'https://nzbgeek.info',
        guid: 'test-' + Date.now(),
        pubDate: new Date().toUTCString(),
        category: categoryId
      }];
    }

    const rssItems = filteredItems.map((item: any) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.link}</link>
        <guid isPermaLink="false">${item.guid}</guid>
        <pubDate>${item.pubDate}</pubDate>
        <enclosure url="${item.link}" length="0" type="application/x-nzb" />
        <newznab:attr name="category" value="${item.category || categoryId}" />
      </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
      <channel>
        <title>MediaFlow</title>
        ${rssItems}
      </channel>
    </rss>`.trim();

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });
  } catch (error) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title></channel></rss>`, { headers: { 'Content-Type': 'application/xml' } });
  }
}