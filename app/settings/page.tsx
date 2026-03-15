"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eliteResults, setEliteResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('release_groups').select('*').order('name');
    if (data) setGroups(data);
  };

  const addGroup = async () => {
    if (!newGroup) return;
    await supabase.from('release_groups').insert([{ name: newGroup.trim().toUpperCase() }]);
    setNewGroup('');
    fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('release_groups').delete().eq('id', id);
    fetchGroups();
  };

  const runEliteSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      // We add &format=json so the UI gets data it can read, instead of XML
      const res = await fetch(`/api/elite-search?q=${encodeURIComponent(searchQuery)}&format=json`);
      const data = await res.json();
      setEliteResults(data);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <a href="/" className="text-gray-500 hover:text-white transition-colors">← Back</a>
            <h1 className="text-3xl font-black text-emerald-400 uppercase italic">Elite Settings</h1>
        </div>
        
        {/* Section 1: Group Manager */}
        <section className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 mb-8">
          <h2 className="text-lg font-bold mb-2">Release Group Filters</h2>
          <p className="text-gray-500 text-sm mb-6">Movies containing these tags will be prioritized by Radarr.</p>

          <div className="flex gap-2 mb-6">
            <input 
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Add group (e.g. NTb)"
              className="flex-1 bg-black/40 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={addGroup} className="bg-emerald-500 text-black font-black px-6 rounded-xl active:scale-95 transition-transform">
              ADD
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <div key={g.id} className="bg-gray-800 px-4 py-2 rounded-full flex items-center gap-3 border border-gray-700">
                <span className="font-mono font-bold text-sm">-{g.name}</span>
                <button onClick={() => deleteGroup(g.id)} className="text-red-500 hover:text-red-400 font-bold text-xs">✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Elite Search Tester */}
        <section className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-lg font-bold mb-2 text-blue-400">Elite Search Tester</h2>
          <p className="text-gray-500 text-sm mb-6">Live search NZBPlanet & Geek for matched groups.</p>

          <div className="flex gap-2 mb-8">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runEliteSearch()}
              placeholder="Search movie title..."
              className="flex-1 bg-black/40 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={runEliteSearch} className="bg-blue-600 px-6 rounded-xl font-bold">
              {isSearching ? '...' : 'SEARCH'}
            </button>
          </div>

          <div className="space-y-3">
            {eliteResults.map((nzb, i) => (
              <div key={i} className="bg-black/20 p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                <div className="overflow-hidden mr-4">
                  <p className="text-xs font-mono text-gray-300 truncate">{nzb.title}</p>
                </div>
                <a href={nzb.link} target="_blank" className="text-[10px] bg-white/5 hover:bg-emerald-500 hover:text-black px-3 py-2 rounded font-black transition-colors">NZB</a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}