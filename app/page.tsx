"use client";

import { useState, useEffect } from "react";

const SERVICES = [
  { name: "All Services", id: "" },
  { name: "Netflix", id: "8" },
  { name: "Disney+", id: "337" },
  { name: "Prime Video", id: "9" },
  { name: "Paramount+ 🆕", id: "531" },
  { name: "Hulu (Disney+ UK) 🆕", id: "15" },
  { name: "NOW (HBO) 🇬🇧", id: "481" },
  { name: "BBC iPlayer 🇬🇧", id: "332" },
  { name: "ITVX 🇬🇧", id: "41" },
  { name: "Channel 4 🇬🇧", id: "103" },
  { name: "UKTV Play 🇬🇧", id: "357" },
  { name: "Sky Go 🇬🇧", id: "29" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("trending");
  const [service, setService] = useState("");
  const [mediaType, setMediaType] = useState("movie");

  useEffect(() => {
    fetchDiscovery(view, service);
  }, [mediaType]);

  const fetchDiscovery = async (type: string, serviceId = "") => {
    setLoading(true);
    setView(type);
    
    let url = "";
    if (serviceId) {
      url = `https://api.themoviedb.org/3/discover/${mediaType}?with_watch_providers=${serviceId}&watch_region=GB&sort_by=popularity.desc`;
    } else {
      url = type === "trending" 
        ? `https://api.themoviedb.org/3/trending/all/day?region=GB` 
        : `https://api.themoviedb.org/3/${mediaType}/popular?region=GB`;
    }
    
    const res = await fetch(`/api/search?endpoint=${encodeURIComponent(url)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setView("search");
    setService(""); 
    const res = await fetch(`/api/search?q=${query}`);
    const data = await res.json();
    setResults(data.filter((item: any) => item.media_type !== 'person'));
    setLoading(false);
  };

  const handleSave = async (item: any) => {
    const title = item.title || item.name;
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb_id: item.id.toString(),
        title: title,
        media_type: item.media_type || (item.title ? 'movie' : 'tv'),
        poster_path: item.poster_path
      }),
    });
    const data = await res.json();
    if (data.success) alert(`✅ Saved ${title}`);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-tighter">List Sync</h1>
        <a href="/my-list" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
          <span>📂</span> My Library
        </a>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6 items-center bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
        <button onClick={() => { setService(""); fetchDiscovery("trending"); }} className={`px-4 py-2 rounded-xl text-sm font-bold ${view === 'trending' && !service ? 'bg-blue-600' : 'bg-gray-800'}`}>🔥 Trending</button>
        <button onClick={() => { setService(""); fetchDiscovery("popular"); }} className={`px-4 py-2 rounded-xl text-sm font-bold ${view === 'popular' && !service ? 'bg-blue-600' : 'bg-gray-800'}`}>🌟 Popular</button>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setMediaType("movie")} className={`px-3 py-1 text-xs font-bold rounded ${mediaType === 'movie' ? 'bg-gray-700 text-blue-400' : 'text-gray-500'}`}>Movies</button>
          <button onClick={() => setMediaType("tv")} className={`px-3 py-1 text-xs font-bold rounded ${mediaType === 'tv' ? 'bg-gray-700 text-blue-400' : 'text-gray-500'}`}>TV</button>
        </div>

        <select 
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            fetchDiscovery("discover", e.target.value);
          }}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <form onSubmit={handleSearch} className="mb-12 flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for something specific..."
          className="w-full max-w-md px-5 py-3 rounded-2xl bg-gray-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all"
        />
        <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold shadow-lg">
          {loading ? "..." : "Search"}
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {results.map((item: any) => {
          const title = item.title || item.name;
          const date = item.release_date || item.first_air_date;
          const year = date ? date.substring(0, 4) : "N/A";
          const typeLabel = item.media_type === 'tv' || !item.title ? 'TV' : 'Movie';

          return (
            <div key={item.id} className="group bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 flex flex-col hover:border-blue-500/50 transition-all">
              <div className="relative">
                <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} className="w-full aspect-[2/3] object-cover" alt={title} />
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold uppercase text-white tracking-widest">{typeLabel}</div>
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm line-clamp-2 min-h-[2.5rem] mb-1">{title}</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{year}</p>
                </div>
                <button onClick={() => handleSave(item)} className="mt-4 w-full py-2 bg-blue-600/10 hover:bg-emerald-500 text-blue-400 hover:text-white rounded-xl text-xs font-black transition-all border border-blue-600/20 uppercase tracking-tighter shadow-md">+ Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}