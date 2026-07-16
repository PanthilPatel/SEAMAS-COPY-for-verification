import React, { useState, useEffect, useMemo } from 'react';
import ChatInterface from '../components/ChatInterface';
import SentimentBanner from '../components/SentimentBanner';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import ComparisonExport from '../components/ComparisonExport';
import { apiService } from '../services/api';

export default function UserDashboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuery, setCurrentQuery] = useState('');

    // Dynamic current agent tracker state
    const [activeAgent, setActiveAgent] = useState('');

    // Primary multi-agent state management blocks
    const [priceData, setPriceData] = useState([]);
    const [sentimentReport, setSentimentReport] = useState(null);
    const [maxBudgetCeiling, setMaxBudgetCeiling] = useState(0);

    // Filter and sort tracking values
    const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
    const [priceRange, setPriceRange] = useState(150000);
    const [sortBy, setSortBy] = useState('default');

    // Simulated live agent node transition effects during the loading phase
    useEffect(() => {
        let interval;
        if (loading) {
            const agents = [
                'Live Search Agent (Ingesting engine indexes...)',
                'Budget Advisor Agent (Evaluating price ceilings...)',
                'Price Comparison Agent (Running structural data parses...)',
                'Review Analyzer Agent (Aggregating qualitative buyer sentiment...)',
                'Recommendation Agent (Synthesizing optimal match arrays...)',
                'Finalizer Agent (Packaging system state payload...)'
            ];
            let currentIdx = 0;
            setActiveAgent(agents[0]);

            interval = setInterval(() => {
                currentIdx++;
                if (currentIdx < agents.length) {
                    setActiveAgent(agents[currentIdx]);
                }
            }, 2500); // Transitions to show active worker steps cleanly
        } else {
            setActiveAgent('');
        }

        return () => clearInterval(interval);
    }, [loading]);

    const handleQuerySubmit = async (query) => {
        setLoading(true);
        setError(null);
        setCurrentQuery(query);

        try {
            const data = await apiService.sendChatQuery(query);

            const extractedPrices = data.price_data || [];
            const analysisReport = data.analysis_report || null;

            setPriceData(extractedPrices);
            setSentimentReport(analysisReport);

            const validPrices = extractedPrices
                .map(p => p.extracted_price)
                .filter(p => p !== null && p !== undefined);

            const absoluteMax = validPrices.length > 0 ? Math.max(...validPrices) : 150000;
            setMaxBudgetCeiling(absoluteMax);
            setPriceRange(absoluteMax);

            setSelectedMarketplaces([]);
            setSortBy('default');

        } catch (err) {
            setError(err.message || 'An unexpected error occurred during agent graph routing.');
            setPriceData([]);
            setSentimentReport(null);
        } finally {
            setLoading(false);
        }
    };

    const uniqueMarketplaces = useMemo(() => {
        const stores = priceData.map(item => item.marketplace).filter(Boolean);
        return [...new Set(stores)];
    }, [priceData]);

    const processedItems = useMemo(() => {
        let output = [...priceData];

        if (selectedMarketplaces.length > 0) {
            output = output.filter(item => selectedMarketplaces.includes(item.marketplace));
        }

        output = output.filter(item => {
            if (item.extracted_price === null || item.extracted_price === undefined) return true;
            return item.extracted_price <= priceRange;
        });

        if (sortBy === 'price-asc') {
            output.sort((a, b) => (a.extracted_price || 0) - (b.extracted_price || 0));
        } else if (sortBy === 'price-desc') {
            output.sort((a, b) => (b.extracted_price || 0) - (a.extracted_price || 0));
        }

        return output;
    }, [priceData, selectedMarketplaces, priceRange, sortBy]);

    return (
        <div className="min-h-screen bg-[#202124] text-[#e8eaed] font-sans antialiased selection:bg-indigo-500/30">
            <header className="bg-[#171717] border-b border-slate-800/60 sticky top-0 z-30 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                            S
                        </div>
                        <span className="text-md font-bold tracking-tight text-white">
                            SEAMAS <span className="text-indigo-400 font-medium text-xs ml-1 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">AI Agent Layer</span>
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono hidden sm:block">
                        Status: System Active
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto mb-8">
                    <ChatInterface onQuerySubmit={handleQuerySubmit} loading={loading} />
                    {error && (
                        <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-4 flex items-center space-x-2">
                            <svg className="h-4 w-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 bg-[#171717]/40 border border-slate-800/30 rounded-3xl max-w-xl mx-auto p-8 shadow-sm">
                        <div className="relative flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
                            <span className="absolute flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                                <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Active Node</span>
                            </div>
                            <p className="text-sm font-semibold text-white tracking-wide transition-all duration-300">
                                {activeAgent}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Please hold while local intelligence clusters parse structured dataset properties.
                            </p>
                        </div>
                    </div>
                )}

                {!loading && currentQuery && (
                    <>
                        <SentimentBanner report={sentimentReport} />

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mt-6">
                            <div className="lg:col-span-1 lg:sticky lg:top-24 bg-[#171717] border border-slate-800/40 p-5 rounded-2xl shadow-sm">
                                <FilterSidebar
                                    marketplaces={uniqueMarketplaces}
                                    selectedMarketplaces={selectedMarketplaces}
                                    setSelectedMarketplaces={setSelectedMarketplaces}
                                    maxPriceLimit={maxBudgetCeiling}
                                    priceRange={priceRange}
                                    setPriceRange={setPriceRange}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                />
                            </div>

                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#171717]/60 border border-slate-800/30 p-4 rounded-xl">
                                    <div>
                                        <h2 className="text-md font-semibold text-white tracking-wide">Browse Products</h2>
                                        <p className="text-xs text-slate-400 mt-0.5">Showing {processedItems.length} curated search results matches.</p>
                                    </div>
                                    <div className="shrink-0">
                                        <ComparisonExport data={processedItems} query={currentQuery} />
                                    </div>
                                </div>

                                <ProductGrid items={processedItems} />
                            </div>
                        </div>
                    </>
                )}

                {!loading && !currentQuery && (
                    <div className="text-center py-28 bg-[#171717] border border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8 shadow-md">
                        <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                        </div>
                        <h2 className="text-md font-bold text-white tracking-wide mb-1">Awaiting Search Request</h2>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                            Enter a search parameter above to engage the multi-agent execution pipeline. The network will scrape live results indices, extract prices, and evaluate product sentiments.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}