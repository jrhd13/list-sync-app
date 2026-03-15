'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MediaFlowList() {
  const [items, setItems] = useState<{ title: string; imdbId: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/elite-list')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
            MediaFlow
          </h1>
          <Link href="/settings" className="bg-[#1f2937] hover:bg-[#374151] text-gray-200 px-4 py-2 rounded-lg text-sm border border-gray-700 transition-all">
            Settings
          </Link>
        </div>

        {/* List Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 animate-pulse text-gray-500 uppercase tracking-widest text-sm">
              Scanning Indexers...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-400">No elite releases found in the current pool.</p>
              <p className="text-xs text-gray-600 mt-2 uppercase">Checks Geek, Planet, AltHub, Scene</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="bg-[#111827] border border-gray-800 p-4 rounded-xl hover:border-[#00f2fe]/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-100 group-hover:text-[#00f2fe] transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[10px] bg-[#1f2937] text-gray-400 px-2 py-1 rounded uppercase font-bold ml-4">
                    {item.imdbId}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <footer className="mt-12 text-center">
          <div className="inline-block h-1 w-12 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] rounded-full mb-4"></div>
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
            Syncing Live with Radarr
          </p>
        </footer>
      </div>
    </div>
  );
}