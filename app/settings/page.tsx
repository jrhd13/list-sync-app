"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('release_groups').select('*').order('name');
    if (data) setGroups(data);
  };

  const addGroup = async () => {
    if (!newGroup) return;
    // We force uppercase to keep the filtering consistent
    await supabase.from('release_groups').insert([{ name: newGroup.trim().toUpperCase() }]);
    setNewGroup('');
    fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('release_groups').delete().eq('id', id);
    fetchGroups();
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <a href="/" className="text-gray-500 hover:text-white">←</a>
            <h1 className="text-3xl font-black text-emerald-400 uppercase italic">Elite Groups</h1>
        </div>
        
        <p className="text-gray-500 text-sm mb-6">Add group tags (like NTb or FLUX) to filter your high-quality RSS feeds.</p>

        <div className="flex gap-2 mb-8">
          <input 
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder="Add group (e.g. TOMB)"
            className="flex-1 bg-gray-800 border border-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={addGroup} className="bg-emerald-500 text-black font-black px-6 rounded-xl transition-transform active:scale-95">ADD</button>
        </div>

        <div className="grid gap-2">
          {groups.length === 0 && <p className="text-center py-10 text-gray-600 italic">No groups added yet.</p>}
          {groups.map(g => (
            <div key={g.id} className="bg-gray-800/40 p-4 rounded-xl flex justify-between items-center border border-gray-800 hover:border-gray-700 transition-colors">
              <span className="font-bold text-lg tracking-widest text-gray-200">-{g.name}</span>
              <button onClick={() => deleteGroup(g.id)} className="text-red-500 font-bold text-xs uppercase hover:text-red-400 p-2">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}