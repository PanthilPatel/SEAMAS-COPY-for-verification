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
        <form onSubmit={handleSubmit} className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-3">
                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Search products (e.g., 'Asus rog phone' or 'Puma shoes under 20000')..."
                        className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm border border-slate-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-semibold text-sm py-3 px-6 rounded-xl shadow-xs transition-colors duration-200 flex items-center space-x-2 disabled:cursor-not-allowed shrink-0"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <span>Run Pipeline</span>
                    )}
                </button>
            </div>
        </form>
    );
}