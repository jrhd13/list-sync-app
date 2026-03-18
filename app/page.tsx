'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeEra, setActiveEra] = useState("");
  const [activeGenre, setActiveGenre] = useState("");

  // --- THE FETCH LOGIC ---
  const loadData = (year = activeEra, genre = activeGenre) => {
    setLoading(true);
    setActiveEra(year);
    setActiveGenre(genre);
    fetch(`/api/elite-list?year=${year}&genre=${genre}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // --- THE ELFHOSTED GRABBER ---
  // Find the addToRadarr function and replace it with this:
const addToRadarr = async (item: any) => {
  const movieData = {
    title: item.title.split(/(\d{4})/)[0].replace(/\./g, ' '),
    qualityProfileId: 1,
    titleSlug: item.title.replace(/\s+/g, '-').toLowerCase(),
    tmdbId: 0,
    year: parseInt(item.title.match(/\d{4}/)?.[0] || "2024"),
    rootFolderPath: "/storage/realdebrid-zurg/movies",
    monitored: true,
    addOptions: { searchForMovie: true }
  };

  try {
    const res = await fetch('/api/grab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movieData)
    });
    
    const result = await res.json();
    if (res.ok) alert("✅ Success! Sent to Radarr.");
    else alert(`❌ Error: ${result.error}`);
  } catch (err) {
    alert("⚠️ Could not reach the internal Grab API.");
  }
};

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center font-black text-[#4facfe] animate-pulse italic uppercase tracking-tighter">
      Scanning Elite Databases...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 md:p-12 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase">
            MediaFlow<span className="text-[#4facfe]">Elite</span>
          </h1>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.4em] mt-2">
            Automated Curation v2.0
          </p>
        </div>
      </div>

      {/* ERA SELECTOR (TIMELINE) */}
      <div className="mb-8">
        <h2 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4 italic">Jump to Era</h2>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {['', '2020', '2010', '2000', '1990', '1980', '1970'].map(era => (
            <button 
              key={era} 
              onClick={() => loadData(era, activeGenre)}
              className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeEra === era ? 'bg-[#4facfe] text-black shadow-lg shadow-[#4facfe]/20' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              {era ? `${era}s` : 'Latest Drops'}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="mb-12 flex flex-col md:flex-row gap-4 items-center bg-[#111827]/40 p-4 rounded-[2rem] border border-gray-800">
        
        {/* Genre Dropdown */}
        <select 
          value={activeGenre}
          onChange={(e) => loadData(activeEra, e.target.value)}
          className="bg-[#030712] border border-gray-800 p-3 rounded-2xl text-[10px] font-black uppercase text-[#4facfe] outline-none cursor-pointer hover:border-[#4facfe]/50 transition-all w-full md:w-48 appearance-none text-center"
        >
          <option value="">All Genres</option>
          <option value="Action">Action</option>
          <option value="Sci-Fi">Sci-Fi</option>
          <option value="Horror">Horror</option>
          <option value="Comedy">Comedy</option>
          <option value="Thriller">Thriller</option>
        </select>

        {/* Text Search */}
        <input 
          type="text" 
          placeholder="Search within results (e.g. NTb, Flux...)" 
          className="bg-[#030712] border border-gray-800 p-3 rounded-2xl w-full md:flex-1 text-sm focus:border-[#4facfe] outline-none transition-all placeholder:text-gray-700"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
      </div>

      {/* MOVIE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {items
          .filter(i => i.title.toLowerCase().includes(search))
          .map((item: any) => (
            <div key={item.guid} className="group relative">
              <div className="aspect-[2/3] bg-gray-900 rounded-[2.5rem] overflow-hidden border border-gray-800 group-hover:border-[#4facfe]/40 transition-all duration-500 shadow-2xl relative">
                
                {item.posterPath ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-90 group-hover:opacity-100" 
                    alt="poster" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-800 font-black italic text-5xl">?</div>
                )}
                
                {/* OVERLAY ON HOVER */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                  <div className="text-[#4facfe] font-black text-3xl mb-2 italic">
                    {item.score > 0 ? item.score.toFixed(1) : 'NR'}
                  </div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-6">TMDB Rating</div>
                  <button 
                    onClick={() => addToRadarr(item)}
                    className="bg-white text-black font-black text-[10px] px-8 py-4 rounded-2xl uppercase tracking-[0.2em] hover:bg-[#4facfe] transition-colors shadow-xl"
                  >
                    Grab Release
                  </button>
                </div>

                {/* TAGS */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                   <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black border border-white/10 uppercase italic text-[#4facfe]">
                     {item.title.split('-').pop()}
                   </div>
                </div>
              </div>

              {/* TITLE UNDER POSTER */}
              <div className="mt-6 px-4">
                <h3 className="font-bold text-[11px] uppercase tracking-tighter line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.title.split(/(\d{4})/)[0].replace(/\./g, ' ')}
                </h3>
                <p className="text-[8px] font-black text-gray-600 mt-1 uppercase tracking-widest">
                  {new Date(item.pubDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}