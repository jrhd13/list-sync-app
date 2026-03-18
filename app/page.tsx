"use client";
import React, { useState, useEffect } from 'react';

export default function EliteDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 📍 POINT 1: Add the "isRefreshing" State
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/elite-list');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  // 📍 POINT 2: Create the Refresh Function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMovies();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const addToRadarr = async (item: any) => {
    const cleanTitle = item.title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    
    const movieData = {
      title: cleanTitle,
      qualityProfileId: 10, // Change to 4 or 6 if needed
      rootFolderPath: "/storage/symlinks/movies",
      tmdbId: item.tmdbId,
      year: parseInt(item.title.match(/\d{4}/)?.[0] || "2024"),
      monitored: true,
      addOptions: { searchForMovie: true }
    };

    try {
      const res = await fetch('/api/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
      });
      
      if (res.ok) {
        alert(`✅ Success! ${cleanTitle} added to Radarr.`);
      } else {
        const result = await res.json();
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert("⚠️ Connection error to Radarr API.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-widest text-xs">Initializing Elite Feeds...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      
      {/* 📍 POINT 3: Add the Button to the UI Header */}
      <div className="flex flex-col items-center justify-center mb-12 gap-6">
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">
          MEDIAFLOW ELITE
        </h1>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-8 py-3 rounded-full border border-gray-800 bg-gray-950 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:border-blue-500 hover:text-blue-400 active:scale-95 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRefreshing ? '🔄 Syncing Feeds...' : '🔄 Refresh List'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {items.map((item, idx) => (
          <div key={idx} className="bg-[#0a0a0a] rounded-[2rem] p-5 border border-gray-900 flex flex-col justify-between hover:border-gray-700 transition-colors group">
            <div>
              <div className="relative overflow-hidden rounded-2xl mb-5 shadow-2xl">
                {item.posterPath ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} 
                    alt="poster" 
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-900 flex items-center justify-center text-gray-700 text-xs">NO POSTER</div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-blue-400">
                  ⭐ {item.score || '0.0'}
                </div>
              </div>
              
              <h3 className="text-sm font-bold leading-tight mb-1 truncate">{item.title}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold italic">Endorsed Release</p>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button 
                onClick={() => addToRadarr(item)}
                className="w-full py-4 bg-white text-black text-[11px] font-black uppercase rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-[0.98]"
              >
                Grab Release
              </button>
              
              <button 
                onClick={() => window.open(`https://jrhd13-radarr.elfhosted.party/add/new?term=${encodeURIComponent(item.title)}`, '_blank')}
                className="w-full py-3 bg-transparent text-gray-500 text-[9px] font-bold uppercase tracking-wider rounded-2xl border border-gray-900 hover:border-gray-700 hover:text-gray-300 transition-all"
              >
                🔍 Search Radarr
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}