import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'; case '>': return '&gt;';
      case '&': return '&amp;'; case '"': return '&quot;';
      case "'": return '&apos;'; default: return c;
    }
  });
};

async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    if (!movie) return { tmdbId: null, imdbId: null };
    const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${apiKey}`);
    const details = await detailRes.json();
    return { tmdbId: movie.id, imdbId: details.imdb_id || null };
  } catch { return { tmdbId: null, imdbId: null }; }
}

export async function GET() {
  try {
   // --- PASTE YOUR KEYS HERE ---
const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e";
const GEEK_KEY = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV";
const PLANET_KEY = "618518524733b41d3487ca5a8d7a29df"; // <--- ADD THIS LINE

const endpoints = [
  // 1. Geek Endorsed Movie Search
  `https://api.nzbgeek.info/api?t=search&q=endorsed_movies&limit=40&apikey=${GEEK_KEY}&o=json`,
  
  // 2. Your Personal NZBPlanet Feed (Converted to API format for better TMDB matching)
  `https://nzbplanet.net/api?t=movie&limit=40&apikey=${PLANET_KEY}&o=json`
];
    const results = await Promise.all(
      endpoints.map(url => fetch(url).then(res => res.json()).catch(() => ({})))
    );

    const allItems = results.flatMap(data => data.channel?.item || []);
    
    // De-duplicate movies found on both sites
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values()).slice(0, 50);

    const feedItems = await Promise.all(uniqueData.map(async (item: any) => {
      const meta = await getTmdbMetadata(item.title, TMDB_KEY);
      return `
        <item>
          <title>${escapeXml(item.title)}</title>
          <link>${escapeXml(item.link || '')}</link>
          <description>Elite Super-Feed Release</description>
          ${meta.tmdbId ? `<tmdbid>${meta.tmdbId}</tmdbid>` : ''}
          ${meta.imdbId ? `<imdbid>${meta.imdbId}</imdbid>` : ''}
          <pubDate>${item.pubDate || new Date().toUTCString()}</pubDate>
          <guid isPermaLink="false">${escapeXml(item.guid?.['#text'] || item.guid || String(Math.random()))}</guid>
        </item>`;
    }));

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>MediaFlow Super-Feed</title>
        <description>Combined Geek Endorsed + Planet RSS</description>
        ${feedItems.join('')}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch (error) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><error>Failed</error>', { status: 500 });
  }
}