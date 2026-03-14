import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const mode = searchParams.get('t'); // Radarr sends 'caps' or 'search'

  // 1. Handle Radarr's "Capabilities" check
  if (mode === 'caps') {
    const capsXml = `<?xml version="1.0" encoding="UTF-8"?>
    <caps>
      <categories>
        <category id="2000" name="Movies"/>
        <category id="5000" name="TV"/>
      </categories>
      <searching>
        <search available="yes" supportedParams="q"/>
      </searching>
    </caps>`;
    return new NextResponse(capsXml, { headers: { 'Content-Type': 'application/xml' } });
  }

  // 2. Standard RSS Feed Logic
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name').eq('is_active', true);
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    // Fetch from NZBGeek
    const category = type === 'tv' ? '5000' : '2000';
    const geekUrl = `https://api.nzbgeek.info/api?t=search&cat=${category}&apikey=${process.env.NZBGEEK_API_KEY}&o=json`;
    
    const res = await fetch(geekUrl);
    const apiData = await res.json();
    
    const filteredItems = (apiData.channel?.item || []).filter((item: any) => 
      groupList.some(group => item.title.toUpperCase().includes(`-${group}`))
    );

    const rssItems = filteredItems.map((item: any) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.link}</link>
        <guid isPermaLink="false">${item.guid}</guid>
        <pubDate>${item.pubDate}</pubDate>
        <enclosure url="${item.link}" length="0" type="application/x-nzb" />
      </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0">
      <channel><title>MediaFlow Elite</title>${rssItems}</channel>
    </rss>`;

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}