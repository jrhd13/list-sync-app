import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const mode = searchParams.get('t') || searchParams.get('mode');
  const cat = type === 'tv' ? '5000' : '2000';

  // 🔴 HARDCODED KEYS - This bypasses Vercel entirely
  const geekKey = "eNVCFTpk9jMgvcBFdz5UZftlfjtucdTV";
  const planetKey = "618518524733b41d3487ca5a8d7a29df";

  if (mode === 'caps') {
    const capsXml = `<?xml version="1.0" encoding="UTF-8"?><caps><searching><search available="yes" supportedParams="q"/></searching><categories><category id="2000" name="Movies"/><category id="5000" name="TV"/></categories></caps>`.trim();
    return new NextResponse(capsXml, { headers: { 'Content-Type': 'application/xml' } });
  }

  try {
    const { data: dbGroups } = await supabase.from('release_groups').select('name').eq('is_active', true);
    const groupList = dbGroups?.map(g => g.name.toUpperCase()) || [];

    const urls = [
      `https://api.nzbgeek.info/api?t=search&cat=${cat}&apikey=${geekKey}&o=json`,
      `https://nzbplanet.net/api?t=search&cat=${cat}&apikey=${planetKey}&o=json`
    ];

// ... KEEP THE REST OF YOUR CODE EXACTLY THE SAME FROM HERE DOWN ...