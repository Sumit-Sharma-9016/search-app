import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Music, Hash, Code, ExternalLink, Globe, Loader2, Youtube, Film, ArrowRight, Command, Sparkles, Briefcase, Bot, Brain, LayoutGrid, Twitter, Video, Mic, Zap, ZapOff } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- API UTILITIES ---

// 1. Music (iTunes API - Fixed with Proxy)
const searchMusic = async (term) => {
  try {
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

// --- DATA: ALL APPS ---
const DEFAULT_APPS = [
  { id: 'google', label: 'Google', iconName: 'SearchIcon', color: 'text-violet-400', url: 'https://www.google.com/search?q=' },
  { id: 'chatgpt', label: 'ChatGPT', iconName: 'Bot', color: 'text-emerald-400', url: 'https://chatgpt.com/', copy: true },
  { id: 'gemini', label: 'Gemini', iconName: 'Brain', color: 'text-blue-400', url: 'https://gemini.google.com/', copy: true },
  { id: 'youtube', label: 'YouTube', iconName: 'Youtube', color: 'text-red-500', url: 'https://www.youtube.com/results?search_query=' },
  { id: 'instagram', label: 'Instagram', iconName: 'Hash', color: 'text-pink-400', url: 'https://www.instagram.com/explore/tags/', suffix: '/' },
  { id: 'reddit', label: 'Reddit', iconName: 'ExternalLink', color: 'text-orange-400', url: 'https://www.reddit.com/search/?q=' },
  { id: 'dailymotion', label: 'Dailymotion', iconName: 'Film', color: 'text-neutral-400', url: 'https://www.dailymotion.com/search/' },
  { id: 'linkedin', label: 'LinkedIn', iconName: 'Briefcase', color: 'text-blue-500', url: 'https://www.linkedin.com/search/results/all/?keywords=' },
  { id: 'twitter', label: 'X / Twitter', iconName: 'Hash', color: 'text-white', url: 'https://twitter.com/search?q=' },
  { id: 'perplexity', label: 'Perplexity', iconName: 'Sparkles', color: 'text-cyan-400', url: 'https://www.perplexity.ai/search?q=' },
  { id: 'duckduckgo', label: 'DuckDuckGo', iconName: 'Globe', color: 'text-orange-300', url: 'https://duckduckgo.com/?q=' },
  { id: 'vimeo', label: 'Vimeo', iconName: 'Video', color: 'text-sky-400', url: 'https://vimeo.com/search?q=' },
];

// Helper to map icon names to components
const IconMap = {
  SearchIcon, Music, Hash, Code, ExternalLink, Globe, Youtube, Film, Command, Sparkles, Briefcase, Bot, Brain, Twitter, Video
};

// --- COMPONENTS ---

// Sortable Button Component
const SortableQuickAccessButton = ({ id, iconName, label, color, onClick, href }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = IconMap[iconName] || Globe;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="touch-none select-none relative" // touch-none prevents scrolling while dragging
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // Double check: Prevent click if we were dragging
          if (isDragging) {
             e.preventDefault();
             e.stopPropagation();
             return;
          }
          if (onClick) onClick(e);
        }}
        // CRITICAL FIX: This prevents the mouseup/click event from reaching the link if it's being dragged
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-800 border border-white/10 hover:bg-neutral-700 hover:border-white/30 transition-colors duration-200 group cursor-grab active:cursor-grabbing shadow-md h-full"
      >
        <div className={`p-3 rounded-xl bg-neutral-900 shadow-inner group-hover:scale-110 transition-transform duration-200 ${color}`}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-bold text-neutral-300 group-hover:text-white transition-colors text-center leading-tight select-none">
          {label}
        </span>
      </a>
    </div>
  );
};

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

