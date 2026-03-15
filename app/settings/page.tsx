'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function OldSettingsPage() {
  const [groups, setGroups] = useState<{ name: string }[]>([]);
  const [newGroup, setNewGroup] = useState('');

  // 1. Fetch groups on load (The old way)
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('release_groups').select('name');
    if (data) setGroups(data);
  };

  // 2. Add group to Supabase (The old way)
  const addGroup = async () => {
    if (!newGroup) return;
    await supabase.from('release_groups').insert([{ name: newGroup.toUpperCase() }]);
    setNewGroup('');
    fetchGroups();
    // Auto-sync in the background so you don't need a button
    fetch('/api/elite-list?force=true');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Settings</h1>
      <p>Manage your release groups below.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          value={newGroup} 
          onChange={(e) => setNewGroup(e.target.value)}
          placeholder="Group Name (e.g. NTb)"
          style={{ padding: '8px', color: '#000' }}
        />
        <button onClick={addGroup} style={{ padding: '8px', marginLeft: '10px' }}>Add Group</button>
      </div>

      <ul>
        {groups.map((g, i) => (
          <li key={i}>{g.name}</li>
        ))}
      </ul>
    </div>
  );
}