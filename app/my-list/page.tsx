"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MyList() {
  const [items, setItems] = useState<any[]>([]);;
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('saved_items').select('*');
      if (data) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        alert("✅ IMDb IDs Synced!");
        fetchList();
      }
    } catch (err) {
      alert("Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}"?`)) return;
    const { error } = await supabase.from('saved_items').delete().eq('id', id);
    if (!error) fetchList();
  };

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-tighter">My Library</h1>
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-1 mt-2">
            ← Back to Discovery
          </a>
        </div>

        <button 
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
        >
          {syncing ? "🔄 Syncing..." : "⚡ Sync IMDb IDs"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-bold uppercase">Loading Library...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
          <p className="text-gray-400">Your library is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {items.map((item: any) => (
            <div key={item.id} className="group bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
              <div className="relative">
                <img 
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                  className="w-full aspect-[2/3] object-cover" 
                  alt={item.title}
                />
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.imdb_id ? 'bg-emerald-500' : 'bg-amber-500 text-black'}`}>
                  {item.imdb_id ? 'IMDb Synced' : 'Needs Sync'}
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <h3 className="font-bold text-sm line-clamp-2 leading-tight">{item.title}</h3>
                <button 
                  onClick={() => handleDelete(item.id, item.title)}
                  className="mt-4 w-full py-1.5 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black rounded-lg transition-all uppercase"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Automation Section */}
      {mounted && (
        <div className="mt-20 p-8 bg-gray-800/50 rounded-3xl border border-gray-700 max-w-4xl">
          <h2 className="text-2xl font-black mb-6 text-emerald-400 uppercase tracking-tighter">Server Sync Links</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radarr Box */}
            <div className="bg-black/40 p-5 rounded-2xl border border-blue-900/30">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">🎬 Radarr (Movies)</h3>
              <code className="text-[10px] text-gray-400 break-all block mb-3 p-2 bg-black rounded">
                {window.location.origin}/api/export?type=movie
              </code>
              <p className="text-[9px] text-gray-500 uppercase font-bold">Paste in Radarr Settings</p>
            </div>

            {/* Sonarr Box */}
            <div className="bg-black/40 p-5 rounded-2xl border border-purple-900/30">
              <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">📺 Sonarr (TV)</h3>
              <code className="text-[10px] text-gray-400 break-all block mb-3 p-2 bg-black rounded">
                {window.location.origin}/api/export?type=tv
              </code>
              <p className="text-[9px] text-gray-500 uppercase font-bold">Paste in Sonarr Settings</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}