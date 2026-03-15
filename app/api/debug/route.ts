import { NextResponse } from 'next/server';

export async function GET() {
  const envKeys = Object.keys(process.env);
  return NextResponse.json({
    message: "Checking for API keys...",
    visible_keys: envKeys.filter(key => 
      key.includes('NZB') || key.includes('SUPABASE') || key.includes('TOKEN')
    ),
    count: envKeys.length,
    timestamp: new Date().toISOString()
  });
}