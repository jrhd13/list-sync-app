'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/elite-list').then(res => res.json()).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const groupStats = items.reduce((acc: any, item: any) => {
    const group = item.title.split('-').pop()?.toUpperCase() || "UNKNOWN";
    if (!acc[group]) acc[group] = { name: group, count: 0 };
    acc[group].count += 1;
    return acc;
  }, {});
  const sortedStats = Object.values(groupStats).sort((a: any, b: any) => b.count - a.count).slice(0, 6);

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center font-black text-[#4facfe] tracking-widest animate-pulse">
      LOADING ELITE FEED...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 md:p-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter italic">MEDIAFLOW<span className="text-[#4facfe]">ELITE</span></h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Tier-01 Group Monitoring</p>
      </div>

      {/* Leaderboard */}
      <div className="mb-12">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#4facfe] rounded-full animate-ping"></div> Activity Monitor
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {sortedStats.map((stat: any, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 p-5 rounded-2xl min-w-[140px] shadow-xl">
              <div className="text-[9px] font-bold text-gray-500 mb-1">{stat.name}</div>
              <div className="text-2xl font-black text-white">{stat.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map((item: any) => (
          <div key={item.guid} className="group relative">
            <div className="aspect-[2/3] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 group-hover:border-[#4facfe]/50 transition-all duration-300 shadow-2xl">
              {item.posterPath ? (
                <img src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" alt="poster" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-800 font-black text-5xl italic">?</div>
              )}
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase italic">
                {item.title.split('-').pop()}
              </div>
            </div>
            <div className="mt-4 px-2">
              <h3 className="font-bold text-sm leading-tight line-clamp-1">{item.title.split(/(\d{4})/)[0].replace(/\./g, ' ')}</h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-1">
                <span className="text-[#4facfe]">{item.imdbId}</span>
                <span>•</span>
                <span>{new Date(item.pubDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}