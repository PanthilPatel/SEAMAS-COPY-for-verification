import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Mic, Command, ArrowUpRight, Zap, Sliders } from 'lucide-react';

const ALL_SUGGESTIONS = [
    { label: 'Cozy retro mechanical keyboards with RGB light & pastel keycaps' },
    { label: 'Best noise-cancelling wireless earbuds under ₹15,000' },
    { label: 'iPhone 17 Pro Max' },
    { label: 'Minimalist ambient LED desk lamps & setup aesthetics' },
    { label: 'Ergonomic office chairs for back support under ₹20k' },
    { label: 'Best gaming monitors 1440p 144Hz' },
    { label: 'Sony PlayStation 5 vs Xbox Series X deals' },
];

const AGENT_COUNT = 7;
const AGENT_COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

export default function ChatInterface({ onQuerySubmit, loading, isGuest = false, steeringMode = 'balanced', setSteeringMode }) {
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [currentSuggestions, setCurrentSuggestions] = useState(ALL_SUGGESTIONS.slice(0, 3));
    const inputRef = useRef(null);

    // Keyboard shortcut to focus search input: Ctrl/Cmd + /
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Rotate suggestions every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSuggestions(() => {
                const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, 3);
            });
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleMicClick = () => {
        if (isGuest) {
            onQuerySubmit("");
            return;
        }
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setInput(transcript);
        };
        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSubmit = (e, q) => {
        if (e) e.preventDefault();
        const query = (q ?? input).trim();
        if (!query || loading) return;
        onQuerySubmit(query);
    };

    const handleChipClick = (suggestion) => {
        setInput(suggestion);
        handleSubmit(null, suggestion);
    };

    return (
        <section className="relative z-10 mx-auto w-full max-w-4xl text-left">
            {/* Eyebrow */}
            <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center space-x-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 select-none">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                        Multi-agent · Live
                    </span>
                </div>
            </div>

            {/* Headline */}
            <h1 className="font-display text-center text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="text-gradient">Shop as if </span>
                <br className="hidden sm:block" />
                <span className="text-white/95">{`${AGENT_COUNT_WORDS[AGENT_COUNT] || AGENT_COUNT} specialists worked for you.`}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-center text-[15px] leading-relaxed text-neutral-400">
                Describe what you want. SEAMAS orchestrates a team of AI agents across marketplaces,
                reviews, and price history — and returns a decision, not just a list.
            </p>

            {/* Steering Mode Selector */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { id: 'speed', name: 'Speed Mode', desc: '1 page, basic comparison', cost: '5 credits', icon: Zap, color: 'text-amber-400', activeBg: 'bg-amber-400/[0.05]', activeBorder: 'border-amber-400/40' },
                    { id: 'balanced', name: 'Balanced', desc: '2 pages, deep pricing & reviews', cost: '10 credits', icon: Sliders, color: 'text-cyan-400', activeBg: 'bg-cyan-400/[0.05]', activeBorder: 'border-cyan-400/40' },
                    { id: 'accuracy', name: 'Accuracy Mode', desc: '4 pages, exhaustive analysis', cost: '20 credits', icon: Sparkles, color: 'text-indigo-400', activeBg: 'bg-indigo-400/[0.05]', activeBorder: 'border-indigo-400/40' },
                ].map((mode) => {
                    const isActive = steeringMode === mode.id;
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => !loading && setSteeringMode && setSteeringMode(mode.id)}
                            disabled={loading}
                            className={`group relative flex flex-col rounded-2xl p-4 border text-left transition-all duration-300 ${
                                isActive 
                                    ? `${mode.activeBorder} ${mode.activeBg} shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]` 
                                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isActive && (
                                <span className={`absolute top-3 right-3 h-2 w-2 rounded-full bg-current ${mode.color} animate-pulse`} />
                            )}
                            <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${isActive ? mode.color : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                                <span className="font-display font-medium text-xs text-white">{mode.name}</span>
                            </div>
                            <span className="mt-1 text-[10px] text-neutral-500 leading-snug">{mode.desc}</span>
                            <span className="mt-2 font-mono text-[9px] text-neutral-400 uppercase tracking-wider">{mode.cost}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Box Card */}
            <div className="relative mt-6">
                {/* Glow backdrop shadow */}
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -inset-4 rounded-[28px] opacity-40 blur-2xl transition-opacity duration-500 ${focused ? 'opacity-70' : 'opacity-40'}`}
                    style={{
                        background:
                            'conic-gradient(from 90deg at 50% 50%, hsl(187 92% 43% / 0.35), hsl(239 84% 67% / 0.35), hsl(280 60% 60% / 0.25), hsl(187 92% 43% / 0.35))',
                    }}
                />

                <div className="seamas-glass-strong relative overflow-hidden rounded-3xl">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
                        <Search className="h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.6} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => {
                                if (isGuest) {
                                    onQuerySubmit("");
                                } else {
                                    setInput(e.target.value);
                                }
                            }}
                            onFocus={() => {
                                if (isGuest) {
                                    onQuerySubmit("");
                                } else {
                                    setFocused(true);
                                }
                            }}
                            onBlur={() => setFocused(false)}
                            disabled={loading}
                            placeholder={isGuest ? "🔒 Please sign in to compare prices and search..." : "e.g. Cozy retro mechanical keyboards or noise-cancelling earbuds under ₹15,000…"}
                            className="flex-1 bg-transparent font-display text-lg font-light tracking-tight text-white placeholder:text-neutral-500 focus:outline-none sm:text-xl"
                        />

                        {/* Voice button */}
                        <button
                            type="button"
                            onClick={handleMicClick}
                            className={`hidden shrink-0 rounded-full p-2.5 transition-all duration-300 sm:inline-flex ${isListening ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse' : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200'}`}
                            aria-label="Voice input"
                        >
                            <Mic className="h-4 w-4" strokeWidth={isListening ? 2 : 1.6} />
                        </button>

                        {/* Kbd badge */}
                        <kbd className="seamas-kbd hidden sm:inline-flex">
                            <Command className="mr-1 h-2.5 w-2.5" strokeWidth={2.5} />/
                        </kbd>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/10 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span className="aurora-cta absolute inset-0" aria-hidden="true" />
                            <span className="relative flex items-center gap-1.5">
                                {loading ? "Orchestrating…" : "Execute"}
                                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                            </span>
                        </button>
                    </form>

                    {/* Suggestions list */}
                    <div className="border-t border-white/[0.05] px-5 py-3 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                                Try
                            </span>
                            {currentSuggestions.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    onClick={() => handleChipClick(s.label)}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] text-neutral-300 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:border-cyan-400/40 hover:bg-cyan-400/[0.06] hover:text-white animate-fade-in"
                                >
                                    <Sparkles className="h-3 w-3 text-neutral-500 transition-colors group-hover:text-cyan-300" strokeWidth={1.75} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
