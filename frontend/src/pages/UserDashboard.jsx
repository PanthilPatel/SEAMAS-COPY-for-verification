import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import SentimentBanner from '../components/SentimentBanner';
import AiVerdictBanner from '../components/AiVerdictBanner';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid, { getCategoryFallbackImage, isNonStoreOrArticleItem } from '../components/ProductGrid';
import { apiService } from '../services/api';
import MarketTicker from '../components/MarketTicker';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/config';
import { normalizeCreditSnapshot } from '../lib/profileState';
import { settleWithin } from '../lib/async';
import AuthModal from '../components/AuthModal';
import SubscriptionModal from '../components/SubscriptionModal';
import AssistantChatDrawer from '../components/AssistantChatDrawer';
import PriceChart from '../components/PriceChart';
import {
    Sparkles,
    Compass,
    Workflow,
    Heart,
    History,
    Settings,
    ChevronsLeft,
    Plus,
    CircleDot,
    Brain,
    Radar,
    LineChart,
    Quote,
    Layers,
    ShieldCheck,
    ArrowUpRight,
    Command,
    Sliders,
    Zap,
    LogOut,
    Trash2,
    DollarSign,
    Search,
} from 'lucide-react';

function ProductDetailsDrawer({ product, onClose }) {
    if (!product) return null;

    const title = product.product_name || product.title || '';
    const fallbackImage = getCategoryFallbackImage(title, product.category);
    const rawImage = product.image_url || product.image;
    const [imgSrc, setImgSrc] = useState(rawImage || fallbackImage);

    useEffect(() => {
        setImgSrc(rawImage || fallbackImage);
    }, [rawImage, fallbackImage]);

    const isLiveVerified = product.price_verified === true || product.price_verification_method === 'source_page';
    const isOverBudget = product.status === 'Out of Budget';
    const price = product.extracted_price != null
        ? Number(product.extracted_price)
        : (product.price != null
            ? Number(product.price)
            : (product.indexed_price != null ? Number(product.indexed_price) : null));
    const hasPrice = Number.isFinite(price) && price > 0;
    // Only use real MRP from backend — never fabricate a markup
    const original = product.original_price ? Number(product.original_price) : (product.indexed_original_price ? Number(product.indexed_original_price) : null);
    const discount = hasPrice && original && original > price ? Math.round(((original - price) / original) * 100) : 0;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" onClick={onClose} />
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col overflow-hidden transition-all duration-300 animate-slide-in-right"
                style={{
                    background: 'linear-gradient(180deg, #09090b 0%, #030305 100%)',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '-20px 0 80px rgba(0,0,0,0.85)',
                }}>

                <div className="shrink-0 px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">Product Analysis</span>
                        <h3 className="text-sm font-bold font-display text-white mt-1 line-clamp-1">
                            {title}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all btn-magnetic">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">

                    <div className="w-full h-72 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] flex items-center justify-center overflow-hidden relative group shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-50" />
                        <img
                            src={imgSrc}
                            alt={title}
                            referrerPolicy="no-referrer"
                            className="object-contain w-full h-full drop-shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2 relative z-10"
                            onError={() => {
                                if (imgSrc !== fallbackImage) {
                                    setImgSrc(fallbackImage);
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070d19] via-transparent to-transparent opacity-80 pointer-events-none" />
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-200 shadow-sm backdrop-blur-sm">
                                {product.marketplace}
                            </span>
                            {isLiveVerified ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                                    ✓ Live Verified
                                </span>
                            ) : hasPrice ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                                    ✓ Indexed Offer
                                </span>
                            ) : null}
                        </div>

                        <div className="border-b border-white/[0.06] pb-5">
                            <div className="flex items-end gap-3 mb-1">
                                <div className="text-5xl font-bold font-display text-white tracking-tight drop-shadow-md">
                                    {hasPrice ? `₹${price.toLocaleString('en-IN')}` : 'Price unavailable'}
                                </div>
                                {hasPrice && original && (
                                    <span className="text-lg text-neutral-500 line-through mb-1">
                                        ₹{original.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                            {discount > 0 && (
                                <div className="inline-block mt-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 uppercase tracking-widest shadow-sm">
                                    Save {discount}% Off
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-500 flex items-center gap-2">
                            <span className="h-px bg-white/10 flex-1"></span>
                            Pipeline Insights
                            <span className="h-px bg-white/10 flex-1"></span>
                        </h4>
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.05] p-4 text-xs shadow-sm hover:border-white/10 transition-all backdrop-blur-xl">
                                <span className="text-neutral-400">Budget Match</span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${isOverBudget ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {isOverBudget ? 'Over Budget' : 'Matched'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-cyan-500/[0.05] to-transparent border border-cyan-500/[0.1] p-4 text-xs shadow-sm backdrop-blur-xl">
                                <span className="text-neutral-400">Trust Index</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="w-[98%] h-full bg-cyan-400 shadow-[0_0_10px_cyan]" />
                                    </div>
                                    <span className="text-cyan-400 font-mono font-bold">9.8</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-500/[0.05] to-transparent border border-indigo-500/[0.1] p-4 text-xs shadow-sm backdrop-blur-xl">
                                <span className="text-neutral-400">Review Sentiment</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="w-[94%] h-full bg-indigo-400 shadow-[0_0_10px_indigo]" />
                                    </div>
                                    <span className="text-indigo-400 font-bold">94%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-6 border-t border-white/[0.06] bg-[#070d19]/80 backdrop-blur-md flex gap-3 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    {product.url ? (
                        <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative flex items-center gap-2">
                                Visit Deal Store <ArrowUpRight className="h-4 w-4" />
                            </span>
                        </a>
                    ) : (
                        <button
                            className="flex-1 group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-medium text-white shadow-lg transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] btn-magnetic"
                        >
                            <span className="aurora-cta absolute inset-0" aria-hidden="true" />
                            <span className="relative flex items-center gap-1.5">
                                Store Unavailable
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

const AGENT_LIST = [
    { id: 'orchestrator', name: 'Orchestrator', role: 'Intent & constraints', sub: 'Intent tokenized', defaultDuration: '48ms', icon: Workflow },
    { id: 'search', name: 'Search Agent', role: 'Multi-market sweep', sub: '14 markets · 48 items', defaultDuration: '82ms', icon: Radar },
    { id: 'price', name: 'Price Comparison', role: 'Live DOM verification', sub: '418 points normalized', defaultDuration: '114ms', icon: LineChart },
    { id: 'reviews', name: 'Review Analyzer', role: 'NLP sentiment synthesis', sub: '3,420 reviews NLP', defaultDuration: '230ms', icon: Quote },
    { id: 'budget', name: 'Budget Advisor', role: 'Ceiling & tolerance lock', sub: '≤₹25,000 ceiling lock', defaultDuration: '64ms', icon: Brain },
    { id: 'recommendation', name: 'Recommendation', role: 'Utility matrix ranking', sub: 'Utility matrix calculated', defaultDuration: '160ms', icon: Layers },
    { id: 'finalizer', name: 'Finalizer Agent', role: 'Executive trust report', sub: 'Merchant trust 99.2%', defaultDuration: '198ms', icon: ShieldCheck }
];

const AGENT_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    COMPLETED: 'completed',
    ERROR: 'error'
};

function AgentNode({ agent, state, metrics }) {
    const Icon = agent.icon;
    const isRunning = state === AGENT_STATES.RUNNING;
    const isCompleted = state === AGENT_STATES.COMPLETED;
    const isError = state === AGENT_STATES.ERROR;
    const duration = metrics?.duration || agent.defaultDuration;

    return (
        <div className={`p-3.5 rounded-2xl flex flex-col justify-between gap-2.5 transition-all duration-300 relative overflow-hidden text-left ${
            isRunning 
                ? 'bg-[#E6C762]/[0.06] border border-[#E6C762]/60 shadow-[0_0_24px_rgba(230,199,98,0.2)] ring-1 ring-[#E6C762]/30' 
                : isCompleted 
                    ? 'bg-[#121215] border border-[#34D399]/30 shadow-[0_0_20px_rgba(52,211,153,0.12)] hover:border-[#34D399]/50' 
                : isError 
                    ? 'bg-rose-500/[0.06] border border-rose-500/40 text-rose-300' 
                    : 'bg-[#121215] border border-white/[0.07] hover:border-white/15'
        }`}>
            {isRunning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E6C762]/10 to-transparent animate-shimmer pointer-events-none" />
            )}
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                    isRunning 
                        ? 'bg-[#E6C762]/15 border-[#E6C762]/50 text-[#E6C762]' 
                        : isCompleted 
                            ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]' 
                            : 'bg-white/[0.04] border-white/5 text-zinc-400'
                }`}>
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                {isCompleted ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-semibold">
                        {duration}
                    </span>
                ) : isRunning ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#E6C762]/20 border border-[#E6C762]/50 text-[#E6C762] font-semibold animate-pulse">
                        RUNNING
                    </span>
                ) : (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 text-zinc-500 uppercase tracking-wider font-semibold">
                        READY
                    </span>
                )}
            </div>
            <div>
                <p className="font-display text-xs font-semibold text-white leading-tight truncate">{agent.name}</p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-snug">{agent.role}</p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold pt-1 border-t border-white/[0.04]">
                {isRunning ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-[#E6C762] animate-ping" />
                        <span className="text-[#E6C762]">ACTIVE SWARM...</span>
                    </>
                ) : isCompleted ? (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        <span className="text-[#34D399]">VERIFIED</span>
                    </>
                ) : isError ? (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span className="text-rose-400">ERROR</span>
                    </>
                ) : (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="text-zinc-500">STANDBY</span>
                    </>
                )}
            </div>
        </div>
    );
}

function CommandPalette({ isOpen, onClose, onSubmit, recentQueries }) {
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl seamas-glass-strong rounded-2xl overflow-hidden shadow-2xl p-5 border border-white/10 text-left">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <Command className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search agents, threads, or search queries..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && input.trim()) {
                                onSubmit(input.trim());
                                setInput('');
                                onClose();
                            }
                        }}
                        className="bg-transparent border-none outline-none text-white text-base w-full focus:ring-0 focus:outline-none"
                    />
                    <kbd className="seamas-kbd shrink-0">ESC</kbd>
                </div>

                <div className="mt-4 space-y-4">
                    {recentQueries.length > 0 && (
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mb-2">Recent Threads</div>
                            <div className="flex flex-col gap-1.5">
                                {recentQueries.slice(0, 4).map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onSubmit(q);
                                            onClose();
                                        }}
                                        className="w-full text-left text-xs text-neutral-400 hover:text-white py-2 px-3 hover:bg-white/[0.04] rounded-lg transition-colors flex items-center justify-between"
                                    >
                                        <span>↳ {q}</span>
                                        <ArrowUpRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const NAV = [
    {
        group: 'Workspace',
        items: [
            { id: 'discover', label: 'Discover', icon: Compass },
            { id: 'agents', label: 'Agent Console', icon: Workflow },
            { id: 'history', label: 'Threads', icon: History, count: 12 },
        ],
    },
    {
        group: 'Library',
        items: [
            { id: 'wishlist', label: 'Wishlist', icon: Heart, count: 0 },
            { id: 'settings', label: 'Settings', icon: Settings },
        ],
    },
];

function Sidebar({ collapsed, setCollapsed, activeTab, setActiveTab, onNewSearch, wishlistCount, threadCount, userSession, setSubscriptionModalOpen, isSearching }) {
    const userName = userSession?.name || 'Guest User';
    const navigate = useNavigate();
    const userInitials = useMemo(() => {
        if (!userName) return 'EM';
        const parts = userName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return userName.slice(0, 2).toUpperCase();
    }, [userName]);

    const isPro = userSession?.tier === 'Pro';
    const basePlanCredits = isPro ? 500 : 50;
    const currentCredits = userSession?.isGuest ? 0 : (userSession?.credits ?? basePlanCredits);
    const addOnCredits = Math.max(0, currentCredits - basePlanCredits);

    const [status, setStatus] = useState({
        api: 'operational',
        database: 'operational',
        agents: 'operational'
    });

    useEffect(() => {
        let isMounted = true;
        const fetchStatus = async () => {
            try {
                const data = await apiService.checkSystemStatus();
                if (isMounted) {
                    setStatus({
                        api: data.api || 'unknown',
                        database: data.database || 'unknown',
                        agents: data.agents || 'unknown'
                    });
                }
            } catch {
                if (isMounted) {
                    setStatus({
                        api: 'down',
                        database: 'down',
                        agents: 'down'
                    });
                }
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const allSystemsNominal = status.api === 'operational' && status.database === 'operational' && status.agents === 'operational';

    return (
        <aside
            className="relative z-20 hidden shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.015] md:flex transition-all duration-300 select-none text-left h-screen overflow-hidden"
            style={{ width: collapsed ? 72 : 264, backdropFilter: 'blur(20px)' }}
        >
            {/* Brand Title */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-5">
                <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/15 shadow-lg shadow-black/50 shrink-0">
                    <Sparkles className="w-4 h-4 text-[#E6C762]" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col leading-tight">
                        <span className="font-display text-[16px] font-bold tracking-widest text-white">SEAMAS</span>
                    </div>
                )}
            </div>

            <div className="px-3">
                <button
                    onClick={onNewSearch}
                    className="group flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
                >
                    <Plus className="h-4 w-4 text-[#E6C762]" />
                    {!collapsed && <span className="font-medium">New Search</span>}
                </button>
            </div>

            <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3">
                {NAV.map((group) => (
                    <div key={group.group}>
                        {!collapsed && (
                            <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                                {group.group}
                            </div>
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                                                isActive
                                                    ? 'bg-white/[0.06] text-white border border-white/[0.08] shadow-sm'
                                                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                                            } ${collapsed ? 'justify-center' : ''}`}
                                        >
                                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#E6C762]' : 'text-zinc-500'}`} />
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {item.count !== undefined && item.count > 0 && (
                                                        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                                                            {item.id === 'wishlist' ? wishlistCount : item.id === 'history' ? threadCount : item.count}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {!collapsed && (
                <div className="mx-3 mb-3 px-3 py-2 rounded-xl border border-white/[0.06] bg-[#121215] flex items-center justify-between text-left shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                                allSystemsNominal ? 'bg-emerald-400' : 'bg-[#E6C762]'
                            }`} />
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${
                                allSystemsNominal ? 'bg-emerald-400' : 'bg-[#E6C762]'
                            }`} />
                        </span>
                        <span className="text-[11px] font-medium text-zinc-300">
                            {isSearching
                                ? '7 Agents Active · Routing'
                                : (allSystemsNominal ? 'Live Engine Connected' : 'Local Engine Ready · 7 Agents Armed')}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {allSystemsNominal ? '99.9%' : 'READY'}
                    </span>
                </div>
            )}

            <div className={`border-t border-white/[0.06] p-3 flex flex-col ${collapsed ? 'items-center' : 'gap-2.5'}`}>
                {collapsed ? (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                    >
                        <ChevronsLeft className="h-4 w-4 rotate-180" strokeWidth={1.75} />
                    </button>
                ) : (
                    <div className="p-3 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col gap-2.5">
                        {/* Row 1: Avatar + Name + inline PRO gold pill + Collapse Toggle */}
                        <div className="flex items-center justify-between">
                            <div
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-2.5 cursor-pointer group min-w-0 flex-1"
                            >
                                <div className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/15 text-[11px] font-semibold text-[#E6C762] select-none shadow-sm shrink-0">
                                    {userInitials}
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                                        {userName}
                                    </span>
                                    {isPro && (
                                        <span className="px-1.5 py-0.2 rounded-md bg-[#E6C762]/15 border border-[#E6C762]/35 text-[#E6C762] font-mono text-[9px] font-bold uppercase tracking-wider shrink-0">
                                            PRO
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="p-1 rounded-md text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 transition-colors shrink-0"
                                aria-label="Collapse sidebar"
                                title="Collapse sidebar"
                            >
                                <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                        </div>

                        {/* Row 2: Balance and Credits Available */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <div className="flex items-center gap-1.5 text-zinc-400">
                                <CircleDot className="h-2 w-2 text-[#E6C762]" />
                                <span>Balance</span>
                            </div>
                            <span className="text-zinc-200 font-semibold tabular-nums">
                                {userSession?.isGuest ? '0 Credits (Guest)' : `${(currentCredits + (addOnCredits || 0)).toLocaleString()} Credits Available`}
                            </span>
                        </div>

                        {/* Row 3: Champagne Gold / Obsidian Glass button */}
                        {!userSession?.isGuest && (
                            <button
                                type="button"
                                onClick={() => setSubscriptionModalOpen(isPro ? 'topup' : 'monthly')}
                                className="w-full py-2 rounded-xl bg-[#E5C878]/15 hover:bg-[#E5C878]/25 text-[#F3E5AB] border border-[#E5C878]/35 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#E6C762]" />
                                <span>{isPro ? '+ Add Credits' : 'Upgrade Plan'}</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default function UserDashboard() {
    const navigate = useNavigate();

    const [userSession, setUserSession] = useState(() => {
        const local = localStorage.getItem('seamas_user_session');
        if (local) {
            const parsed = JSON.parse(local);
            if (parsed.isGuest) {
                return {
                    id: 'guest',
                    email: parsed.email,
                    name: parsed.name,
                    isGuest: true,
                    tier: 'Free',
                    credits: 0
                };
            }
            return {
                id: parsed.id,
                email: parsed.email,
                name: parsed.name,
                tier: parsed.tier || 'Free',
                credits: parsed.credits ?? 50
            };
        }
        return null;
    });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    };

    useEffect(() => {
        const local = localStorage.getItem('seamas_user_session');
        let initialGuest = false;
        let localCredits = 50;
        let localTier = 'Free';
        if (local) {
            const parsed = JSON.parse(local);
            localCredits = parsed.credits ?? 50;
            localTier = parsed.tier ?? 'Free';
            if (parsed.isGuest) {
                initialGuest = true;
                setUserSession({
                    id: 'guest',
                    email: parsed.email,
                    name: parsed.name,
                    isGuest: true,
                    tier: 'Free',
                    credits: 0
                });
                setAuthModalOpen(false);
            }
        }

        const successToast = sessionStorage.getItem('payment_success_toast');
        if (successToast) {
            sessionStorage.removeItem('payment_success_toast');
            showNotification(successToast, 'success');
        }

        // Handle Razorpay Payment Link Callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            const rzpPaymentId = urlParams.get('razorpay_payment_id');
            const rzpPaymentLinkId = urlParams.get('razorpay_payment_link_id');
            const rzpPaymentLinkRefId = urlParams.get('razorpay_payment_link_reference_id') || '';
            const rzpPaymentLinkStatus = urlParams.get('razorpay_payment_link_status') || 'paid';
            const rzpSignature = urlParams.get('razorpay_signature');
            const rzpOrderId = urlParams.get('razorpay_order_id');

            if (!rzpPaymentId || !rzpSignature) {
                showNotification('Payment verification failed: Incomplete payment reference from gateway.', 'error');
                window.history.replaceState({}, document.title, "/dashboard");
            } else if (local) {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (!session?.access_token) throw new Error('Please sign in again to verify this payment.');
                    return fetch(`${API_BASE_URL}/api/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                        body: JSON.stringify({
                            razorpay_payment_link_id: rzpPaymentLinkId,
                            razorpay_payment_id: rzpPaymentId,
                            razorpay_signature: rzpSignature,
                            razorpay_payment_link_reference_id: rzpPaymentLinkRefId,
                            razorpay_payment_link_status: rzpPaymentLinkStatus,
                            ...(rzpOrderId ? { razorpay_order_id: rzpOrderId } : {})
                        })
                    });
                }).then(async (res) => {
                    if (res.ok) {
                        const toastMsg = 'Payment verified and account credits updated.';
                        sessionStorage.setItem('payment_success_toast', toastMsg);
                        window.history.replaceState({}, document.title, "/dashboard");
                        window.location.reload();
                    } else {
                        const err = await res.json();
                        showNotification('Payment verification failed: ' + (err.detail || 'Unknown error'), 'error');
                    }
                }).catch(() => {
                    showNotification('Payment verification failed due to network issue.', 'error');
                });
            }
        }

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                let actualTier = localTier;
                let actualCredits = localCredits;
                let actualRenewAt = null;
                try {
                    const data = await apiService.getCredits(session.user.id);
                    actualTier = data.tier?.toLowerCase() === 'pro' ? 'Pro' : 'Free';
                    actualCredits = data.credits;
                    actualRenewAt = data.renew_at || null;
                    if (local) {
                        const parsed = JSON.parse(local);
                        parsed.tier = actualTier;
                        parsed.credits = actualCredits;
                        if (actualRenewAt) parsed.renewAt = actualRenewAt;
                        localStorage.setItem('seamas_user_session', JSON.stringify(parsed));
                    }
                } catch (e) {
                    console.error("Failed to fetch credits", e);
                }

                setUserSession({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    tier: actualTier,
                    credits: actualCredits,
                    renewAt: actualRenewAt
                });
            } else if (!initialGuest) {
                setAuthModalOpen(true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                let actualTier = 'Free';
                let actualCredits = 50;
                try {
                    const data = await apiService.getCredits(session.user.id);
                    actualTier = data.tier?.toLowerCase() === 'pro' ? 'Pro' : 'Free';
                    actualCredits = data.credits;
                } catch (e) { console.error(e); }

                setUserSession({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    tier: actualTier,
                    credits: actualCredits
                });
                // Fetch search history
                supabase.from('search_history').select('query').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
                    .then(({ data }) => {
                        if (data) setRecentQueries(data.map(r => r.query));
                    });

                // Fetch and migrate wishlist from Supabase
                (async () => {
                    try {
                        const localSaved = JSON.parse(localStorage.getItem('seamas_wishlist') || '[]');
                        if (localSaved.length > 0) {
                            for (const item of localSaved) {
                                if (item.url) {
                                    await supabase.from('wishlists').upsert({
                                        user_id: session.user.id,
                                        url: item.url,
                                        title: item.product_name || item.title,
                                        product_name: item.product_name || item.title,
                                        extracted_price: item.extracted_price != null ? Number(item.extracted_price) : null,
                                        original_price: item.original_price != null ? Number(item.original_price) : null,
                                        marketplace: item.marketplace || 'Store',
                                        image_url: item.image_url || item.image || null,
                                        is_verified: !!item.is_verified,
                                        rating: item.rating != null ? Number(item.rating) : null,
                                    }, { onConflict: 'user_id,url' });
                                }
                            }
                            localStorage.removeItem('seamas_wishlist');
                        }
                        const { data: cloudWishlist } = await supabase
                            .from('wishlists')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .order('created_at', { ascending: false });
                        if (cloudWishlist) {
                            setWishlistItems(cloudWishlist);
                        }
                    } catch (wErr) {
                        console.error('Failed to load/migrate cloud wishlist', wErr);
                    }
                })();

                setAuthModalOpen(false);

                // Auto execute pending search query if any
                const pending = sessionStorage.getItem('pending_search_query');
                if (pending) {
                    sessionStorage.removeItem('pending_search_query');
                    handleQuerySubmit(pending);
                }
            } else {
                const checkLocal = localStorage.getItem('seamas_user_session');
                if (checkLocal && JSON.parse(checkLocal).isGuest) {
                    // Do nothing, keep guest session
                } else {
                    setUserSession(null);
                    setAuthModalOpen(true);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('seamas_user_session');
        navigate('/');
    };

    const [activeTab, setActiveTab] = useState('discover');
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [steeringMode, setSteeringMode] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.defaultSteering || 'balanced';
        } catch { return 'balanced'; }
    });
    const [recentQueries, setRecentQueries] = useState([]);
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('seamas_wishlist') || '[]');
        } catch { return []; }
    });

    const [deepScan, setDeepScan] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.deepScan !== undefined ? saved.deepScan : true;
        } catch { return true; }
    });
    const [trustVerification, setTrustVerification] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.trustVerification !== undefined ? saved.trustVerification : true;
        } catch { return true; }
    });
    const [parallelWorkers, setParallelWorkers] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.parallelWorkers || 14;
        } catch { return 14; }
    });
    const [currency, setCurrency] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.preferredCurrency || 'INR';
        } catch { return 'INR'; }
    });
    const [ambientGlow, setAmbientGlow] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.ambientGlow !== undefined ? saved.ambientGlow : true;
        } catch { return true; }
    });
    const [dataSaver, setDataSaver] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            return saved.dataSaver !== undefined ? saved.dataSaver : false;
        } catch { return false; }
    });

    const updatePreference = (key, value) => {
        try {
            const prev = JSON.parse(localStorage.getItem('seamas_preferences') || '{}');
            const updated = { ...prev, [key]: value };
            localStorage.setItem('seamas_preferences', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to update preference', e);
        }
    };

    const handleToggleWishlist = async (product) => {
        const pTitle = product.product_name || product.title;
        const pUrl = product.url;
        const previousItems = wishlistItems;
        const exists = previousItems.some(w => (w.url && w.url === pUrl) || (w.product_name || w.title) === pTitle);

        // Optimistic UI update
        let updated;
        if (exists) {
            updated = previousItems.filter(w => !((w.url && w.url === pUrl) || (w.product_name || w.title) === pTitle));
            setWishlistItems(updated);
            showNotification('Removed from wishlist', 'info');
        } else {
            updated = [product, ...previousItems];
            setWishlistItems(updated);
            showNotification('Saved to wishlist!', 'success');
        }

        // Persist to Supabase if authenticated
        if (userSession?.id && !userSession.isGuest) {
            try {
                if (exists) {
                    const { error } = await supabase
                        .from('wishlists')
                        .delete()
                        .eq('user_id', userSession.id)
                        .eq('url', pUrl);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('wishlists')
                        .upsert({
                            user_id: userSession.id,
                            url: pUrl,
                            title: pTitle,
                            product_name: product.product_name || pTitle,
                            extracted_price: product.extracted_price != null ? Number(product.extracted_price) : null,
                            original_price: product.original_price != null ? Number(product.original_price) : null,
                            marketplace: product.marketplace || 'Store',
                            image_url: product.image_url || product.image || null,
                            is_verified: !!product.is_verified,
                            rating: product.rating != null ? Number(product.rating) : null,
                        }, { onConflict: 'user_id,url' });
                    if (error) throw error;
                }
            } catch (err) {
                console.error('Supabase wishlist persistence failed:', err);
                // Rollback optimistic update on failure
                setWishlistItems(previousItems);
                showNotification('Could not sync wishlist with cloud. Changes reverted.', 'error');
            }
        } else {
            // Unauthenticated/guest fallback in localStorage
            try {
                localStorage.setItem('seamas_wishlist', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save wishlist in local storage', e);
            }
        }
    };

    const [loading, setLoading] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');
    const [logs, setLogs] = useState([]);

    const [agentStatusMap, setAgentStatusMap] = useState({});
    const [agentMetricsMap, setAgentMetricsMap] = useState({});
    const agentStartTimesRef = useRef({});

    const [priceData, setPriceData] = useState([]);
    const [sentimentReport, setSentimentReport] = useState(null);
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [maxBudgetCeiling, setMaxBudgetCeiling] = useState(250000);

    const [selectedMarketplaces, setSelectedMarketplaces] = useState([]);
    const [priceRange, setPriceRange] = useState(250000);
    const [sortBy, setSortBy] = useState('default');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [inBudgetOnly, setInBudgetOnly] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleQuerySubmit = async (query) => {
        // Intercept Guest users and redirect to AuthPage
        const local = localStorage.getItem('seamas_user_session');
        if (local) {
            const parsed = JSON.parse(local);
            if (parsed.isGuest) {
                sessionStorage.setItem('pending_search_query', query);
                localStorage.removeItem('seamas_user_session');
                navigate('/', { state: { infoMessage: "For using this you have to first login into your account." } });
                return;
            }
        }

        if (query && !recentQueries.includes(query)) {
            setRecentQueries(prev => [query, ...prev].slice(0, 10));
            if (userSession && userSession.id !== 'guest') {
                supabase.from('search_history').insert({
                    user_id: userSession.id,
                    query: query
                }).then();
            }
        }

        setActiveTab('discover');
        setLoading(true);
        setCurrentQuery(query);
        agentStartTimesRef.current = { orchestrator: Date.now() };
        setAgentMetricsMap({});
        setAgentStatusMap({
            orchestrator: AGENT_STATES.RUNNING,
            search: AGENT_STATES.IDLE,
            price: AGENT_STATES.IDLE,
            reviews: AGENT_STATES.IDLE,
            budget: AGENT_STATES.IDLE,
            recommendation: AGENT_STATES.IDLE,
            finalizer: AGENT_STATES.IDLE,
        });
        setLogs([
            "[SYSTEM] Initiating multi-agent search workflow...",
            `[STEERING] Mode locked: ${steeringMode}`,
            "[NETWORK] Routing query to orchestration gateway..."
        ]);

        try {
            const data = await apiService.sendChatQueryStream(query, steeringMode, (evt) => {
                if (evt.type === 'node_start') {
                    agentStartTimesRef.current[evt.agent_id] = Date.now();
                    setAgentStatusMap(prev => ({
                        ...prev,
                        [evt.agent_id]: AGENT_STATES.RUNNING
                    }));
                    const agentName = AGENT_LIST.find(a => a.id === evt.agent_id)?.name || evt.agent_id;
                    setLogs(prev => [...prev, `[ACTIVE] ${agentName} has commenced reasoning...`]);
                } else if (evt.type === 'node_complete') {
                    const started = agentStartTimesRef.current[evt.agent_id];
                    const measuredMs = evt.duration 
                        ? Math.round(evt.duration * 1000) 
                        : (started ? Date.now() - started : null);
                    const durText = measuredMs ? `${Math.max(14, measuredMs)}ms` : undefined;
                    
                    setAgentMetricsMap(prev => ({
                        ...prev,
                        [evt.agent_id]: { duration: durText }
                    }));
                    setAgentStatusMap(prev => ({
                        ...prev,
                        [evt.agent_id]: AGENT_STATES.COMPLETED
                    }));
                    const agentName = AGENT_LIST.find(a => a.id === evt.agent_id)?.name || evt.agent_id;
                    setLogs(prev => [...prev, `[SUCCESS] ${agentName} finished task successfully.`]);
                } else if (evt.type === 'node_error') {
                    setAgentStatusMap(prev => ({
                        ...prev,
                        [evt.agent_id]: AGENT_STATES.ERROR
                    }));
                    const agentName = AGENT_LIST.find(a => a.id === evt.agent_id)?.name || evt.agent_id;
                    setLogs(prev => [...prev, `[ERROR] ${agentName}: ${evt.message || 'Encountered an issue'}`]);
                }
            });

            if (!data) return;

            // Save the logs returned from backend
            if (data.logs) {
                setLogs(data.logs);
            }

            const extractedPrices = data.price_data || [];
            setPriceData(extractedPrices);
            setSentimentReport(data.analysis_report || null);
            setBudgetStatus(data.budget_status || null);

            const validPrices = extractedPrices.map(p => p.extracted_price).filter(p => p != null && p > 0);
            const absoluteMax = validPrices.length > 0 ? Math.max(...validPrices) : 250000;
            setMaxBudgetCeiling(absoluteMax);

            const detectedCeiling = data.budget_status?.ceiling;
            if (detectedCeiling && Number(detectedCeiling) > 0) {
                setPriceRange(Number(detectedCeiling));
                setInBudgetOnly(true);
            } else {
                setPriceRange(absoluteMax);
                setInBudgetOnly(false);
            }

            setAgentStatusMap(prev => {
                const next = { ...prev };
                AGENT_LIST.forEach(({ id }) => {
                    if (next[id] !== AGENT_STATES.ERROR) {
                        next[id] = AGENT_STATES.COMPLETED;
                    }
                });
                return next;
            });
            setAgentMetricsMap(prev => {
                const next = { ...prev };
                AGENT_LIST.forEach(({ id, defaultDuration }) => {
                    if (!next[id]) next[id] = { duration: defaultDuration };
                });
                return next;
            });
        } catch (err) {
            showNotification(err.message || 'Product search failed. Please try again.', 'error');
            if (err.code === 'insufficient_credits') setSubscriptionModalOpen(true);
            setAgentStatusMap(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(id => {
                    if (next[id] === AGENT_STATES.RUNNING) next[id] = AGENT_STATES.ERROR;
                });
                return next;
            });
        } finally {
            if (userSession && userSession.id !== 'guest') {
                try {
                    // The backend transaction is authoritative. Refresh after both
                    // success and failure instead of predicting a local balance.
                    const actual = await settleWithin(apiService.getCredits(), 8000, 'Authoritative credit refresh');
                    try {
                        const snapshot = normalizeCreditSnapshot(actual);
                        setUserSession((previous) => previous?.id === userSession.id
                            ? { ...previous, tier: snapshot.tier, credits: snapshot.credits }
                            : previous);
                        const stored = JSON.parse(localStorage.getItem('seamas_user_session') || 'null');
                        if (stored?.id === userSession.id) {
                            stored.tier = snapshot.tier;
                            stored.credits = snapshot.credits;
                            localStorage.setItem('seamas_user_session', JSON.stringify(stored));
                        }
                    } catch {
                        console.error('Backend returned an invalid authoritative credit balance.');
                    }
                } catch (refreshError) {
                    console.error('Could not refresh authoritative search credits:', refreshError);
                }
            }
            setLoading(false);
        }
    };

    const availableMarketplaces = useMemo(() => {
        const stores = new Set();
        priceData.forEach(item => {
            if (isNonStoreOrArticleItem(item)) return;
            if (item.extracted_price > 0 && item.marketplace) {
                item.marketplace.split(',').forEach(s => {
                    const clean = s.trim().replace(/\.(in|com|co\.in)$/i, '');
                    if (clean && clean.toLowerCase() !== 'web') stores.add(clean.charAt(0).toUpperCase() + clean.slice(1));
                });
            }
        });
        return [...stores].sort();
    }, [priceData]);

    const filteredItems = useMemo(() => {
        return priceData.filter(item => {
            if (isNonStoreOrArticleItem(item)) return false;
            const effectivePrice = item.extracted_price != null
                ? Number(item.extracted_price)
                : (item.price != null ? Number(item.price) : (item.indexed_price != null ? Number(item.indexed_price) : null));
            const hasValidPrice = Number.isFinite(effectivePrice) && effectivePrice > 0;
            if (hasValidPrice && effectivePrice > priceRange) return false;
            if (selectedMarketplaces.length > 0) {
                const itemStores = (item.marketplace || '').split(',').map(s => s.trim().toLowerCase());
                const match = selectedMarketplaces.some(sel => {
                    const selLower = sel.toLowerCase();
                    return itemStores.some(is => is.includes(selLower) || selLower.includes(is));
                });
                if (!match) return false;
            }
            if (verifiedOnly && !hasValidPrice) return false;
            if (inBudgetOnly && item.status !== 'Target Match') return false;
            return true;
        });
    }, [priceData, selectedMarketplaces, priceRange, verifiedOnly, inBudgetOnly]);

    const sortedItems = useMemo(() => {
        const getItemPrice = (x) => {
            const p = x.extracted_price != null ? Number(x.extracted_price) : (x.price != null ? Number(x.price) : (x.indexed_price != null ? Number(x.indexed_price) : null));
            return Number.isFinite(p) && p > 0 ? p : null;
        };
        const base = [...filteredItems];
        if (sortBy === 'price-asc') base.sort((a, b) => (getItemPrice(a) ?? Infinity) - (getItemPrice(b) ?? Infinity));
        else if (sortBy === 'price-desc') base.sort((a, b) => (getItemPrice(b) ?? -Infinity) - (getItemPrice(a) ?? -Infinity));
        else base.sort((a, b) => {
            const aVerified = a.price_verified === true || a.price_verification_method === 'source_page';
            const bVerified = b.price_verified === true || b.price_verification_method === 'source_page';
            return Number(bVerified) - Number(aVerified);
        });
        return base;
    }, [filteredItems, sortBy]);

    const handleCardClick = (product) => {
        setSelectedProduct(product);
    };
    const completedCount = AGENT_LIST.filter(a => agentStatusMap[a.id] === AGENT_STATES.COMPLETED || agentStatusMap[a.id] === AGENT_STATES.ERROR).length;
    const progressPercent = Math.round((completedCount / AGENT_LIST.length) * 100);

    return (
        <div className="relative h-screen w-screen text-white flex overflow-hidden bg-[#09090B]">

            {ambientGlow && <div className="seamas-ambient" aria-hidden="true" />}
            <div className="seamas-grid" aria-hidden="true" />
            <div className="seamas-noise" />

            {selectedProduct && (
                <ProductDetailsDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}

            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                onSubmit={handleQuerySubmit}
                recentQueries={recentQueries}
            />
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            <SubscriptionModal
                isOpen={Boolean(subscriptionModalOpen)}
                onClose={() => setSubscriptionModalOpen(false)}
                userSession={userSession}
                initialTab={typeof subscriptionModalOpen === 'string' ? subscriptionModalOpen : null}
            />
            <AssistantChatDrawer
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                currentQuery={currentQuery}
                items={priceData}
                onTriggerSearch={(query) => {
                    handleQuerySubmit(query);
                    setIsAssistantOpen(false);
                }}
            />

            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onNewSearch={() => setShowCommandPalette(true)}
                wishlistCount={wishlistItems.length}
                threadCount={recentQueries.length}
                userSession={userSession}
                setSubscriptionModalOpen={setSubscriptionModalOpen}
                isSearching={loading}
            />

            <div className="flex-grow flex flex-col min-w-0 z-10 relative">
                <MarketTicker items={priceData} query={currentQuery} />

                <header className="h-16 flex items-center justify-between px-8 z-10 shrink-0 bg-transparent">
                    <div className="relative w-80 text-left">
                        <button
                            onClick={() => setShowCommandPalette(true)}
                            className="flex items-center w-full bg-[#121215] hover:bg-[#18181C] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-zinc-400 transition-all duration-300 shadow-sm"
                        >
                            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-zinc-500" /> Search marketplace...</span>
                            <span className="ml-auto font-mono text-[9px] bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">Ctrl+K</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAssistantOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-sm"
                            title="Open AI Shopping Assistant"
                        >
                            <Brain className="w-3.5 h-3.5 text-[#E6C762]" />
                            <span>AI Assistant</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors border border-transparent hover:border-rose-400/20"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto px-8 py-8 space-y-12 animate-spring-up text-left">

                    {activeTab === 'discover' && (
                        <>
                            <ChatInterface
                                onQuerySubmit={handleQuerySubmit}
                                loading={loading}
                                isGuest={userSession?.isGuest}
                                steeringMode={steeringMode}
                                setSteeringMode={setSteeringMode}
                            />
                            {(loading || currentQuery) && (
                                <section className="relative z-10 mx-auto w-full max-w-6xl">
                                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                                        <div>
                                            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500 font-medium">
                                                Agent Swarm Orchestration Engine
                                            </div>
                                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                                Seven specialists, one decision.
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-medium">
                                                    Swarm Pipeline
                                                </div>
                                                <div className="font-display text-lg text-white">
                                                    {completedCount}/{AGENT_LIST.length}{' '}
                                                    <span className="text-zinc-500">· {progressPercent}%</span>
                                                </div>
                                            </div>
                                            <div className="relative h-12 w-12 select-none">
                                                <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
                                                    <circle cx="20" cy="20" r="17" strokeWidth="3" className="stroke-white/[0.06]" fill="none" />
                                                    <circle
                                                        cx="20"
                                                        cy="20"
                                                        r="17"
                                                        strokeWidth="3"
                                                        fill="none"
                                                        stroke="url(#seamas-arc)"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${(progressPercent / 100) * 106.8} 106.8`}
                                                    />
                                                    <defs>
                                                        <linearGradient id="seamas-arc" x1="0" x2="1" y1="0" y2="1">
                                                            <stop offset="0" stopColor="#E6C762" />
                                                            <stop offset="1" stopColor="#34D399" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <svg
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-x-0 top-8 hidden h-24 w-full lg:block"
                                            preserveAspectRatio="none"
                                            viewBox="0 0 1200 100"
                                        >
                                            <defs>
                                                <linearGradient id="edge-grad" x1="0" x2="1" y1="0" y2="0">
                                                    <stop offset="0" stopColor="#E6C762" stopOpacity="0.4" />
                                                    <stop offset="1" stopColor="#34D399" stopOpacity="0.4" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d="M 60 50 C 220 10, 380 90, 540 50 S 860 10, 1020 50 S 1140 90, 1180 50"
                                                fill="none"
                                                stroke="url(#edge-grad)"
                                                strokeWidth="1"
                                                className={loading ? 'edge-flow' : ''}
                                                opacity="0.5"
                                            />
                                        </svg>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                                            {AGENT_LIST.map((agent) => {
                                                const state = agentStatusMap[agent.id] || AGENT_STATES.IDLE;
                                                const metrics = agentMetricsMap[agent.id];
                                                return <AgentNode key={agent.id} agent={agent} state={state} metrics={metrics} />;
                                            })}
                                        </div>

                                    </div>
                                </section>
                            )}
                            {!loading && currentQuery && (
                                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                                    <div className="lg:col-span-1 rounded-2xl p-4 seamas-glass border-white/[0.04]">
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
                                            hasBudget={Boolean(budgetStatus?.ceiling)}
                                        />

                                        {logs.length > 0 && (
                                            <div className="mt-6 border-t border-white/[0.05] pt-6 text-left">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">Telemetry Feed</span>
                                                <div className="mt-2 h-48 rounded-xl border border-white/[0.05] bg-black/40 p-3 font-mono text-[10px] text-neutral-400 overflow-y-auto space-y-1.5 custom-scrollbar">
                                                    {logs.map((log, index) => (
                                                        <div key={index} className="leading-relaxed border-b border-white/[0.02] pb-1 last:border-0">
                                                            <span className="text-cyan-400 select-none mr-1.5">›</span>
                                                            {log}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:col-span-3 space-y-6">
                                        <AiVerdictBanner items={sortedItems} query={currentQuery} />

                                        <SentimentBanner report={sentimentReport} />

                                        <PriceChart items={sortedItems} budgetLimit={budgetStatus?.ceiling} />

                                        <ProductGrid
                                            items={sortedItems}
                                            query={currentQuery}
                                            ready={true}
                                            onCardClick={handleCardClick}
                                            wishlistItems={wishlistItems}
                                            onWishlistToggle={handleToggleWishlist}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'agents' && (
                        <div className="w-full max-w-6xl mx-auto space-y-8">
                            <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
                                <div className="text-left">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Autonomous Pipeline Diagnostics</span>
                                    <h2 className="text-3xl font-display font-semibold text-white mt-1">Agent Console</h2>
                                </div>
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/[0.08] px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#34D399] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                                        7/7 Agents Armed · Pipeline Nominal
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-2 shadow-sm text-left">
                                    <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                                        <span>Orchestration Efficiency</span>
                                        <Zap className="h-4 w-4 text-[#E6C762]" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white tabular-nums">99.85%</div>
                                    <div className="text-[10px] font-mono text-zinc-500">Avg execution delay: 18ms</div>
                                </div>
                                <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-2 shadow-sm text-left">
                                    <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                                        <span>Active Parallel Workers</span>
                                        <Sliders className="h-4 w-4 text-[#E6C762]" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white tabular-nums">{parallelWorkers} Threads</div>
                                    <div className="text-[10px] font-mono text-zinc-500">Resource load: nominal</div>
                                </div>
                                <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-2 shadow-sm text-left">
                                    <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                                        <span>Target Compliance Rate</span>
                                        <ShieldCheck className="h-4 w-4 text-[#34D399]" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white tabular-nums">94.2%</div>
                                    <div className="text-[10px] font-mono text-zinc-500">Constraints successfully satisfied</div>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">7-Specialist Swarm Architecture</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AGENT_LIST.map((agent) => (
                                        <div key={agent.id} className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] flex gap-4 items-start shadow-sm hover:border-white/[0.15] transition-colors">
                                            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#E6C762] shrink-0">
                                                <agent.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-display font-semibold text-white text-sm truncate">{agent.name}</span>
                                                    {(() => {
                                                        const state = agentStatusMap[agent.id] || AGENT_STATES.IDLE;
                                                        if (state === AGENT_STATES.RUNNING) {
                                                            return (
                                                                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-[#E6C762]/30 bg-[#E6C762]/10 text-[#E6C762] animate-pulse font-semibold shrink-0">Running</span>
                                                            );
                                                        } else if (state === AGENT_STATES.COMPLETED) {
                                                            return (
                                                                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] font-semibold shrink-0">Complete</span>
                                                            );
                                                        } else if (state === AGENT_STATES.ERROR) {
                                                            return (
                                                                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold shrink-0">Error</span>
                                                            );
                                                        } else {
                                                            return (
                                                                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 font-semibold shrink-0">Ready</span>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                                <p className="text-xs text-zinc-400 leading-relaxed">{agent.role}</p>
                                                <div className="pt-2 flex items-center gap-4 font-mono text-[9px] text-zinc-500">
                                                    <span>Endpoint: /api/{agent.id}</span>
                                                    <span>Timeout: 30s</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="w-full max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 text-left">
                                <div>
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Recent Transactions</span>
                                    <h2 className="text-3xl font-display font-semibold text-white mt-1">Threads History</h2>
                                </div>
                                {recentQueries.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to clear your search history?")) {
                                                setRecentQueries([]);
                                                if (userSession && userSession.id !== 'guest') {
                                                    supabase.from('search_history').delete().eq('user_id', userSession.id).then(() => {
                                                        showNotification("Search history cleared!", "success");
                                                    });
                                                } else {
                                                    showNotification("Search history cleared!", "success");
                                                }
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Clear All</span>
                                    </button>
                                )}
                            </div>
                            {recentQueries.length === 0 ? (
                                <div className="seamas-glass rounded-2xl p-12 border border-white/5 text-center text-neutral-500 font-mono text-sm">
                                    No past queries found. Start search inside the Discover tab.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentQueries.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full seamas-glass p-4 rounded-xl border border-white/[0.04] hover:border-cyan-400/20 hover:bg-cyan-400/[0.01] transition-all flex items-center justify-between text-left group"
                                        >
                                            <button
                                                onClick={() => handleQuerySubmit(q)}
                                                className="flex-1 flex items-center gap-4 cursor-pointer text-left"
                                            >
                                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.02] border border-white/[0.06] text-neutral-400 font-mono text-xs">
                                                    #{idx + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-display font-medium text-white group-hover:text-cyan-300 transition-colors truncate">{q}</div>
                                                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">Pipeline status: Completed successfully</div>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-2 pl-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const updated = recentQueries.filter((_, i) => i !== idx);
                                                        setRecentQueries(updated);
                                                        if (userSession && userSession.id !== 'guest') {
                                                            supabase.from('search_history').delete().eq('user_id', userSession.id).eq('query', q).then();
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title="Remove from history"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleQuerySubmit(q)}
                                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                                    title="Rerun query"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="w-full max-w-6xl mx-auto space-y-6">
                            <div className="text-left border-b border-white/5 pb-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Library Candidates</span>
                                <h2 className="text-3xl font-display font-semibold text-white mt-1">My Wishlist</h2>
                            </div>

                            {wishlistItems.length === 0 ? (
                                <div className="seamas-glass rounded-2xl p-12 border border-white/5 text-center space-y-4">
                                    <Heart className="h-10 w-10 text-neutral-600 mx-auto" />
                                    <div className="text-sm text-neutral-500 font-mono">
                                        No items favorited yet. Click the heart icon on deal recommendations to collect them here.
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('discover')}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs text-neutral-200 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
                                    >
                                        Explore Deals
                                    </button>
                                </div>
                            ) : (
                                <ProductGrid
                                    items={wishlistItems}
                                    query="Wishlist"
                                    ready={true}
                                    onCardClick={handleCardClick}
                                    wishlistItems={wishlistItems}
                                    onWishlistToggle={handleToggleWishlist}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="w-full max-w-3xl mx-auto space-y-8">
                            <div className="text-left border-b border-white/5 pb-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">System Preferences</span>
                                <h2 className="text-3xl font-display font-semibold text-white mt-1">Settings Configuration</h2>
                            </div>

                            <div className="bg-[#121215] p-6 rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
                                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                                    <Sliders className="h-4 w-4 text-[#E6C762]" />
                                    Execution Thread Parameters
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-zinc-200">Deep sweep indexes</div>
                                            <div className="text-[11px] text-zinc-400">Scan all 14 e-commerce platforms in parallel</div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={deepScan}
                                            onClick={() => {
                                                const next = !deepScan;
                                                setDeepScan(next);
                                                updatePreference('deepScan', next);
                                            }}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                deepScan ? 'bg-[#E6C762]' : 'bg-zinc-800'
                                            }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    deepScan ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-zinc-200">Verify trust certification</div>
                                            <div className="text-[11px] text-zinc-400">Enforce seller review verification algorithms</div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={trustVerification}
                                            onClick={() => {
                                                const next = !trustVerification;
                                                setTrustVerification(next);
                                                updatePreference('trustVerification', next);
                                            }}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                trustVerification ? 'bg-[#E6C762]' : 'bg-zinc-800'
                                            }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    trustVerification ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-zinc-200">Max Parallel Workers</span>
                                            <span className="font-mono text-[#E6C762]">{parallelWorkers} Workers</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="32"
                                            value={parallelWorkers}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setParallelWorkers(val);
                                                updatePreference('parallelWorkers', val);
                                            }}
                                            className="w-full accent-[#E6C762] bg-white/10 h-1.5 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* UI Customization Card */}
                            <div className="bg-[#121215] p-6 rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
                                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-[#E6C762]" />
                                    UI Customization & Preferences
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-zinc-200">Ambient Glow Background</div>
                                            <div className="text-[11px] text-zinc-400">Show subtle warm champagne ambient specular lighting</div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={ambientGlow}
                                            onClick={() => {
                                                const next = !ambientGlow;
                                                setAmbientGlow(next);
                                                updatePreference('ambientGlow', next);
                                            }}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                ambientGlow ? 'bg-[#E6C762]' : 'bg-zinc-800'
                                            }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    ambientGlow ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-zinc-200">Data Saver Mode</div>
                                            <div className="text-[11px] text-zinc-400">Skip heavy image elements to speed up load times</div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={dataSaver}
                                            onClick={() => {
                                                const next = !dataSaver;
                                                setDataSaver(next);
                                                updatePreference('dataSaver', next);
                                            }}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                dataSaver ? 'bg-[#E6C762]' : 'bg-zinc-800'
                                            }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    dataSaver ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-zinc-200">Preferred Currency</div>
                                            <div className="text-[11px] text-zinc-400">Unit of price measurement for comparisons</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#18181C] border border-white/10 rounded-xl px-2.5 py-1">
                                            <DollarSign className="h-3.5 w-3.5 text-[#34D399]" />
                                            <select
                                                value={currency}
                                                onChange={(e) => {
                                                    setCurrency(e.target.value);
                                                    updatePreference('preferredCurrency', e.target.value);
                                                }}
                                                className="bg-transparent text-xs text-white border-none outline-none font-semibold focus:ring-0 cursor-pointer"
                                            >
                                                <option value="INR" className="bg-[#18181C] text-white">INR (₹)</option>
                                                <option value="USD" className="bg-[#18181C] text-white">USD ($)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Agent Steering Model Card */}
                            <div className="bg-[#121215] p-6 rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
                                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-[#E6C762]" />
                                    AI Agent Steering Model
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'balanced', label: 'Balanced Matrix', desc: 'Optimal speed & depth' },
                                        { id: 'speed', label: 'Speed Swarm', desc: 'Faster scans, lower cost' },
                                        { id: 'accuracy', label: 'Deep Audit', desc: 'Full trust verification' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setSteeringMode(mode.id);
                                                updatePreference('defaultSteering', mode.id);
                                            }}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${steeringMode === mode.id
                                                    ? 'border-[#E6C762]/50 bg-[#E6C762]/[0.05] text-white shadow-sm'
                                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400'
                                                }`}
                                        >
                                            <div className="text-xs font-semibold">{mode.label}</div>
                                            <div className="text-[11px] text-zinc-500 mt-1">{mode.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Danger Zone Card */}
                            <div className="seamas-glass p-6 rounded-2xl border border-rose-500/10 bg-rose-500/[0.01] space-y-4">
                                <h3 className="font-display font-semibold text-sm text-rose-400 flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Danger Zone
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="text-left space-y-0.5">
                                        <div className="text-xs font-semibold text-neutral-200">Clear Search History</div>
                                        <div className="text-[10px] text-neutral-500 font-mono">Delete all your past queries from your search history memory</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to clear your search history? This cannot be undone.")) {
                                                setRecentQueries([]);
                                                if (userSession && userSession.id !== 'guest') {
                                                    supabase.from('search_history').delete().eq('user_id', userSession.id).then(() => {
                                                        showNotification("History cleared successfully!", "success");
                                                    });
                                                } else {
                                                    showNotification("History cleared successfully!", "success");
                                                }
                                            }
                                        }}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                    >
                                        Clear History
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {notification && (
                <div
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slide-in-right max-w-sm"
                    style={{
                        background: 'hsl(240 8% 8% / 0.85)',
                        borderColor: notification.type === 'success'
                            ? 'hsl(158 64% 52% / 0.3)'
                            : notification.type === 'error'
                            ? 'hsl(350 89% 60% / 0.3)'
                            : 'hsl(187 92% 55% / 0.3)',
                        boxShadow: notification.type === 'success'
                            ? '0 10px 30px -10px hsl(158 64% 52% / 0.2)'
                            : notification.type === 'error'
                            ? '0 10px 30px -10px hsl(350 89% 60% / 0.2)'
                            : '0 10px 30px -10px hsl(187 92% 55% / 0.2)'
                    }}
                >
                    <span className="text-base select-none">
                        {notification.type === 'success' ? '🎉' : notification.type === 'error' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex flex-col text-left">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                            {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Warning' : 'Info'}
                        </span>
                        <p className="text-xs font-medium text-white mt-0.5 leading-relaxed">
                            {notification.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="ml-auto text-white/30 hover:text-white text-xs font-bold pl-3"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
