import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getTmdbMetadata(title: string, apiKey: string) {
  try {
    const clean = title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(clean)}`);
    const data = await res.json();
    const movie = data.results?.[0];
    if (!movie) return { tmdbId: null, imdbId: null };

    const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${apiKey}`);
    const details = await detailRes.json();
    return {
      tmdbId: movie.id,
      imdbId: details.imdb_id || null
    };
  } catch { return { tmdbId: null, imdbId: null }; }
}

export async function GET() {
  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name');
    const selectedGroups = dbGroups?.sort(() => 0.5 - Math.random()).slice(0, 5).map(g => g.name.toUpperCase()) || [];

    // --- PASTE YOUR KEYS HERE ---
    const TMDB_KEY = "45fd2f0e1df91fb5378987631492b06e";
    const keys = { 
        geek: "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV", 
        planet: "618518524733b41d3487ca5a8d7a29df", 
        scene: "b29985ef096f4e03ed11073f3f825aca" 
    };

    const endpoints = [
      `https://api.nzbgeek.info/api?t=search&cat=2000&apikey=${keys.geek}&o=json`,
      `https://nzbplanet.net/api?t=movie&apikey=${keys.planet}&o=json`,
      `https://scenenzbs.com/api?t=movie&apikey=${keys.scene}&o=json`
    ];

    const searchPromises = selectedGroups.flatMap(group => 
      endpoints.map(url => fetch(`${url}&q=${group}`).then(res => res.json()).catch(() => ({})))
    );

    const results = await Promise.all(searchPromises);
    const allItems = results.flatMap(data => data.channel?.item || []);
    const uniqueData = Array.from(new Map(allItems.map(item => [item.title, item])).values()).slice(0, 15);

    const feedItems = await Promise.all(uniqueData.map(async (item: any) => {
      const meta = await getTmdbMetadata(item.title, TMDB_KEY);
      return `
        <item>
          <title>${item.title.replace(/&/g, '&amp;')}</title>
          <link>${item.link || ''}</link>
          <description>Elite Release from ${item.title.split('-').pop()}</description>
          ${meta.tmdbId ? `<tmdbid>${meta.tmdbId}</tmdbid>` : ''}
          ${meta.imdbId ? `<imdbid>${meta.imdbId}</imdbid>` : ''}
          <pubDate>${item.pubDate}</pubDate>
          <guid isPermaLink="false">${item.guid?.['#text'] || item.guid || Math.random()}</guid>
        </item>`;
    }));

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>MediaFlow Elite Auto-Pilot</title>
        <link>https://list-sync-app-w1hi-eight.vercel.app</link>
        <description>Automated Movie Curation Feed</description>
        ${feedItems.join('')}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    return new NextResponse('<error>Feed Generation Failed</error>', { status: 500 });
  }
}