export default function SearchApp() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("web");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchedTerm, setSearchedTerm] = useState("");
  
  // Custom Quick Access State
  const [quickApps, setQuickApps] = useState(DEFAULT_APPS);

  // Auto Mic State
  const [autoMic, setAutoMic] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('reeSearch_quickAccess');
    const savedAutoMic = localStorage.getItem('reeSearch_autoMic');

    if (savedOrder) {
      try {
        setQuickApps(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to load quick access order", e);
      }
    }
    if (savedAutoMic) {
      setAutoMic(savedAutoMic === 'true');
    }
  }, []);

  // Drag Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setQuickApps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('reeSearch_quickAccess', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  // SEARCH FUNCTION - Refactored to accept manual input (from voice)
  const handleSearch = async (e, manualQuery) => {
    e?.preventDefault();
    const term = typeof manualQuery === 'string' ? manualQuery : query;

    if (!term.trim()) return;

    setLoading(true);
    setSearchedTerm(term);
    if (typeof manualQuery === 'string') setQuery(term);
    setResults([]);

    if (activeTab === "music") {
      const data = await searchMusic(term);
      setResults(data);
    } else if (activeTab === "code") {
      const data = await searchGithub(term);
      setResults(data);
    } else {
      setResults([true]); 
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (searchedTerm) {
      // Re-run search if tab changes (but not if it was just set by handleSearch)
      // Actually handleSearch sets results, so we only need to refetch if tab changes
      // This effect is mostly for when user clicks a tab AFTER searching
      const refreshSearch = async () => {
         setLoading(true);
         setResults([]);
         if (activeTab === "music") {
           const data = await searchMusic(searchedTerm);
           setResults(data);
         } else if (activeTab === "code") {
           const data = await searchGithub(searchedTerm);
           setResults(data);
         } else {
           setResults([true]); 
         }
         setLoading(false);
      }
      refreshSearch();
    }
  }, [activeTab]); // Only dependency is activeTab here

  // VOICE SEARCH LOGIC
  const handleMicClick = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleSearch(null, transcript);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  };

  // Auto-Start Mic Effect
  useEffect(() => {
    // Only try to auto-start if enabled, not listening, and no search yet
    if (autoMic && !searchedTerm && !isListening) {
      const t = setTimeout(() => {
        handleMicClick();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [autoMic]); // Run when autoMic loads/changes

  const toggleAutoMic = () => {
    const newState = !autoMic;
    setAutoMic(newState);
    localStorage.setItem('reeSearch_autoMic', String(newState));
  };

  const copyToClipboard = async () => {
    if (!searchedTerm) return;
    try {
      await navigator.clipboard.writeText(searchedTerm);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = searchedTerm;
      textArea.setAttribute('readonly', '');
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (e) { console.error("Copy failed", e); }
      document.body.removeChild(textArea);
    }
  };

  // Helper to construct URL
  const getAppUrl = (app) => {
    if (!searchedTerm) return '#';
    if (app.url.includes('?')) {
      return `${app.url}${encodeURIComponent(searchedTerm)}${app.suffix || ''}`;
    }
    return `${app.url}${searchedTerm.replace(/\s+/g, '')}${app.suffix || ''}`;
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-violet-500/30 selection:text-violet-200 pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Settings / Auto-Mic Toggle */}
        <div className="absolute top-6 right-4 sm:right-6">
           <button 
             onClick={toggleAutoMic}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
               autoMic 
               ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' 
               : 'bg-neutral-900/50 border-white/10 text-neutral-500 hover:text-neutral-300'
             }`}
           >
             {autoMic ? <Zap size={14} className="fill-current" /> : <ZapOff size={14} />}
             Auto-Mic {autoMic ? 'ON' : 'OFF'}
           </button>
        </div>

        {/* Header & Search */}
        <div className="pt-12 pb-8 flex flex-col items-center justify-center space-y-8">
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
             <Command className="text-violet-500" size={40} />
             Search
          </h1>

          <form onSubmit={handleSearch} className="w-full max-w-xl relative group">
            <div className={`absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full blur opacity-25 transition-opacity duration-500 ${isListening ? 'opacity-70 animate-pulse' : 'group-focus-within:opacity-50'}`} />
            <div className="relative flex items-center bg-neutral-900 border border-white/10 rounded-full shadow-2xl overflow-hidden">
              <SearchIcon className="ml-5 text-neutral-500" size={20} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isListening ? "Listening..." : "What are you looking for?"}
                className="w-full bg-transparent text-white px-4 py-4 focus:outline-none placeholder:text-neutral-600"
              />
              
              {/* Mic Button */}
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`mr-2 p-2 rounded-full transition-all ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
              >
                <Mic size={20} />
              </button>

              <button 
                type="submit"
                className="mr-2 bg-neutral-800 hover:bg-white hover:text-black text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300"
              >
                Go
              </button>
            </div>
          </form>

          {/* CUSTOMIZABLE QUICK ACCESS SECTION */}
          {!loading && searchedTerm && (
             <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-3 px-1 opacity-80">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={16} className="text-violet-400" />
                    <span className="text-sm font-bold tracking-wider text-neutral-200 uppercase">Quick Access</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Hold to Reorder</span>
                </div>
                
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={quickApps.map(a => a.id)} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 gap-3">
                      {quickApps.map((app) => (
                        <SortableQuickAccessButton 
                          key={app.id}
                          id={app.id}
                          label={app.label}
                          iconName={app.iconName}
                          color={app.color}
                          href={app.copy ? app.url : getAppUrl(app)}
                          onClick={app.copy ? copyToClipboard : undefined}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                <div className="h-px bg-white/10 my-8" />
             </div>
          )}

          {/* Navigation Tabs - Filter View */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'web', icon: Globe, label: 'Web' },
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
        </div>
      </div>
    </div>
  );
}