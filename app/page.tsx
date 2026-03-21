"use client";
import React, { useState, useEffect } from 'react';

interface MediaItem {
  title: string;
  tmdbId?: number;
  posterPath?: string;
  score?: number | string;
}

const CATEGORIES = [
  { id: 'genre-27', name: '🔪 Horror' },
  { id: 'genre-878', name: '🛸 Sci-Fi' },
  { id: 'genre-28', name: '💥 Action' },
  { id: 'genre-35', name: '😂 Comedy' },
  { id: 'genre-10751', name: '👨‍👩‍👧 Family' },
  { id: 'genre-16', name: '🎨 Animation' },
  { id: 'provider-8', name: '🔴 Netflix' },
  { id: 'provider-337', name: '🏰 Disney+' },
  { id: 'provider-9', name: '📦 Prime' },
  { id: 'network-49', name: '📺 Max / HBO' },
  { id: 'provider-38', name: '🇬🇧 BBC iPlayer' },
  { id: 'provider-39', name: '⚡ NOW' },
  { id: 'network-24', name: '📺 ITVX' },
  { id: 'network-388', name: '📺 U&Dave' },
  { id: 'network-26', name: '🇬🇧 Channel 4' }
];

export default function EliteDashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  
  // NEW: Search States!
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchMedia = async (categoryId: string, type: string, query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/elite-list?filter=${categoryId}&type=${type}&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setToast({ message: "❌ Failed to load from TMDB", type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever Category, Movie/TV Toggle, or Search Query changes
  useEffect(() => {
    fetchMedia(activeCategory, mediaType, activeQuery);
  }, [activeCategory, mediaType, activeQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setActiveQuery('');
  };

  const addToArr = async (item: MediaItem) => {
    const cleanTitle = item.title.replace(/\./g, ' ').trim();
    const endpoint = mediaType === 'movie' ? '/api/grab' : '/api/sonarr';
    
    // 👇 MAKE SURE THESE PATHS MATCH YOUR REAL SETUP 👇
    const rootFolder = mediaType === 'movie' ? "/storage/symlinks/movies" : "/storage/symlinks/series";
    
    // 👇 MAKE SURE THESE ARE YOUR REAL PROFILE IDs 👇
    const radarrProfileId = 10; 
    const sonarrProfileId = 10; 

    const payload = {
      title: cleanTitle,
      qualityProfileId: mediaType === 'movie' ? radarrProfileId : sonarrProfileId, 
      rootFolderPath: rootFolder,
      tmdbId: item.tmdbId || 0,
      year: 2024,
      monitored: true,
      addOptions: mediaType === 'movie' ? { searchForMovie: true } : undefined
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setToast({ message: `✅ ${cleanTitle} added to ${mediaType === 'movie' ? 'Radarr' : 'Sonarr'}!`, type: 'success' });
      } else {
        const result = await res.json();
        setToast({ message: `❌ Error: ${result.error}`, type: 'error' });
      }
    } catch (err) {
      setToast({ message: "⚠️ Connection error.", type: 'error' });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans relative">
      
      <div className="flex flex-col items-center justify-center mb-8 gap-4">
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">
          MEDIAFLOW ELITE
        </h1>

        <div className="flex bg-gray-900 rounded-full p-1 border border-gray-800 shadow-xl mb-2">
          <button 
            onClick={() => { setMediaType('movie'); clearSearch(); }}
            className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mediaType === 'movie' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            🎬 Movies
          </button>
          <button 
            onClick={() => { setMediaType('tv'); clearSearch(); }}
            className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mediaType === 'tv' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            📺 TV Shows
          </button>
        </div>

        {/* --- NEW SEARCH BAR --- */}
        <form onSubmit={handleSearch} className="w-full max-w-lg flex gap-2 mb-2">
          <input 
            type="text" 
            placeholder={`Search for a ${mediaType}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-gray-800 text-white px-6 py-3 rounded-full text-sm focus:outline-none focus:border-gray-500 transition-colors placeholder-gray-600 shadow-inner"
          />
          <button type="submit" className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider hover:bg-gray-300 transition-colors shadow-lg active:scale-95">
            Search
          </button>
          {activeQuery && (
            <button type="button" onClick={clearSearch} className="bg-red-600/20 text-red-500 border border-red-500/30 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors active:scale-95">
              Clear
            </button>
          )}
        </form>
        
        {/* Hides Categories if you are actively searching */}
        {!activeQuery && (
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mt-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  activeCategory === cat.id 
                    ? 'bg-gray-800 border-gray-500 text-white' 
                    : 'bg-[#0a0a0a] border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {items.map((item, idx) => (
            <div key={`${item.tmdbId}-${idx}`} className="bg-[#0a0a0a] rounded-[2rem] p-5 border border-gray-900 flex flex-col justify-between hover:border-gray-700 transition-colors group">
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-5 shadow-2xl bg-gray-900 aspect-[2/3] flex items-center justify-center">
                  {item.posterPath ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} 
                      alt="poster" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-gray-700 text-xs font-bold tracking-widest">NO POSTER</div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-blue-400">
                    ⭐ {item.score || '0.0'}
                  </div>
                </div>
                
                <h3 className="text-sm font-bold leading-tight mb-1 truncate">{item.title}</h3>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <button 
                  onClick={() => addToArr(item)}
                  className={`w-full py-4 text-white text-[11px] font-black uppercase rounded-2xl transition-all shadow-lg active:scale-[0.98] ${mediaType === 'movie' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                  Grab {mediaType === 'movie' ? 'Movie' : 'Series'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm z-50 transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

    </div>
  );
}