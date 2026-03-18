"use client";
import React, { useState, useEffect } from 'react';

export default function EliteDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetching the Super-Feed (Geek Endorsed + Planet)
  const fetchMovies = async () => {
    setLoading(true);
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

  useEffect(() => { fetchMovies(); }, []);

  // 2. The "Grab" Logic (Manual Add to Radarr)
  const addToRadarr = async (item: any) => {
    // Clean title for Radarr (removes dots and year for the search string)
    const cleanTitle = item.title.split(/(\d{4})|1080p|720p|2160p/i)[0].replace(/\./g, ' ').trim();
    
    const movieData = {
      title: cleanTitle,
      qualityProfileId: 10, // Change to 4 or 6 if your Radarr uses a different ID
      rootFolderPath: "/storage/symlinks/movies", // Matches your ElfHosted symlinks
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

  if (loading) return <div className="p-20 text-center text-white">Loading Elite Releases...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        MEDIAFLOW ELITE
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-900 rounded-3xl p-4 border border-gray-800 flex flex-col justify-between">
            <div>
              {item.posterPath ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} 
                  alt="poster" 
                  className="rounded-2xl w-full h-auto mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">No Poster</div>
              )}
              <h3 className="text-sm font-bold truncate">{item.title}</h3>
              <p className="text-blue-400 text-xs mt-1">⭐ {item.score || 'N/A'} TMDB Rating</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {/* BUTTON 1: GRAB */}
              <button 
                onClick={() => addToRadarr(item)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
              >
                GRAB RELEASE
              </button>
              
              {/* BUTTON 2: SEARCH RADARR (Deep Link) */}
              <button 
                onClick={() => window.open(`https://jrhd13-radarr.elfhosted.party/add/new?term=${encodeURIComponent(item.title)}`, '_blank')}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold uppercase rounded-xl border border-gray-700 transition-all"
              >
                🔍 View in Radarr
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}