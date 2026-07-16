import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ChatInterface from '../components/ChatInterface';
import SentimentBanner from '../components/SentimentBanner';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import ComparisonExport from '../components/ComparisonExport';
import { apiService } from '../services/api';

// ─────────────────────────────────────────────
// Star rating helper (for modal)
// ─────────────────────────────────────────────
function StarRatingLarge({ rating }) {
    const filled = Math.round(rating);
    return (
        <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < filled ? 'text-amber-400' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// Product Details Drawer (right-side panel)
// Only uses real backend fields.
// ─────────────────────────────────────────────
function ProductDetailsDrawer({ product, sentimentReport, recommendations, allProducts, onClose }) {
    if (!product) return null;

    const isVerified = Boolean(product.is_verified);
    const isOverBudget = product.status === 'Out of Budget';
    const hasPrice = product.extracted_price != null && product.extracted_price > 0;
    const hasRating = product.rating && product.rating > 0;
    const hasReviews = product.reviews && product.reviews > 0;

    // Price comparison: other real products from current results
    const comparable = allProducts
        .filter(p => p.product_name !== product.product_name && p.extracted_price > 0)
        .sort((a, b) => a.extracted_price - b.extracted_price)
        .slice(0, 5);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#111113] border-l border-slate-800/60 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

                {/* ── Drawer Header ── */}
                <div className="shrink-0 px-5 py-4 border-b border-slate-800/60 bg-[#1a1b1e]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            {/* Verification badge */}
                            {isVerified ? (
                                <div className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Verified Listing — from actual product page</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Approximate Price — from search/category page</span>
                                </div>
                            )}
                            <h2 className="text-sm font-bold text-white leading-snug line-clamp-3">
                                {product.product_name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* Product image — always shown; graceful fallback on error */}
                    <div className="w-full h-44 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                        <img
                            src={product.image_url || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                            alt={product.product_name}
                            className="object-contain w-full h-full p-3"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const parent = e.target.parentNode;
                                if (!parent.querySelector('[data-placeholder]')) {
                                    const ph = document.createElement('div');
                                    ph.setAttribute('data-placeholder', '1');
                                    ph.className = 'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400';
                                    ph.innerHTML = `<svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span style="font-size:11px;margin-top:6px">No image available</span>`;
                                    parent.appendChild(ph);
                                }
                            }}
                        />
                    </div>

                    {/* ── Core listing info ── */}
                    <div className="space-y-3">

                        {/* Brand (brand field — only when non-null) */}
                        {product.brand && (
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {product.brand}
                            </div>
                        )}

                        {/* Marketplace (marketplace field) */}
                        <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-[10px] font-black text-slate-400 uppercase shrink-0">
                                {(product.marketplace || 'W').charAt(0)}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{product.marketplace}</span>
                        </div>

                        {/* Price (extracted_price field) */}
                        {hasPrice && (
                            <div>
                                <div className="text-3xl font-black text-white leading-none">
                                    {product.currency || '₹'}{Number(product.extracted_price).toLocaleString('en-IN')}
                                </div>
                                {!isVerified && (
                                    <div className="text-xs text-amber-500/80 mt-1 font-medium">
                                        ~ Approximate price from search listing
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Budget status (status field) */}
                        <div className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isOverBudget
                                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            }`}>
                            <span>{isOverBudget ? '✗ Over Budget' : '✓ Within Budget'}</span>
                        </div>

                        {/* Rating & Reviews (only when real data exists) */}
                        {hasRating && (
                            <div className="flex items-center space-x-2">
                                <StarRatingLarge rating={product.rating} />
                                <span className="text-sm font-bold text-amber-400">{product.rating.toFixed(1)}</span>
                                {hasReviews && (
                                    <span className="text-xs text-slate-500">
                                        ({product.reviews.toLocaleString()} reviews)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-800/60" />

                    {/* ── AI Market Insights (global sentiment — clearly labelled) ── */}
                    {sentimentReport && (sentimentReport.summary || sentimentReport.pros?.length || sentimentReport.cons?.length) && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                    AI Market Insights
                                </span>
                                <span className="text-[10px] text-slate-600">(market-level, not this listing)</span>
                            </div>

                            {sentimentReport.summary && (
                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-800/40 rounded-xl p-3">
                                    {sentimentReport.summary}
                                </p>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {sentimentReport.pros?.length > 0 && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Praises</div>
                                        <ul className="space-y-1">
                                            {sentimentReport.pros.map((pro, i) => (
                                                <li key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                                                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                                                    <span>{pro}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {sentimentReport.cons?.length > 0 && (
                                    <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Complaints</div>
                                        <ul className="space-y-1">
                                            {sentimentReport.cons.map((con, i) => (
                                                <li key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                                                    <span className="text-rose-500 mt-0.5 shrink-0">✗</span>
                                                    <span>{con}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── AI Agent Recommendations (recommendations[] field) ── */}
                    {recommendations && recommendations.length > 0 && (
                        <>
                            <div className="h-px bg-slate-800/60" />
                            <div className="space-y-2.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                    AI Agent Recommendations
                                </span>
                                <ul className="space-y-2">
                                    {recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 bg-slate-900/40 border border-slate-800/40 rounded-xl p-3">
                                            <span className="text-indigo-400 font-bold mt-0.5 shrink-0 text-xs">{i + 1}.</span>
                                            <span className="leading-relaxed">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* ── Price Comparison (allProducts data) ── */}
                    {comparable.length > 0 && (
                        <>
                            <div className="h-px bg-slate-800/60" />
                            <div className="space-y-2.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Price Comparison
                                </span>
                                <div className="divide-y divide-slate-800/40 rounded-xl overflow-hidden border border-slate-800/40">
                                    {comparable.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-slate-900/30">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <p className="text-xs text-slate-200 truncate">{p.product_name}</p>
                                                <div className="flex items-center space-x-1.5 mt-0.5">
                                                    <p className="text-[10px] text-slate-500">{p.marketplace}</p>
                                                    {p.is_verified && (
                                                        <span className="text-[9px] text-emerald-500 font-bold">✓ Verified</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2.5 shrink-0">
                                                <span className="text-sm font-bold text-white">
                                                    {p.currency || '₹'}{Number(p.extracted_price).toLocaleString('en-IN')}
                                                </span>
                                                {p.url && (
                                                    <a
                                                        href={p.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                                                    >
                                                        View
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Fixed footer: View Product button ── */}
                <div className="shrink-0 px-5 py-4 border-t border-slate-800/60 bg-[#111113]">
                    <a
                        href={product.url || '#'}
                        target={product.url ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={(e) => { if (!product.url) e.preventDefault(); }}
                        className={`flex items-center justify-center w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 ${
                            product.url
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-900/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {product.url
                            ? `🛒 View on ${product.marketplace}`
                            : 'No Product Link Available'
                        }
                    </a>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function UserDashboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuery, setCurrentQuery] = useState('');
    const [activeAgent, setActiveAgent] = useState('');

    // Backend data
    const [priceData, setPriceData] = useState([]);
    const [sentimentReport, setSentimentReport] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [maxBudgetCeiling, setMaxBudgetCeiling] = useState(250000);

    // Filter states — all map to real backend fields
    const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
    const [priceRange, setPriceRange] = useState(250000);
    const [sortBy, setSortBy] = useState('default');
    const [verifiedOnly, setVerifiedOnly] = useState(false);   // → is_verified
    const [inBudgetOnly, setInBudgetOnly] = useState(false);   // → status === "Target Match"

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Selected product for the details drawer
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Reset page on filter/query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentQuery, selectedMarketplaces, priceRange, sortBy, verifiedOnly, inBudgetOnly]);

    // Agent loading indicator cycle
    useEffect(() => {
        let interval;
        if (loading) {
            const agents = [
                'Search Agent — aggregating web results',
                'Intent Router — classifying query context',
                'Price Extraction Agent — parsing structured data',
                'Review Analyzer — running sentiment analysis',
                'Recommendation Agent — computing best matches',
                'Finalizer Agent — packaging response',
            ];
            let idx = 0;
            setActiveAgent(agents[0]);
            interval = setInterval(() => {
                idx = (idx + 1) % agents.length;
                setActiveAgent(agents[idx]);
            }, 2200);
        } else {
            setActiveAgent('');
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleQuerySubmit = async (query) => {
        setLoading(true);
        setError(null);
        setCurrentQuery(query);
        setSelectedProduct(null);

        // Reset filters
        setPriceRange(250000);
        setMaxBudgetCeiling(250000);
        setSelectedMarketplaces([]);
        setSortBy('default');
        setVerifiedOnly(false);
        setInBudgetOnly(false);
        setCurrentPage(1);

        try {
            const data = await apiService.sendChatQuery(query);

            const extractedPrices = data.price_data || [];
            setPriceData(extractedPrices);
            setSentimentReport(data.analysis_report || null);
            setRecommendations(data.recommendations || []);
            setBudgetStatus(data.budget_status || null);

            const validPrices = extractedPrices
                .map(p => p.extracted_price)
                .filter(p => p != null && p > 0);

            const absoluteMax = validPrices.length > 0 ? Math.max(...validPrices) : 250000;
            setMaxBudgetCeiling(absoluteMax);
            setPriceRange(absoluteMax);

        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
            setPriceData([]);
        } finally {
            setLoading(false);
        }
    };

    // Derive available marketplaces dynamically from real data
    const availableMarketplaces = useMemo(() => {
        const stores = new Set();
        priceData.forEach(item => {
            if (item.extracted_price > 0 && item.marketplace) {
                stores.add(item.marketplace);
            }
        });
        return [...stores];
    }, [priceData]);

    // Apply all filters — each maps to a real backend field
    const filteredItems = useMemo(() => {
        return priceData.filter(item => {
            if (!item.extracted_price || item.extracted_price <= 0) return false;
            if (item.extracted_price > priceRange) return false;
            if (selectedMarketplaces.length > 0 && !selectedMarketplaces.includes(item.marketplace)) return false;
            if (verifiedOnly && !item.is_verified) return false;
            if (inBudgetOnly && item.status !== 'Target Match') return false;
            return true;
        });
    }, [priceData, selectedMarketplaces, priceRange, verifiedOnly, inBudgetOnly]);

    // Sort
    const sortedItems = useMemo(() => {
        const base = [...filteredItems];
        if (sortBy === 'price-asc') base.sort((a, b) => a.extracted_price - b.extracted_price);
        else if (sortBy === 'price-desc') base.sort((a, b) => b.extracted_price - a.extracted_price);
        // default: verified listings first, then approximate
        else base.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
        return base;
    }, [filteredItems, sortBy]);

    // Pagination
    const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedItems.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedItems, currentPage]);

    // Verified/approximate counts for the results header
    const verifiedCount = useMemo(() =>
        filteredItems.filter(i => i.is_verified).length,
        [filteredItems]
    );
    const approximateCount = filteredItems.length - verifiedCount;

    const hasBudget = Boolean(budgetStatus?.ceiling);

    return (
        <div className="min-h-screen bg-[#0f1011] text-[#e8eaed] font-sans antialiased">

            {/* Product Details Drawer */}
            {selectedProduct && (
                <ProductDetailsDrawer
                    product={selectedProduct}
                    sentimentReport={sentimentReport}
                    recommendations={recommendations}
                    allProducts={filteredItems}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* ── Navigation Header ── */}
            <header className="bg-[#171717] border-b border-slate-800/60 sticky top-0 z-30 h-14 flex items-center justify-between px-6">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
                        S
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold tracking-tight text-white">SEAMAS</span>
                        <span className="text-indigo-400 font-medium text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                            AI Shopping
                        </span>
                    </div>
                </div>

                {/* Right side: status + export (moved here, secondary position) */}
                <div className="flex items-center space-x-3">
                    {currentQuery && !loading && (
                        <ComparisonExport data={filteredItems} query={currentQuery} />
                    )}
                    <div className="text-[10px] text-slate-600 font-mono hidden sm:block">
                        {loading ? (
                            <span className="text-indigo-400 animate-pulse">Processing...</span>
                        ) : (
                            'System Active'
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ── Search bar ── */}
                <div className="max-w-2xl mx-auto mb-8">
                    <ChatInterface onQuerySubmit={handleQuerySubmit} loading={loading} />
                    {error && (
                        <div className="mt-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 flex items-center space-x-2">
                            <svg className="h-4 w-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* ── Loading indicator ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-5 max-w-sm mx-auto">
                        <div className="relative flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                            <span className="absolute flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                            </span>
                        </div>
                        <div className="text-center space-y-1">
                            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                                <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Active Node</span>
                            </div>
                            <p className="text-sm font-medium text-slate-300">{activeAgent}</p>
                        </div>
                    </div>
                )}

                {/* ── Results layout ── */}
                {!loading && currentQuery && (
                    <>
                        {/* Budget status banner (budget_status field) */}
                        {budgetStatus && (
                            <div className="mb-4 bg-[#171717] border border-slate-800/40 rounded-xl px-4 py-2.5 flex items-center space-x-2.5">
                                <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-slate-400">{budgetStatus.status}</span>
                            </div>
                        )}

                        {/* AI Market Insights */}
                        <SentimentBanner report={sentimentReport} />

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                            {/* Filter sidebar */}
                            <div className="lg:col-span-1 lg:sticky lg:top-20 bg-[#171717] border border-slate-800/40 p-4 rounded-2xl shadow-sm">
                                <FilterSidebar
                                    marketplaces={availableMarketplaces}
                                    selectedMarketplaces={selectedMarketplaces}
                                    setSelectedMarketplaces={setSelectedMarketplaces}
                                    maxPriceLimit={maxBudgetCeiling}
                                    priceRange={priceRange}
                                    setPriceRange={setPriceRange}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    verifiedOnly={verifiedOnly}
                                    setVerifiedOnly={setVerifiedOnly}
                                    inBudgetOnly={inBudgetOnly}
                                    setInBudgetOnly={setInBudgetOnly}
                                    hasBudget={hasBudget}
                                />
                            </div>

                            {/* Product results */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* Results header */}
                                <div className="bg-[#171717] border border-slate-800/40 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <h2 className="text-sm font-bold text-white">
                                            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
                                        </h2>
                                        <div className="flex items-center space-x-3 mt-0.5">
                                            {verifiedCount > 0 && (
                                                <span className="text-[10px] text-emerald-400 font-medium">
                                                    {verifiedCount} verified
                                                </span>
                                            )}
                                            {approximateCount > 0 && (
                                                <span className="text-[10px] text-amber-400 font-medium">
                                                    {approximateCount} approximate
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-600">· Click any card for details</span>
                                        </div>
                                    </div>
                                </div>

                                {filteredItems.length === 0 ? (
                                    <div className="text-center py-14 bg-[#171717] border border-slate-800/30 rounded-2xl">
                                        <div className="text-slate-600 text-xs">
                                            No products match the current filters.
                                            <br />
                                            Try adjusting verification status or price range.
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <ProductGrid items={paginatedItems} onCardClick={setSelectedProduct} />

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center space-x-2 bg-[#171717] border border-slate-800/30 p-3 rounded-2xl">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    Previous
                                                </button>
                                                <div className="flex space-x-1">
                                                    {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${currentPage === i + 1
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'text-slate-400 hover:bg-slate-800'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Empty state ── */}
                {!loading && !currentQuery && (
                    <div className="max-w-lg mx-auto text-center py-24">
                        <div className="h-14 w-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-5">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold text-white mb-2">AI-powered product search</h2>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                            SEAMAS searches across marketplaces, extracts real prices, and distinguishes
                            <span className="text-emerald-400"> verified listings</span> from{' '}
                            <span className="text-amber-400">approximate prices</span> — all powered by local AI agents.
                        </p>

                        {/* Legend */}
                        <div className="mt-6 flex items-center justify-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <div className="h-3 w-1 bg-emerald-500 rounded-full" />
                                <span className="text-[11px] text-slate-500">Verified listing</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-3 w-1 bg-amber-500 rounded-full" />
                                <span className="text-[11px] text-slate-500">Approximate price</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Drawer slide-in animation */}
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to   { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.25s cubic-bezier(0.22, 1, 0.36, 1);
                }
            `}</style>
        </div>
    );
}