import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const mode = searchParams.get('t') || searchParams.get('mode');
  const cat = type === 'tv' ? '5000' : '2000';

  // 🔴 HARDCODED KEYS - Paste your actual keys inside the quotes!
  const geekKey = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV";
  const planetKey = "618518524733b41d3487ca5a8d7a29df";

  // 1. CAPABILITIES CHECK (The "Full Handshake" for Sonarr/Radarr)
  if (mode === 'caps') {
    const capsXml = `<?xml version="1.0" encoding="UTF-8"?>
    <caps>
      <server version="1.0" title="MediaFlow"/>
      <searching>
        <search available="yes" supportedParams="q"/>
        <tv-search available="yes" supportedParams="q,season,ep,tvmazeid"/>
        <movie-search available="yes" supportedParams="q,imdbid,tmdbid"/>
      </searching>
      <categories>
        <category id="2000" name="Movies">
          <subcat id="2030" name="Movies/SD"/>
          <subcat id="2040" name="Movies/HD"/>
          <subcat id="2045" name="Movies/UHD"/>
        </category>
        <category id="5000" name="TV">
          <subcat id="5030" name="TV/SD"/>
          <subcat id="5040" name="TV/HD"/>
          <subcat id="5045" name="TV/UHD"/>
        </category>
      </categories>
    </caps>`.trim();
    return new NextResponse(capsXml, { headers: { 'Content-Type': 'application/xml' } });
  }

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name').eq('is_active', true);
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    const urls = [
      `https://api.nzbgeek.info/api?t=search&cat=${cat}&apikey=${geekKey}&o=json`,
      `https://nzbplanet.net/api?t=search&cat=${cat}&apikey=${planetKey}&o=json`
    ];

    const results = await Promise.all(urls.map(url => 
      fetch(url).then(res => res.json()).catch(() => ({ channel: { item: [] } }))
    ));
    
    let items = results.flatMap(data => data.channel?.item || []);
    
    let filteredItems = items.filter((item: any) => 
      groupList.length > 0 && groupList.some(group => item.title.toUpperCase().includes(`-${group}`))
    );

    if (filteredItems.length === 0) {
      filteredItems = items.slice(0, 5).map((item: any) => ({
        ...item,
        title: `[TEST-MODE] ${item.title}`
      }));
    }

    // Convert & to &amp; to make links XML safe
    const rssItems = filteredItems.map((item: any) => {
      const safeLink = item.link ? item.link.replace(/&/g, '&amp;') : '';
      
      return `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${safeLink}</link>
        <guid isPermaLink="false">${item.guid || Math.random()}</guid>
        <pubDate>${item.pubDate || new Date().toUTCString()}</pubDate>
        <enclosure url="${safeLink}" length="${item.size || '0'}" type="application/x-nzb" />
        <newznab:attr name="category" value="${cat}" />
        <newznab:attr name="size" value="${item.size || '2147483648'}" />
      </item>`;
    }).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
      <channel>
        <title>MediaFlow</title>
        ${rssItems}
      </channel>
    </rss>`.trim();

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml' } });

  } catch (error: any) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><rss><channel><title>ERROR</title><item><title>${error.message}</title></item></channel></rss>`, { headers: { 'Content-Type': 'application/xml' } });
  }
}