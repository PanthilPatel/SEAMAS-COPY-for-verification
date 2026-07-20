import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Mic, Command, ArrowUpRight } from 'lucide-react';

const SUGGESTIONS = [
    { label: 'Best noise-cancelling headphones under $400' },
    { label: 'Compare M-series laptops for developers' },
    { label: 'Most durable weatherproof backpacks' },
    { label: 'Deals ending in the next 24 hours' }
];

export default function ChatInterface({ onQuerySubmit, loading }) {
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
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
                <span className="text-white/95">six specialists worked for you.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-center text-[15px] leading-relaxed text-neutral-400">
                Describe what you want. SEAMAS orchestrates a team of AI agents across marketplaces,
                reviews, and price history — and returns a decision, not just a list.
            </p>

            {/* Search Box Card */}
            <div className="relative mt-10">
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
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            disabled={loading}
                            placeholder="e.g. Best noise-cancelling headphones under $400 for long flights…"
                            className="flex-1 bg-transparent font-display text-lg font-light tracking-tight text-white placeholder:text-neutral-500 focus:outline-none sm:text-xl"
                        />
                        
                        {/* Voice button */}
                        <button
                            type="button"
                            className="hidden shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/[0.05] hover:text-neutral-200 sm:inline-flex"
                            aria-label="Voice input"
                        >
                            <Mic className="h-4 w-4" strokeWidth={1.6} />
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
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    onClick={() => handleChipClick(s.label)}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] text-neutral-300 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/[0.04] hover:text-white"
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