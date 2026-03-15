'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SettingsPage() {
  const [groups, setGroups] = useState<{ name: string }[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('release_groups').select('name');
    if (data) setGroups(data);
  };

  const addGroup = async () => {
    if (!newGroup) return;
    setSyncing(true);
    await supabase.from('release_groups').insert([{ name: newGroup.toUpperCase() }]);
    setNewGroup('');
    await fetchGroups();
    await fetch('/api/elite-list?force=true');
    setSyncing(false);
  };

  const deleteGroup = async (name: string) => {
    await supabase.from('release_groups').delete().eq('name', name);
    fetchGroups();
    fetch('/api/elite-list?force=true');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header with THE BACK BUTTON */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center gap-2 text-[#00f2fe] hover:text-[#4facfe] transition-colors font-bold uppercase text-xs tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Feed
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
            MediaFlow
          </h1>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Group Management</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Edit your elite group filters</p>
          </div>
          
          {/* Input Area */}
          <div className="flex gap-2 mb-8 bg-[#0a0f1a] p-2 rounded-xl border border-gray-800">
            <input 
              value={newGroup} 
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Enter Group Name..."
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            />
            <button 
              onClick={addGroup}
              className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0a0f1a] font-bold py-2 px-6 rounded-lg transition-all active:scale-95 text-xs uppercase"
            >
              {syncing ? '...' : 'Add'}
            </button>
          </div>

          {/* Group List */}
          <div className="grid grid-cols-1 gap-2">
            {groups.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-xl">
                 <p className="text-gray-600 text-sm italic">No groups in your filter.</p>
              </div>
            ) : (
              groups.map((g, i) => (
                <div key={i} className="flex justify-between items-center bg-[#1f2937]/50 p-4 rounded-xl border border-gray-800 group hover:border-[#00f2fe]/30 transition-colors">
                  <span className="font-mono text-gray-200 tracking-wider uppercase">{g.name}</span>
                  <button 
                    onClick={() => deleteGroup(g.name)}
                    className="text-gray-600 hover:text-red-500 transition-colors p-1"
                    title="Delete Group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-[9px] text-gray-700 uppercase tracking-[0.5em]">
          Production Environment
        </footer>
      </div>
    </div>
  );
}