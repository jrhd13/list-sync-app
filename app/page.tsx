'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MediaFlowDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [radarrQueue, setRadarrQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newGroup, setNewGroup] = useState('');

  const fetchData = async (force = false) => {
    setIsRefreshing(true);
    try {
      // 1. Fetch our filtered Elite List
      const listRes = await fetch(force ? '/api/elite-list?force=true' : '/api/elite-list');
      const listData = await listRes.json();
      
      // 2. Fetch Radarr Queue (Requires a small API route we'll make next)
      const radarrRes = await fetch('/api/radarr-status');
      const radarrData = await radarrRes.json();

      if (Array.isArray(listData)) setItems(listData);
      if (Array.isArray(radarrData)) setRadarrQueue(radarrData);
      
    } catch (err) {
      console.error("Sync error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
            MediaFlow
          </h1>
          <div className="flex gap-3">
            <button onClick={() => fetchData(true)} className={`p-2 rounded-lg bg-[#1f2937] ${isRefreshing ? 'animate-spin' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8m0-5v5h-5"/></svg>
            </button>
            <Link href="/settings" className="bg-[#1f2937] px-4 py-2 rounded-lg text-sm border border-gray-700">Settings</Link>
          </div>
        </div>

        {/* Quick Add */}
        <div className="flex gap-2 mb-10 bg-[#111827] p-2 rounded-xl border border-gray-800">
          <input 
            value={newGroup} 
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder="Quick Add Elite Group..."
            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
          />
          <button onClick={async () => {
            await supabase.from('release_groups').insert([{ name: newGroup.toUpperCase() }]);
            setNewGroup('');
            fetchData(true);
          }} className="bg-[#00f2fe] text-[#0a0f1a] px-6 py-2 rounded-lg text-xs font-bold uppercase">Add</button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Elite List */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00f2fe] rounded-full animate-pulse"></span>
              Elite Filter Results
            </h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-[#111827] border border-gray-800 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                  <p className="text-[10px] text-[#00f2fe] mt-1 font-mono uppercase">{item.imdbId}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Radarr Live Activity */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              Radarr Activity
            </h2>
            <div className="space-y-3">
              {radarrQueue.length === 0 ? (
                <p className="text-gray-600 text-xs italic">No active downloads...</p>
              ) : (
                radarrQueue.map((q, i) => (
                  <div key={i} className="bg-[#111827] border border-orange-900/30 p-4 rounded-xl">
                    <p className="text-sm font-medium text-orange-200 truncate">{q.title}</p>
                    <div className="flex justify-between mt-2">
                       <span className="text-[9px] text-orange-500 font-bold uppercase">{q.status}</span>
                       <span className="text-[9px] text-gray-500">{q.sizeleft} left</span>
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