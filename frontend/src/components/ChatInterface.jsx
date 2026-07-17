import React, { useState, useEffect, useRef } from 'react';

const EXAMPLE_QUERIES = [
    'iPhone 16 Pro under ₹1,20,000',
    'Asus ROG gaming laptop',
    'Nike running shoes',
    'Samsung OLED TV budget 80000',
    'Sony WH-1000XM5 headphones',
    'Puma sneakers under ₹5000',
];

const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const SendIcon = ({ loading }) => loading ? (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
) : (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

export default function ChatInterface({ onQuerySubmit, loading }) {
    const [input, setInput] = useState('');
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Cycle placeholder hint text
    useEffect(() => {
        if (isFocused || input) return;
        const id = setInterval(() => {
            setPlaceholderIdx(i => (i + 1) % EXAMPLE_QUERIES.length);
        }, 3000);
        return () => clearInterval(id);
    }, [isFocused, input]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        onQuerySubmit(input.trim());
        setInput('');
    };

    const handleHintClick = (hint) => {
        setInput(hint);
        inputRef.current?.focus();
    };

    const dynamicPlaceholder = isFocused || input
        ? 'Search products, brands, or describe what you need…'
        : `Try: "${EXAMPLE_QUERIES[placeholderIdx]}"`;

    return (
        <div className="w-full animate-slide-up">
            {/* Label */}
            <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="text-indigo-400 animate-glow-pulse">
                    <SparkleIcon />
                </div>
                <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
                    AI-Powered Search
                </span>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow background */}
                <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-0 blur-sm transition-opacity duration-300 ${isFocused ? 'opacity-40' : 'group-hover:opacity-20'}`} />

                <div className={`relative flex items-center glass rounded-2xl overflow-hidden transition-all duration-300 ${isFocused ? 'border-indigo-500/50 shadow-glow-sm' : ''}`}
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

                    {/* Left search icon */}
                    <div className="pl-5 pr-2 shrink-0">
                        <svg className={`w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-indigo-400' : 'text-slate-600'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={loading}
                        placeholder={dynamicPlaceholder}
                        className="flex-grow bg-transparent text-sm font-medium text-white placeholder-slate-500 py-5 px-2 focus:outline-none disabled:opacity-50 transition-all"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    />

                    {/* Submit button */}
                    <div className="pr-2 shrink-0">
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="relative flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
                            style={{
                                background: loading || !input.trim()
                                    ? 'rgba(30,30,50,0.8)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: loading || !input.trim() ? 'none' : '0 0 20px rgba(99,102,241,0.4)',
                            }}
                        >
                            {!(loading || !input.trim()) && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                            )}
                            <SendIcon loading={loading} />
                            <span>{loading ? 'Analyzing…' : 'Search'}</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Example chips */}
            {!loading && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 animate-fade-in">
                    <span className="text-[11px] text-slate-600 font-medium">Try:</span>
                    {EXAMPLE_QUERIES.slice(0, 4).map(hint => (
                        <button
                            key={hint}
                            type="button"
                            onClick={() => handleHintClick(hint)}
                            className="text-[11px] text-slate-400 hover:text-indigo-300 bg-white/[0.03] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 px-3 py-1 rounded-full transition-all duration-200"
                        >
                            {hint}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}