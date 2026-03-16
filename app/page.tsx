'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MediaFlowDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [radarrQueue, setRadarrQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch Elite List
      const listRes = await fetch('/api/elite-list?force=true');
      const listData = await listRes.json();
      if (Array.isArray(listData)) setItems(listData);

      // Fetch Radarr Status
      const radarrRes = await fetch('/api/radarr-status');
      const radarrData = await radarrRes.json();
      if (Array.isArray(radarrData)) setRadarrQueue(radarrData);
      else setRadarrQueue([]);

    } catch (err) {
      console.error("Dashboard sync error", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return sortOrder === 'new' ? dateB - dateA : dateA - dateB;
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 GB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
            MediaFlow
          </h1>
          <div className="flex gap-3">
            <button 
                onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} 
                className="bg-[#1f2937] px-3 py-2 rounded-lg text-[10px] font-bold uppercase border border-gray-700"
            >
              Sort: {sortOrder === 'new' ? 'Newest' : 'Oldest'}
            </button>
            <button 
                onClick={fetchData} 
                className={`p-2 rounded-lg bg-[#1f2937] border border-gray-700 ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8m0-5v5h-5"/></svg>
            </button>
            <Link href="/settings" className="bg-[#1f2937] px-4 py-2 rounded-lg text-sm border border-gray-700">
              Settings
            </Link>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Elite List */}
          <div>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full"></span>
              Elite Feed
            </h2>
            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-gray-600 animate-pulse italic">Scanning Indexers...</p>
              ) : sortedItems.map((item, i) => (
                <div key={i} className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="text-xs font-medium text-gray-200 line-clamp-2">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{item.service} • {formatSize(item.size)}</span>
                    <span className="text-[9px] text-[#00f2fe] font-mono">{item.imdbId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Radarr Queue */}
          <div>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              Radarr Activity
            </h2>
            <div className="space-y-3">
              {radarrQueue.length === 0 ? (
                <div className="bg-[#111827]/50 border border-gray-800/50 p-6 rounded-xl text-center">
                  <p className="text-xs text-gray-600 italic">No active downloads</p>
                </div>
              ) : (
                radarrQueue.map((q, i) => (
                  <div key={i} className="bg-[#111827] border border-orange-900/20 p-4 rounded-xl">
                    <p className="text-xs font-medium text-orange-100 truncate">{q.title}</p>
                    <div className="flex justify-between mt-2">
                       <span className="text-[9px] text-orange-500 font-bold uppercase">{q.status}</span>
                       <span className="text-[9px] text-gray-500">{q.sizeleft}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}