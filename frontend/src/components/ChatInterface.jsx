import React, { useState } from 'react';

export default function ChatInterface({ onQuerySubmit, loading }) {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        onQuerySubmit(input.trim());
        setInput('');
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative flex items-center bg-[#1a1b1e] border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg focus-within:border-indigo-500/60 focus-within:shadow-indigo-900/20 focus-within:shadow-lg transition-all duration-200">

                {/* Search icon */}
                <div className="pl-4 pr-1 shrink-0 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder='Search products — e.g. "Asus ROG phone" or "Puma shoes under ₹5000"'
                    className="flex-grow bg-transparent text-sm text-slate-200 placeholder-slate-600 py-4 px-3 focus:outline-none disabled:opacity-50"
                />

                {/* Submit button */}
                <div className="pr-2 shrink-0">
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-bold py-2 px-5 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Analyzing</span>
                            </>
                        ) : (
                            <span>Search</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Hint row */}
            {!loading && (
                <div className="flex items-center space-x-3 mt-2 px-1">
                    <span className="text-[10px] text-slate-600">Try:</span>
                    {[
                        'iPhone 15 under ₹70000',
                        'Nike running shoes',
                        'Samsung TV budget 50000',
                    ].map(hint => (
                        <button
                            key={hint}
                            type="button"
                            onClick={() => { setInput(hint); }}
                            className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                            {hint}
                        </button>
                    ))}
                </div>
            )}
        </form>
    );
}