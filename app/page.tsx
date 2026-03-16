'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MediaFlowDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');

  const fetchData = async () => {
    setIsRefreshing(true);
    const res = await fetch('/api/elite-list?force=true');
    const data = await res.json();
    if (Array.isArray(data)) setItems(data);
    setLoading(false);
    setIsRefreshing(false);
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">MediaFlow</h1>
          <div className="flex gap-2">
             <button onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} className="bg-[#1f2937] px-3 py-2 rounded-lg text-[10px] font-bold uppercase border border-gray-700">
               Sort: {sortOrder === 'new' ? 'Newest' : 'Oldest'}
             </button>
             <button onClick={fetchData} className={`p-2 rounded-lg bg-[#1f2937] ${isRefreshing ? 'animate-spin' : ''}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8m0-5v5h-5"/></svg>
             </button>
             <Link href="/settings" className="bg-[#1f2937] px-4 py-2 rounded-lg text-sm border border-gray-700">Settings</Link>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-20 text-gray-500 animate-pulse uppercase text-xs tracking-widest">Deep Scanning History...</p>
          ) : sortedItems.map((item, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 p-4 rounded-xl hover:border-[#00f2fe]/40 transition-all flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-sm font-medium text-gray-200 line-clamp-2">{item.title}</h3>
                <span className="text-[9px] bg-[#0a0f1a] border border-gray-800 text-[#00f2fe] px-2 py-1 rounded font-mono shrink-0 uppercase">{item.imdbId}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-800/50 pt-2">
                <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">MOVIES > HD • {item.service} • {formatSize(item.size)}</span>
                <span className="text-[9px] text-gray-400 italic bg-gray-800/30 px-2 py-0.5 rounded">
                  {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}