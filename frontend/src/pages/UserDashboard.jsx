import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ChatInterface from '../components/ChatInterface';
import SentimentBanner from '../components/SentimentBanner';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import ComparisonExport from '../components/ComparisonExport';
import { apiService } from '../services/api';

// ─────────────────────────────────────────────
// Star Rating (modal)
// ─────────────────────────────────────────────
function StarRatingLarge({ rating }) {
    const filled = Math.round(rating);
    return (
        <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < filled ? 'text-amber-400' : 'text-slate-700'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// Product Details Drawer
// ─────────────────────────────────────────────
function ProductDetailsDrawer({ product, sentimentReport, recommendations, allProducts, onClose }) {
    const [imgError, setImgError] = useState(false);
    if (!product) return null;

    const isVerified   = Boolean(product.is_verified);
    const isOverBudget = product.status === 'Out of Budget';
    const hasPrice     = product.extracted_price != null && product.extracted_price > 0;
    const hasRating    = product.rating && product.rating > 0;
    const hasReviews   = product.reviews && product.reviews > 0;

    const comparable = allProducts
        .filter(p => p.product_name !== product.product_name && p.extracted_price > 0)
        .sort((a, b) => a.extracted_price - b.extracted_price)
        .slice(0, 5);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col overflow-hidden animate-slide-in-right"
                style={{
                    background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a12 100%)',
                    borderLeft: '1px solid rgba(99,102,241,0.15)',
                    boxShadow: '-20px 0 80px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.05)',
                }}>

                {/* Header */}
                <div className="shrink-0 px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            {/* Badge */}
                            {isVerified ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Verified — from actual product page</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
                                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Approximate — from search/category</span>
                                </span>
                            )}
                            <h2 className="text-sm font-bold text-white leading-snug line-clamp-3"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                {product.product_name}
                            </h2>
                        </div>
                        <button onClick={onClose}
                            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                    {/* Product image */}
                    <div className="w-full h-52 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #f8faff, #fff)' }}>
                        {!imgError ? (
                            <img
                                src={product.image_url || ''}
                                alt={product.product_name}
                                className="object-contain w-full h-full p-4"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                                <svg className="h-12 w-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs">No image available</span>
                            </div>
                        )}
                    </div>

                    {/* Core info */}
                    <div className="space-y-4">
                        {/* Marketplace */}
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                                {(product.marketplace || 'W').charAt(0)}
                            </div>
                            <span className="text-sm text-slate-300 font-medium">{product.marketplace}</span>
                        </div>

                        {/* Price */}
                        {hasPrice && (
                            <div>
                                <div className="text-4xl font-black leading-none gradient-text"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {product.currency || '₹'}{Number(product.extracted_price).toLocaleString('en-IN')}
                                </div>
                                {!isVerified && (
                                    <div className="text-xs text-amber-500/80 mt-1.5 font-medium">
                                        ~ Approximate price from search listing
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Budget status */}
                        <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isOverBudget
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`} style={isOverBudget
                            ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
                            : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <span>{isOverBudget ? '✗ Over Budget' : '✓ Within Budget'}</span>
                        </span>

                        {/* Rating */}
                        {hasRating && (
                            <div className="flex items-center space-x-2">
                                <StarRatingLarge rating={product.rating} />
                                <span className="text-sm font-bold text-amber-400">{product.rating.toFixed(1)}</span>
                                {hasReviews && (
                                    <span className="text-xs text-slate-500">({product.reviews.toLocaleString()} reviews)</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

                    {/* AI Market Insights */}
                    {sentimentReport && (sentimentReport.summary || sentimentReport.pros?.length || sentimentReport.cons?.length) && (
                        <div className="space-y-3 p-4 rounded-2xl"
                            style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                            <div className="flex items-center space-x-2">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                        style={{ background: '#818cf8' }} />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                    AI Market Insights
                                </span>
                                <span className="text-[10px] text-slate-600">(market-level)</span>
                            </div>

                            {sentimentReport.summary && (
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {sentimentReport.summary}
                                </p>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {sentimentReport.pros?.length > 0 && (
                                    <div className="space-y-1.5">
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
                                    <div className="space-y-1.5">
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

                    {/* Recommendations */}
                    {recommendations?.length > 0 && (
                        <>
                            <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            <div className="space-y-2.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                    AI Agent Recommendations
                                </span>
                                <ul className="space-y-2">
                                    {recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 p-3 rounded-xl"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span className="text-indigo-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                                            <span className="leading-relaxed">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Price Comparison */}
                    {comparable.length > 0 && (
                        <>
                            <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            <div className="space-y-2.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Price Comparison
                                </span>
                                <div className="space-y-1 rounded-xl overflow-hidden"
                                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {comparable.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2.5"
                                            style={{ borderBottom: i < comparable.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                            <span className="text-xs text-slate-400 truncate max-w-[55%]">{p.marketplace}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-bold text-white">
                                                    ₹{Number(p.extracted_price).toLocaleString('en-IN')}
                                                </span>
                                                {p.url && (
                                                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors"
                                                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                                                        Visit →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* View Product CTA */}
                    {product.url && (
                        <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            View Product on {product.marketplace} →
                        </a>
                    )}
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────
// Agent pipeline steps for loading UI
// ─────────────────────────────────────────────
const AGENT_STEPS = [
    { icon: '🔍', label: 'Search Agent', detail: 'Aggregating web results across stores' },
    { icon: '🧭', label: 'Intent Router', detail: 'Classifying query context and category' },
    { icon: '💹', label: 'Price Extraction Agent', detail: 'Parsing structured pricing data' },
    { icon: '💬', label: 'Review Analyzer', detail: 'Running sentiment analysis' },
    { icon: '🤖', label: 'Recommendation Agent', detail: 'Computing best matches for you' },
    { icon: '📦', label: 'Finalizer Agent', detail: 'Packaging AI response' },
];

// ─────────────────────────────────────────────
// Loading Indicator
// ─────────────────────────────────────────────
function AgentLoadingScreen({ activeAgent }) {
    const currentStepIdx = AGENT_STEPS.findIndex(s => activeAgent.toLowerCase().includes(s.label.toLowerCase().split(' ')[0].toLowerCase()));
    const stepIdx = currentStepIdx >= 0 ? currentStepIdx : 0;

    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 max-w-sm mx-auto animate-fade-in">
            {/* Orbiting glow */}
            <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-glow-pulse"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(99,102,241,0.15)', borderTopColor: '#6366f1' }} />
                <div className="absolute inset-3 rounded-full border animate-spin"
                    style={{ borderColor: 'rgba(139,92,246,0.1)', borderTopColor: '#8b5cf6', animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <span className="text-2xl z-10">{AGENT_STEPS[stepIdx].icon}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                        Active Node
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{stepIdx + 1}/{AGENT_STEPS.length}</span>
                </div>
                <div className="h-1 w-full rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full animate-progress-bar"
                        style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)' }} />
                </div>
            </div>

            {/* Step list */}
            <div className="w-full space-y-2">
                {AGENT_STEPS.map((step, i) => {
                    const isDone    = i < stepIdx;
                    const isActive  = i === stepIdx;
                    const isPending = i > stepIdx;
                    return (
                        <div key={i}
                            className="flex items-center space-x-3 py-2 px-3 rounded-xl transition-all duration-300"
                            style={{
                                background: isActive
                                    ? 'rgba(99,102,241,0.1)'
                                    : 'transparent',
                                border: isActive
                                    ? '1px solid rgba(99,102,241,0.2)'
                                    : '1px solid transparent',
                                opacity: isPending ? 0.35 : 1,
                            }}>
                            <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                                {isDone ? (
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : isActive ? (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-indigo-400" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                                    </span>
                                ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-700" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className={`text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {step.label}
                                </div>
                                {isActive && (
                                    <div className="text-[10px] text-slate-500 animate-fade-in">{step.detail}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Empty State Hero
// ─────────────────────────────────────────────
function EmptyStateHero() {
    return (
        <div className="relative max-w-2xl mx-auto text-center py-20 overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full animate-glow-pulse pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full animate-glow-pulse pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.04) 0%, transparent 70%)', animationDelay: '2s' }} />

            {/* Icon */}
            <div className="relative mx-auto mb-8 w-20 h-20 animate-float">
                <div className="absolute inset-0 rounded-2xl animate-glow-pulse"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />
                <div className="relative w-full h-full rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <svg className="w-9 h-9 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-bold mb-3 gradient-text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                AI-Powered Product Search
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
                SEAMAS searches across every major Indian marketplace — extracting real prices,
                distinguishing{' '}
                <span style={{ color: '#34d399', fontWeight: 600 }}>verified listings</span>{' '}
                from{' '}
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>approximate prices</span>
                {' '}— all powered by local AI agents.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                    { icon: '⚡', text: 'Real-time price extraction' },
                    { icon: '🤖', text: 'Multi-agent analysis' },
                    { icon: '✓',  text: 'Verified listings only' },
                    { icon: '💡', text: 'AI recommendations' },
                ].map(f => (
                    <span key={f.text} className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                        <span>{f.icon}</span>
                        <span>{f.text}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function UserDashboard() {
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState(null);
    const [currentQuery, setCurrentQuery]         = useState('');
    const [activeAgent, setActiveAgent]           = useState('');

    // Backend data
    const [priceData, setPriceData]               = useState([]);
    const [sentimentReport, setSentimentReport]   = useState(null);
    const [recommendations, setRecommendations]   = useState([]);
    const [budgetStatus, setBudgetStatus]         = useState(null);
    const [maxBudgetCeiling, setMaxBudgetCeiling] = useState(250000);

    // Filter states
    const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
    const [priceRange, setPriceRange]             = useState(250000);
    const [sortBy, setSortBy]                     = useState('default');
    const [verifiedOnly, setVerifiedOnly]         = useState(false);
    const [inBudgetOnly, setInBudgetOnly]         = useState(false);

    // Pagination
    const [currentPage, setCurrentPage]           = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Selected product for drawer
    const [selectedProduct, setSelectedProduct]   = useState(null);

    // Reset page on filter/query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentQuery, selectedMarketplaces, priceRange, sortBy, verifiedOnly, inBudgetOnly]);

    // Agent loading indicator cycle
    useEffect(() => {
        let interval;
        if (loading) {
            const agents = AGENT_STEPS.map(s => s.label + ' — ' + s.detail);
            let idx = 0;
            setActiveAgent(agents[0]);
            interval = setInterval(() => {
                idx = (idx + 1) % agents.length;
                setActiveAgent(agents[idx]);
            }, 2500);
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

    const availableMarketplaces = useMemo(() => {
        const stores = new Set();
        priceData.forEach(item => {
            if (item.extracted_price > 0 && item.marketplace) stores.add(item.marketplace);
        });
        return [...stores];
    }, [priceData]);

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

    const sortedItems = useMemo(() => {
        const base = [...filteredItems];
        if (sortBy === 'price-asc')  base.sort((a, b) => a.extracted_price - b.extracted_price);
        else if (sortBy === 'price-desc') base.sort((a, b) => b.extracted_price - a.extracted_price);
        else base.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
        return base;
    }, [filteredItems, sortBy]);

    const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedItems.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedItems, currentPage]);

    const verifiedCount    = useMemo(() => filteredItems.filter(i => i.is_verified).length, [filteredItems]);
    const approximateCount = filteredItems.length - verifiedCount;
    const hasBudget        = Boolean(budgetStatus?.ceiling);

    return (
        <div className="min-h-screen mesh-bg text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

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
            <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6"
                style={{
                    background: 'rgba(10,10,15,0.85)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                {/* Logo */}
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-base"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                        S
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold tracking-tight text-white"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SEAMAS</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                            AI Shopping
                        </span>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center space-x-3">
                    {currentQuery && !loading && (
                        <ComparisonExport data={filteredItems} query={currentQuery} />
                    )}
                    <div className="hidden sm:flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'animate-ping bg-indigo-400' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-mono text-slate-600">
                            {loading ? 'Processing…' : 'System Active'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* ── Search Hero ── */}
                <div className="max-w-2xl mx-auto mb-10">
                    <ChatInterface onQuerySubmit={handleQuerySubmit} loading={loading} />
                    {error && (
                        <div className="mt-4 px-4 py-3 rounded-xl flex items-center space-x-3 animate-slide-up"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <svg className="h-4 w-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm text-rose-400">{error}</span>
                        </div>
                    )}
                </div>

                {/* ── Loading ── */}
                {loading && <AgentLoadingScreen activeAgent={activeAgent} />}

                {/* ── Results ── */}
                {!loading && currentQuery && (
                    <div className="animate-fade-in">
                        {/* Budget banner */}
                        {budgetStatus && (
                            <div className="mb-5 px-4 py-3 rounded-2xl flex items-center space-x-3"
                                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-300">{budgetStatus.status}</span>
                            </div>
                        )}

                        {/* Sentiment Banner */}
                        <SentimentBanner report={sentimentReport} />

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                            {/* Filter sidebar */}
                            <div className="lg:col-span-1 lg:sticky lg:top-20 rounded-2xl p-4"
                                style={{ background: 'rgba(14,14,22,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
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

                            {/* Results */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* Results header */}
                                <div className="px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                    style={{ background: 'rgba(14,14,22,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <h2 className="text-sm font-bold text-white"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
                                        </h2>
                                        <div className="flex items-center space-x-3 mt-0.5">
                                            {verifiedCount > 0 && (
                                                <span className="text-[11px] font-medium" style={{ color: '#34d399' }}>
                                                    {verifiedCount} verified
                                                </span>
                                            )}
                                            {approximateCount > 0 && (
                                                <span className="text-[11px] font-medium" style={{ color: '#fbbf24' }}>
                                                    {approximateCount} approximate
                                                </span>
                                            )}
                                            <span className="text-[11px] text-slate-600">· Click any card for details</span>
                                        </div>
                                    </div>
                                </div>

                                {filteredItems.length === 0 ? (
                                    <div className="text-center py-14 rounded-2xl"
                                        style={{ background: 'rgba(14,14,22,0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <p className="text-slate-500 text-sm">No products match the current filters.</p>
                                        <p className="text-slate-600 text-xs mt-1">Try adjusting verification status or price range.</p>
                                    </div>
                                ) : (
                                    <>
                                        <ProductGrid items={paginatedItems} onCardClick={setSelectedProduct} />

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center space-x-2 p-3 rounded-2xl"
                                                style={{ background: 'rgba(14,14,22,0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}
                                                >
                                                    ← Prev
                                                </button>
                                                <div className="flex space-x-1">
                                                    {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className="h-8 w-8 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center"
                                                            style={currentPage === i + 1 ? {
                                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                color: '#fff',
                                                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                                            } : {
                                                                background: 'transparent',
                                                                color: '#475569',
                                                            }}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading && !currentQuery && <EmptyStateHero />}
            </main>
        </div>
    );
}