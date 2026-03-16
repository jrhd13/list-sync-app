// app/api/radarr-status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Hardcoding ElfHosted details directly
  const url = "https://jrhd13-radarr.elfhosted.party";
  const key = "5c1b945af2e44b10ac5762f5580e1df3";

  try {
    const res = await fetch(`${url}/api/v3/queue?apikey=${key}`);
    // ... rest of the fetch logic ...