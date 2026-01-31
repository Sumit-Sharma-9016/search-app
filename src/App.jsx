import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Music, Hash, Code, ExternalLink, Globe, Loader2, Youtube, Film, ArrowRight, Command, Sparkles, Briefcase, Bot, Brain, LayoutGrid } from 'lucide-react';

// --- API UTILITIES ---

// 1. Music (iTunes API - Fixed with Proxy)
const searchMusic = async (term) => {
  try {
    // We use 'api.allorigins.win' as a proxy to prevent the 'musics://' redirect error and CORS blocks
    const targetUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=12`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("iTunes Music API Error", error);
    return [];
  }
};

// 2. Code (GitHub API)
const searchGithub = async (term) => {
  try {
    const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(term)}&sort=stars&order=desc&per_page=9`);
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("GitHub API Error", error);
    return [];
  }
};

// --- COMPONENTS ---

const QuickAccessButton = ({ icon: Icon, label, color, onClick, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-800/80 border border-white/10 hover:bg-neutral-700 hover:border-white/20 transition-all duration-200 group active:scale-95 cursor-pointer backdrop-blur-md shadow-lg"
  >
    <div className={`p-3 rounded-xl bg-neutral-950 shadow-inner group-hover:scale-110 transition-transform duration-200 ${color}`}>
      <Icon size={24} />
    </div>
    <span className="text-[11px] font-semibold text-neutral-300 group-hover:text-white transition-colors text-center leading-tight">
      {label}
    </span>
  </a>
);

const Card = ({ title, subtitle, image, link, extra, type }) => (
  <a 
    href={link} 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative flex flex-col bg-neutral-900/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10"
  >
    <div className="relative aspect-square overflow-hidden bg-neutral-900">
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-700">
          <Music size={48} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
      <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
        {type}
      </div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <h3 className="text-white font-medium text-lg leading-tight mb-1 line-clamp-1">{title}</h3>
      <p className="text-neutral-400 text-sm mb-3">{subtitle}</p>
      {extra && <p className="text-violet-400 text-xs mt-auto font-medium tracking-wide">{extra}</p>}
    </div>
  </a>
);

const CodeCard = ({ repo }) => (
  <a 
    href={repo.html_url}
    target="_blank" 
    rel="noopener noreferrer"
    className="bg-neutral-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-emerald-500/50 hover:bg-neutral-900/80 transition-all group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2 text-emerald-400">
        <Code size={18} />
        <span className="font-mono text-xs uppercase tracking-wider">Repository</span>
      </div>
      <ArrowRight size={16} className="text-neutral-600 group-hover:text-emerald-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </div>
    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-300 transition-colors line-clamp-1">{repo.name}</h3>
    <p className="text-neutral-400 text-sm mb-4 line-clamp-2 h-10">{repo.description || "No description available."}</p>
    <div className="flex items-center space-x-4 text-xs text-neutral-500 font-mono border-t border-white/5 pt-4">
      <span>★ {repo.stargazers_count}</span>
      <span>⑂ {repo.forks_count}</span>
      <span>{repo.language}</span>
    </div>
  </a>
);

const DeepLinkButton = ({ platform, icon, color, url, query, desc, onClick }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className={`flex items-center justify-between p-5 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-${color}-500/50 hover:bg-neutral-800/80 group transition-all duration-300 active:scale-[0.98] cursor-pointer`}
  >
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-xl bg-neutral-950 text-${color}-400 group-hover:text-white group-hover:bg-${color}-500 transition-colors duration-300 shadow-lg`}>
        {icon}
      </div>
      <div>
        <h4 className="text-white font-medium text-lg">{platform}</h4>
        <p className="text-neutral-400 text-sm mt-0.5">{desc || `Search ${platform} for "${query}"`}</p>
      </div>
    </div>
    <ExternalLink size={20} className="text-neutral-600 group-hover:text-white transition-colors" />
  </a>
);

export default function SearchApp() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("web");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchedTerm, setSearchedTerm] = useState("");

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchedTerm(query);
    setResults([]);

    if (activeTab === "music") {
      const data = await searchMusic(query);
      setResults(data);
    } else if (activeTab === "code") {
      const data = await searchGithub(query);
      setResults(data);
    } else {
      // Web, Video, Social, AI use deep links
      setResults([true]); 
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (searchedTerm) {
      handleSearch();
    }
  }, [activeTab]);

  const copyToClipboard = () => {
    if (searchedTerm) {
      const textArea = document.createElement("textarea");
      textArea.value = searchedTerm;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-violet-500/30 selection:text-violet-200 pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header & Search */}
        <div className="pt-12 pb-8 flex flex-col items-center justify-center space-y-8">
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
             <Command className="text-violet-500" size={40} />
             Search
          </h1>

          <form onSubmit={handleSearch} className="w-full max-w-xl relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full blur opacity-25 group-focus-within:opacity-50 transition-opacity duration-500" />
            <div className="relative flex items-center bg-neutral-900 border border-white/10 rounded-full shadow-2xl overflow-hidden">
              <SearchIcon className="ml-5 text-neutral-500" size={20} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?" 
                className="w-full bg-transparent text-white px-4 py-4 focus:outline-none placeholder:text-neutral-600"
              />
              <button 
                type="submit"
                className="mr-2 bg-neutral-800 hover:bg-white hover:text-black text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300"
              >
                Go
              </button>
            </div>
          </form>

          {/* QUICK ACCESS SECTION (Moved above tabs) */}
          {!loading && searchedTerm && (
             <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-3 px-1 opacity-60">
                  <LayoutGrid size={14} className="text-violet-400" />
                  <span className="text-xs font-bold tracking-wider text-neutral-300 uppercase">Quick Access</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  <QuickAccessButton 
                    label="Google" 
                    icon={SearchIcon} 
                    color="text-violet-400" 
                    href={`https://www.google.com/search?q=${encodeURIComponent(searchedTerm)}`}
                  />
                  <QuickAccessButton 
                    label="ChatGPT" 
                    icon={Bot} 
                    color="text-emerald-400" 
                    href="https://chatgpt.com/"
                    onClick={copyToClipboard}
                  />
                  <QuickAccessButton 
                    label="Gemini" 
                    icon={Brain} 
                    color="text-blue-400" 
                    href="https://gemini.google.com/app"
                    onClick={copyToClipboard}
                  />
                  <QuickAccessButton 
                    label="YouTube" 
                    icon={Youtube} 
                    color="text-red-500" 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchedTerm)}`}
                  />
                  <QuickAccessButton 
                    label="Instagram" 
                    icon={Hash} 
                    color="text-pink-400" 
                    href={`https://www.instagram.com/explore/tags/${searchedTerm.replace(/\s+/g, '')}/`}
                  />
                  <QuickAccessButton 
                    label="Reddit" 
                    icon={ExternalLink} 
                    color="text-orange-400" 
                    href={`https://www.reddit.com/search/?q=${encodeURIComponent(searchedTerm)}`}
                  />
                  <QuickAccessButton 
                    label="Dailymotion" 
                    icon={Film} 
                    color="text-neutral-400" 
                    href={`https://www.dailymotion.com/search/${encodeURIComponent(searchedTerm)}`}
                  />
                  <QuickAccessButton 
                    label="LinkedIn" 
                    icon={Briefcase} 
                    color="text-blue-500" 
                    href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(searchedTerm)}`}
                  />
                </div>
                <div className="h-px bg-white/10 my-8" />
             </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'web', icon: Globe, label: 'Web' },
              { id: 'ai', icon: Sparkles, label: 'AI' },
              { id: 'social', icon: Hash, label: 'Social' },
              { id: 'video', icon: Youtube, label: 'Video' },
              { id: 'music', icon: Music, label: 'Music' },
              { id: 'code', icon: Code, label: 'Code' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setResults([]); 
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                    : 'bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-white/5'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-4 min-h-[400px]">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-600 animate-pulse">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm tracking-widest uppercase">Searching</p>
            </div>
          )}

          {!loading && !searchedTerm && (
            <div className="text-center py-20 opacity-30">
              <p className="text-neutral-400 text-lg font-light">Select a category to begin</p>
            </div>
          )}

          {/* 1. WEB (Google Exact Match) */}
          {!loading && searchedTerm && activeTab === 'web' && (
             <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Web Results</h2>
               </div>
               <div className="grid grid-cols-1 gap-4">
                <DeepLinkButton 
                  platform="Google Exact Match" 
                  color="violet"
                  icon={<SearchIcon />}
                  query={searchedTerm}
                  url={`https://www.google.com/search?q="${encodeURIComponent(searchedTerm)}"`} 
                  desc="Find exact matches for your query"
                />
                <DeepLinkButton 
                  platform="Google Search" 
                  color="blue"
                  icon={<Globe />}
                  query={searchedTerm}
                  url={`https://www.google.com/search?q=${encodeURIComponent(searchedTerm)}`} 
                  desc="Standard Google search results"
                />
                <DeepLinkButton 
                  platform="DuckDuckGo" 
                  color="orange"
                  icon={<Shield />} 
                  url={`https://duckduckgo.com/?q=${encodeURIComponent(searchedTerm)}`} 
                  desc="Private search without tracking"
                />
               </div>
             </div>
          )}

          {/* 2. AI */}
          {!loading && searchedTerm && activeTab === 'ai' && (
             <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-6 flex gap-3 items-center">
                  <Sparkles className="text-violet-400 shrink-0" size={20} />
                  <p className="text-sm text-violet-200">
                    Tip: The AI buttons below also <b>copy your query</b> to the clipboard.
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-4">
                <DeepLinkButton 
                  platform="ChatGPT" 
                  color="emerald"
                  icon={<Bot />}
                  query={searchedTerm}
                  url="https://chatgpt.com/" 
                  desc="Opens ChatGPT (Query copied)"
                  onClick={copyToClipboard}
                />
                <DeepLinkButton 
                  platform="Gemini" 
                  color="blue"
                  icon={<Brain />}
                  query={searchedTerm}
                  url="https://gemini.google.com/app" 
                  desc="Opens Google Gemini (Query copied)"
                  onClick={copyToClipboard}
                />
                <DeepLinkButton 
                  platform="Perplexity" 
                  color="cyan"
                  icon={<SearchIcon />}
                  query={searchedTerm}
                  url={`https://www.perplexity.ai/search?q=${encodeURIComponent(searchedTerm)}`} 
                  desc="AI-powered answer engine"
                />
               </div>
             </div>
          )}

          {/* 3. MUSIC */}
          {!loading && searchedTerm && activeTab === 'music' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-4 px-2 max-w-5xl mx-auto">
                 <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Music Results</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.length > 0 ? results.map((item, idx) => {
                  if (!item || !item.trackName) return null;
                  return <Card key={idx} 
                    title={item.trackName}
                    subtitle={item.artistName}
                    image={item.artworkUrl100?.replace('100x100', '600x600')}
                    link={`https://open.spotify.com/search/${encodeURIComponent(item.trackName + " " + item.artistName)}`}
                    extra={item.collectionName}
                    type="Song"
                  />
                }) : <div className="col-span-full text-center text-neutral-500">No music found.</div>}
              </div>
            </div>
          )}

          {/* 4. VIDEO */}
          {!loading && searchedTerm && activeTab === 'video' && (
             <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Video Results</h2>
               </div>
               <div className="grid grid-cols-1 gap-4">
                <DeepLinkButton 
                  platform="YouTube" 
                  color="red"
                  icon={<Youtube />}
                  query={searchedTerm}
                  url={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchedTerm)}`} 
                />
                <DeepLinkButton 
                  platform="Vimeo" 
                  color="sky"
                  icon={<Film />}
                  query={searchedTerm}
                  url={`https://vimeo.com/search?q=${encodeURIComponent(searchedTerm)}`} 
                />
                <DeepLinkButton 
                  platform="Dailymotion" 
                  color="neutral"
                  icon={<Film />}
                  query={searchedTerm}
                  url={`https://www.dailymotion.com/search/${encodeURIComponent(searchedTerm)}`} 
                />
               </div>
             </div>
          )}

          {/* 5. CODE */}
          {!loading && searchedTerm && activeTab === 'code' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between mb-4 px-2 max-w-5xl mx-auto">
                 <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Code Results</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.length > 0 ? results.map((repo, idx) => (
                   repo && repo.html_url ? <CodeCard key={idx} repo={repo} /> : null
                )) : <div className="col-span-full text-center text-neutral-500">No repositories found.</div>}
              </div>
            </div>
          )}

          {/* 6. SOCIAL */}
          {!loading && searchedTerm && activeTab === 'social' && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Social Results</h2>
               </div>
              <div className="grid grid-cols-1 gap-4">
                <DeepLinkButton 
                  platform="Instagram" 
                  color="pink"
                  icon={<Hash />}
                  query={searchedTerm}
                  url={`https://www.instagram.com/explore/tags/${searchedTerm.replace(/\s+/g, '')}/`} 
                  desc="Search Hashtags"
                />
                <DeepLinkButton 
                  platform="LinkedIn" 
                  color="blue"
                  icon={<Briefcase />}
                  query={searchedTerm}
                  url={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(searchedTerm)}`} 
                  desc="Search People & Jobs"
                />
                <DeepLinkButton 
                  platform="Reddit" 
                  color="orange"
                  icon={<ExternalLink />}
                  query={searchedTerm}
                  url={`https://www.reddit.com/search/?q=${encodeURIComponent(searchedTerm)}`} 
                />
                <DeepLinkButton 
                  platform="Twitter / X" 
                  color="neutral"
                  icon={<Hash />}
                  query={searchedTerm}
                  url={`https://twitter.com/search?q=${encodeURIComponent(searchedTerm)}`} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon helper for DDG since Shield wasn't imported in main list
function Shield(props) {
  return (
    <svg 
      {...props}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}