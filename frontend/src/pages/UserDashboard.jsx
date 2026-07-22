import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import SentimentBanner from '../components/SentimentBanner';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import { apiService } from '../services/api';
import MarketTicker from '../components/MarketTicker';

import AssistantChatDrawer from '../components/AssistantChatDrawer';
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
    Check,
    Loader2,
    Clock,
    ArrowUpRight,
    Command,
    Sliders,
    Zap,
    ExternalLink,
    RotateCcw,
    LogOut,
    MessageSquare
} from 'lucide-react';

function ProductDetailsDrawer({ product, onClose }) {
    const [imgError, setImgError] = useState(false);
    if (!product) return null;

    const isVerified = Boolean(product.is_verified);
    const isOverBudget = product.status === 'Out of Budget';
    const price = product.extracted_price != null ? Number(product.extracted_price) : Number(product.price || 0);
    // Only use real MRP from backend — never fabricate a markup
    const original = product.original_price ? Number(product.original_price) : null;
    const discount = original && original > price ? Math.round(((original - price) / original) * 100) : 0;

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
                            {product.product_name || product.title}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all btn-magnetic">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">

                    <div className="w-full h-64 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {!imgError ? (
                            <img
                                src={product.image_url || product.image}
                                alt=""
                                className="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-102"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className="text-xs text-neutral-500 font-mono">Image details unavailable</span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-200">
                                {product.marketplace}
                            </span>
                            {isVerified && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                                    ✓ Verified Deal
                                </span>
                            )}
                        </div>

                        <div className="border-b border-white/5 pb-4">
                            <div className="flex items-baseline gap-3">
                                <div className="text-4xl font-bold font-display text-white">
                                    ₹{price.toLocaleString('en-IN')}
                                </div>
                                {original && (
                                    <span className="text-base text-neutral-500 line-through">
                                        ₹{original.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                            {discount > 0 && (
                                <div className="mt-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                                    Save {discount}% off original price
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Pipeline Insights</h4>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/[0.04] p-3 text-xs">
                                <span className="text-neutral-400">Budget Match Status</span>
                                <span className={`font-semibold ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {isOverBudget ? 'Out of Budget' : 'Target Match'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/[0.04] p-3 text-xs">
                                <span className="text-neutral-400">Trust Index Score</span>
                                <span className="text-cyan-300 font-mono font-semibold">9.8/10</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/[0.04] p-3 text-xs">
                                <span className="text-neutral-400">Review Sentiment</span>
                                <span className="text-indigo-300 font-semibold">94% Positive</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-6 border-t border-white/5 bg-white/[0.01] flex gap-3">
                    {product.url ? (
                        <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-medium text-white shadow-lg transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] btn-magnetic"
                        >
                            <span className="aurora-cta absolute inset-0" aria-hidden="true" />
                            <span className="relative flex items-center gap-1.5">
                                Visit Deal Store
                                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
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
    { id: 'search', name: 'Search Agent', role: 'Sweeps 14 marketplaces in parallel', icon: Radar },
    { id: 'price', name: 'Price Comparison Agent', role: 'Cross-checks history & true discounts', icon: LineChart },
    { id: 'reviews', name: 'Review Analyzer Agent', role: 'Distills 12k+ verified reviews', icon: Quote },
    { id: 'recommendation', name: 'Recommendation Agent', role: 'Ranks candidates against your intent', icon: Layers },
    { id: 'budget', name: 'Budget Advisor Agent', role: 'Parses intent, budget, constraints', icon: Brain },
    { id: 'finalizer', name: 'Finalizer Agent', role: 'Confirms stock, warranty & seller trust', icon: ShieldCheck }
];

const AGENT_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    COMPLETED: 'completed',
    ERROR: 'error'
};

const stateStyles = {
    [AGENT_STATES.IDLE]: {
        ring: 'border-white/[0.06]',
        dot: 'bg-neutral-600',
        label: 'Idle',
        labelClass: 'text-neutral-500',
        iconClass: 'text-neutral-500',
    },
    [AGENT_STATES.RUNNING]: {
        ring: 'border-cyan-400/60',
        dot: 'bg-cyan-400',
        label: 'Running',
        labelClass: 'text-cyan-300',
        iconClass: 'text-cyan-300',
    },
    [AGENT_STATES.COMPLETED]: {
        ring: 'border-emerald-400/40',
        dot: 'bg-emerald-400',
        label: 'Complete',
        labelClass: 'text-emerald-300/90',
        iconClass: 'text-emerald-300',
    },
    [AGENT_STATES.ERROR]: {
        ring: 'border-red-500/50',
        dot: 'bg-red-400',
        label: 'Error',
        labelClass: 'text-red-400',
        iconClass: 'text-red-400',
    }
};

function StateBadge({ state }) {
    const s = stateStyles[state] || stateStyles[AGENT_STATES.IDLE];
    const Icon = state === AGENT_STATES.COMPLETED ? Check
        : state === AGENT_STATES.RUNNING ? Loader2
            : state === AGENT_STATES.ERROR ? Zap
                : Clock;
    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${s.ring}`}>
            <Icon className={`h-3 w-3 ${s.iconClass} ${state === AGENT_STATES.RUNNING ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${s.labelClass}`}>{s.label}</span>
        </div>
    );
}

function AgentNode({ agent, state }) {
    const s = stateStyles[state] || stateStyles[AGENT_STATES.IDLE];
    const Icon = agent.icon;
    const isActive = state === AGENT_STATES.RUNNING;
    const isDone = state === AGENT_STATES.COMPLETED;

    return (
        <div className={`seamas-glass relative flex min-h-[140px] flex-col rounded-2xl p-5 transition-colors border agent-node-enter ${s.ring} ${isDone ? 'shadow-[0_0_28px_-8px_rgba(16,185,129,0.25)] agent-complete-sweep' : ''}`}>
            {isActive && (
                <span className="agent-running pointer-events-none absolute inset-0 rounded-2xl" />
            )}
            <div className="flex items-start justify-between gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors ${isActive ? 'border-cyan-400/40 bg-cyan-400/[0.06]' : isDone ? 'border-emerald-400/30 bg-emerald-400/[0.05]' : 'border-white/[0.06] bg-white/[0.02]'
                    }`}>
                    <Icon className={`h-[18px] w-[18px] ${s.iconClass}`} strokeWidth={1.6} />
                </div>
                <StateBadge state={state} />
            </div>
            <div className="mt-4 text-left">
                <div className="font-display text-[15px] font-medium tracking-tight text-white">{agent.name}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-neutral-500">{agent.role}</div>
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

function Sidebar({ collapsed, setCollapsed, activeTab, setActiveTab, onNewSearch, wishlistCount, threadCount, userSession }) {
    const userName = userSession?.name || 'Elena Marquez';
    const userInitials = useMemo(() => {
        if (!userName) return 'EM';
        const parts = userName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return userName.slice(0, 2).toUpperCase();
    }, [userName]);

    return (
        <aside
            className="relative z-20 hidden shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.015] md:flex transition-all duration-300 select-none text-left"
            style={{ width: collapsed ? 72 : 264, backdropFilter: 'blur(20px)' }}
        >
            {/* Brand Title */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-5">
                <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_24px_-6px_hsl(187_92%_43%/0.7)] shrink-0">
                    <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                {!collapsed && (
                    <div className="flex flex-col leading-tight">
                        <span className="font-display text-[15px] font-semibold tracking-tight text-white">SEAMAS</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">AI Workspace · v2.4</span>
                    </div>
                )}
            </div>

            <div className="px-3">
                <button
                    onClick={onNewSearch}
                    className="group flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-neutral-300 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
                >
                    <Plus className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-cyan-300" strokeWidth={1.75} />
                    {!collapsed && (
                        <>
                            <span className="flex-1 text-xs">New search</span>
                            <kbd className="seamas-kbd">⌘K</kbd>
                        </>
                    )}
                </button>
            </div>

            <nav className="mt-6 flex-1 space-y-6 px-3">
                {NAV.map((section) => (
                    <div key={section.group}>
                        {!collapsed && (
                            <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-600">
                                {section.group}
                            </div>
                        )}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = activeTab === item.id;
                                const displayCount = item.id === 'wishlist' ? wishlistCount : item.id === 'history' ? threadCount : item.count;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => setActiveTab(item.id)}
                                            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/[0.05] text-white' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-white'
                                                }`}
                                        >
                                            {isActive && (
                                                <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400" />
                                            )}
                                            <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-cyan-300' : 'text-neutral-500 group-hover:text-neutral-200'
                                                }`} strokeWidth={1.6} />
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-1 truncate text-left text-xs">{item.label}</span>
                                                    {displayCount != null && displayCount > 0 ? (
                                                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                                                            {displayCount}
                                                        </span>
                                                    ) : null}
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
                <div className="mx-3 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">All systems nominal</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                        {['API', 'AGENTS', 'DATA'].map((k) => (
                            <div key={k} className="rounded-md bg-white/[0.03] py-1">
                                <div className="font-mono text-[9px] text-neutral-500">{k}</div>
                                <div className="font-mono text-[10px] text-emerald-300/90">99.9%</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={`border-t border-white/[0.05] p-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {collapsed ? (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200"
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                    >
                        <ChevronsLeft className="h-4 w-4 rotate-180" strokeWidth={1.75} />
                    </button>
                ) : (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 text-[11px] font-semibold text-white ring-1 ring-white/20 select-none shadow-sm">
                                {userInitials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] text-neutral-200 font-semibold font-display">{userName}</div>
                                <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500">
                                    <CircleDot className="h-2.5 w-2.5 text-cyan-400 animate-pulse" strokeWidth={2.5} />
                                    Pro · 2,140 credits
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200 shrink-0"
                            aria-label="Collapse sidebar"
                            title="Collapse sidebar"
                        >
                            <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}

export default function UserDashboard() {
    const navigate = useNavigate();

    const [userSession] = useState(() => {
        try {
            const stored = localStorage.getItem('seamas_user_session');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const handleLogout = () => {
        localStorage.removeItem('seamas_user_session');
        navigate('/');
    };

    const [activeTab, setActiveTab] = useState('discover');
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [steeringMode, setSteeringMode] = useState('balanced');
    const [recentQueries, setRecentQueries] = useState([
        'Cozy retro mechanical keyboards with RGB light & pastel keycaps',
        'Best noise-cancelling wireless earbuds under ₹15,000',
        'Iphone 17 Pro Max',
        'Minimalist ambient LED desk lamps & setup aesthetics'
    ]);
    const [wishlistItems, setWishlistItems] = useState([]);

    const [apiUrl, setApiUrl] = useState('http://localhost:8000');
    const [deepScan, setDeepScan] = useState(true);
    const [trustVerification, setTrustVerification] = useState(true);
    const [parallelWorkers, setParallelWorkers] = useState(14);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuery, setCurrentQuery] = useState('');

    const [agentStatusMap, setAgentStatusMap] = useState({});

    const [priceData, setPriceData] = useState([]);
    const [sentimentReport, setSentimentReport] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
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

    useEffect(() => {
        if (!loading) return;

        setAgentStatusMap({
            search: AGENT_STATES.RUNNING,
            price: AGENT_STATES.IDLE,
            reviews: AGENT_STATES.IDLE,
            budget: AGENT_STATES.IDLE,
            recommendation: AGENT_STATES.IDLE,
            finalizer: AGENT_STATES.IDLE,
        });

        const t1 = setTimeout(() => {
            setAgentStatusMap(prev => ({
                ...prev,
                search: AGENT_STATES.COMPLETED,
                price: prev.price === AGENT_STATES.COMPLETED ? AGENT_STATES.COMPLETED : AGENT_STATES.RUNNING,
                reviews: prev.reviews === AGENT_STATES.COMPLETED ? AGENT_STATES.COMPLETED : AGENT_STATES.RUNNING,
                budget: prev.budget === AGENT_STATES.COMPLETED ? AGENT_STATES.COMPLETED : AGENT_STATES.RUNNING,
            }));
        }, 6000);

        return () => clearTimeout(t1);
    }, [loading]);

    const LOG_AGENT_MAP = [
        { id: 'search', successKey: 'search agent aggregated', errorKey: 'search agent error' },
        { id: 'price', successKey: 'successfully matched category context', errorKey: 'price comparison agent error' },
        { id: 'reviews', successKey: 'qualitative sentiment arrays packaged', errorKey: 'sentiment evaluation failed' },
        { id: 'budget', successKey: 'financial parameter', errorKey: 'budget agent error' },
        { id: 'recommendation', successKey: 'recommendation engine resolved', errorKey: 'crash log' },
        { id: 'finalizer', successKey: 'state sanitation completed', errorKey: 'finalizer error' },
    ];

    const deriveAgentStatesFromLogs = (logs = []) => {
        const logText = logs.join(' ').toLowerCase();
        const result = {};
        LOG_AGENT_MAP.forEach(({ id, successKey, errorKey }) => {
            const hasError = logText.includes(errorKey.toLowerCase());
            const hasSuccess = logText.includes(successKey.toLowerCase());
            if (hasError) result[id] = AGENT_STATES.ERROR;
            else if (hasSuccess) result[id] = AGENT_STATES.COMPLETED;
            else result[id] = AGENT_STATES.IDLE;
        });
        return result;
    };

    const handleQuerySubmit = async (query) => {
        if (query && !recentQueries.includes(query)) {
            setRecentQueries(prev => [query, ...prev]);
        }

        setActiveTab('discover');
        setLoading(true);
        setError(null);
        setCurrentQuery(query);

        try {
            const data = await apiService.sendChatQueryStream(query, (evt) => {
                if (evt.type === 'node_start') {
                    setAgentStatusMap(prev => ({
                        ...prev,
                        [evt.agent_id]: AGENT_STATES.RUNNING
                    }));
                } else if (evt.type === 'node_complete') {
                    setAgentStatusMap(prev => {
                        const next = { ...prev, [evt.agent_id]: AGENT_STATES.COMPLETED };
                        if (evt.agent_id === 'search') {
                            if (next.price === AGENT_STATES.IDLE) next.price = AGENT_STATES.RUNNING;
                            if (next.reviews === AGENT_STATES.IDLE) next.reviews = AGENT_STATES.RUNNING;
                            if (next.budget === AGENT_STATES.IDLE) next.budget = AGENT_STATES.RUNNING;
                        }
                        return next;
                    });
                }
            });

            if (!data) return;

            const extractedPrices = data.price_data || [];
            setPriceData(extractedPrices);
            setSentimentReport(data.analysis_report || null);
            setRecommendations(data.recommendations || []);
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
                    next[id] = AGENT_STATES.COMPLETED;
                });
                return next;
            });
        } catch (err) {
            setError(err.message || 'An error occurred.');
            setAgentStatusMap(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(id => {
                    if (next[id] === AGENT_STATES.RUNNING) next[id] = AGENT_STATES.ERROR;
                });
                return next;
            });
        } finally {
            setLoading(false);
        }
    };

    const availableMarketplaces = useMemo(() => {
        const stores = new Set();
        priceData.forEach(item => {
            if (item.extracted_price > 0 && item.marketplace) {
                item.marketplace.split(',').forEach(s => {
                    const clean = s.trim().replace(/\.(in|com|co\.in)$/i, '');
                    if (clean) stores.add(clean.charAt(0).toUpperCase() + clean.slice(1));
                });
            }
        });
        return [...stores].sort();
    }, [priceData]);

    const filteredItems = useMemo(() => {
        return priceData.filter(item => {
            if (!item.extracted_price || item.extracted_price <= 0) return false;
            if (item.extracted_price > priceRange) return false;
            if (selectedMarketplaces.length > 0) {
                const itemStores = (item.marketplace || '').split(',').map(s => s.trim().toLowerCase());
                const match = selectedMarketplaces.some(sel => {
                    const selLower = sel.toLowerCase();
                    return itemStores.some(is => is.includes(selLower) || selLower.includes(is));
                });
                if (!match) return false;
            }
            if (verifiedOnly && !item.is_verified) return false;
            if (inBudgetOnly && item.status !== 'Target Match') return false;
            return true;
        });
    }, [priceData, selectedMarketplaces, priceRange, verifiedOnly, inBudgetOnly]);

    const sortedItems = useMemo(() => {
        const base = [...filteredItems];
        if (sortBy === 'price-asc') base.sort((a, b) => a.extracted_price - b.extracted_price);
        else if (sortBy === 'price-desc') base.sort((a, b) => b.extracted_price - a.extracted_price);
        else base.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
        return base;
    }, [filteredItems, sortBy]);

    const handleCardClick = (product) => {
        setSelectedProduct(product);
    };
    const completedCount = AGENT_LIST.filter(a => agentStatusMap[a.id] === AGENT_STATES.COMPLETED || agentStatusMap[a.id] === AGENT_STATES.ERROR).length;
    const progressPercent = Math.round((completedCount / AGENT_LIST.length) * 100);

    return (
        <div className="relative min-h-screen text-white flex overflow-hidden">

            <div className="seamas-ambient" aria-hidden="true" />
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

            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onNewSearch={() => setShowCommandPalette(true)}
                wishlistCount={wishlistItems.length}
                threadCount={recentQueries.length}
                userSession={userSession}
            />

            <div className="flex-grow flex flex-col min-w-0 z-10 relative">
                <MarketTicker />

                <header className="h-16 flex items-center justify-between px-8 z-10 shrink-0 bg-transparent">
                    <div className="relative w-80 text-left">
                        <button
                            onClick={() => setShowCommandPalette(true)}
                            className="flex items-center w-full bg-[#07070e]/50 hover:bg-[#07070e]/80 border border-white/5 rounded-lg px-3.5 py-1.5 text-xs text-white/30 transition-all duration-300"
                        >
                            <span>🔍 Search anything...</span>
                            <span className="ml-auto font-mono text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Ctrl+K</span>
                        </button>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors border border-transparent hover:border-rose-400/20"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto px-8 py-8 space-y-12 animate-spring-up text-left">

                    {activeTab === 'discover' && (
                        <>
                            <ChatInterface onQuerySubmit={handleQuerySubmit} loading={loading} />
                            {(loading || currentQuery) && (
                                <section className="relative z-10 mx-auto w-full max-w-6xl">
                                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                                        <div>
                                            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                                                Agent Orchestration Engine
                                            </div>
                                            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                                                Six specialists, one decision.
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                                                    Pipeline
                                                </div>
                                                <div className="font-display text-lg text-white">
                                                    {completedCount}/{AGENT_LIST.length}{' '}
                                                    <span className="text-neutral-500">· {progressPercent}%</span>
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
                                                            <stop offset="0" stopColor="hsl(187 92% 55%)" />
                                                            <stop offset="1" stopColor="hsl(239 84% 67%)" />
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
                                                    <stop offset="0" stopColor="hsl(187 92% 55%)" stopOpacity="0.6" />
                                                    <stop offset="1" stopColor="hsl(239 84% 67%)" stopOpacity="0.6" />
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

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                            {AGENT_LIST.map((agent) => {
                                                const state = agentStatusMap[agent.id] || AGENT_STATES.IDLE;
                                                return <AgentNode key={agent.id} agent={agent} state={state} />;
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
                                    </div>

                                    <div className="lg:col-span-3 space-y-6">
                                        <SentimentBanner report={sentimentReport} />

                                        <ProductGrid items={sortedItems} query={currentQuery} ready={true} onCardClick={handleCardClick} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'agents' && (
                        <div className="w-full max-w-6xl mx-auto space-y-8">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <div className="text-left">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">System Monitoring</span>
                                    <h2 className="text-3xl font-display font-semibold text-white mt-1">Agent Console</h2>
                                </div>
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                                        Active Core Connected
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="seamas-glass p-5 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-neutral-400 text-xs">
                                        <span>Orchestration Efficiency</span>
                                        <Zap className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white">99.85%</div>
                                    <div className="text-[10px] font-mono text-neutral-500">Avg execution delay: 18ms</div>
                                </div>
                                <div className="seamas-glass p-5 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-neutral-400 text-xs">
                                        <span>Active Parallel Workers</span>
                                        <Sliders className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white">{parallelWorkers} Threads</div>
                                    <div className="text-[10px] font-mono text-neutral-500">Resource load: nominal</div>
                                </div>
                                <div className="seamas-glass p-5 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-neutral-400 text-xs">
                                        <span>Target Compliance Rate</span>
                                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div className="text-3xl font-bold font-display text-white">94.2%</div>
                                    <div className="text-[10px] font-mono text-neutral-500">Constraints successfully satisfied</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Agent Configuration & Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AGENT_LIST.map((agent) => (
                                        <div key={agent.id} className="seamas-glass p-5 rounded-2xl border border-white/5 flex gap-4 items-start">
                                            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-cyan-400">
                                                <agent.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-display font-medium text-white text-sm">{agent.name}</span>
                                                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300">Ready</span>
                                                </div>
                                                <p className="text-xs text-neutral-500">{agent.role}</p>
                                                <div className="pt-2 flex items-center gap-4 font-mono text-[9px] text-neutral-500">
                                                    <span>API Endpoint: /api/{agent.id}</span>
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
                            <div className="text-left border-b border-white/5 pb-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Recent Transactions</span>
                                <h2 className="text-3xl font-display font-semibold text-white mt-1">Threads History</h2>
                            </div>
                            {recentQueries.length === 0 ? (
                                <div className="seamas-glass rounded-2xl p-12 border border-white/5 text-center text-neutral-500 font-mono text-sm">
                                    No past queries found. Start search inside the Discover tab.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentQueries.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuerySubmit(q)}
                                            className="w-full seamas-glass p-4 rounded-xl border border-white/[0.04] hover:border-cyan-400/20 hover:bg-cyan-400/[0.01] transition-all flex items-center justify-between text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.02] border border-white/[0.06] text-neutral-400 font-mono text-xs">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-display font-medium text-white group-hover:text-cyan-300 transition-colors">{q}</div>
                                                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">Pipeline status: Completed successfully</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
                                                <span>Active</span>
                                                <ArrowUpRight className="h-4 w-4" />
                                            </div>
                                        </button>
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
                                <div className="grid auto-rows-[1fr] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {wishlistItems.map((item, idx) => (
                                        <div key={idx} className="relative">
                                            <ProductGrid items={[item]} ready={true} onCardClick={handleCardClick} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="w-full max-w-3xl mx-auto space-y-8">
                            <div className="text-left border-b border-white/5 pb-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">System Preferences</span>
                                <h2 className="text-3xl font-display font-semibold text-white mt-1">Settings Configuration</h2>
                            </div>

                            <div className="seamas-glass p-6 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-cyan-400" />
                                    Core Connection Configuration
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">API Gateway Endpoint URL</label>
                                    <input
                                        type="text"
                                        value={apiUrl}
                                        onChange={(e) => setApiUrl(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="seamas-glass p-6 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                                    <Sliders className="h-4 w-4 text-indigo-400" />
                                    Execution Thread Parameters
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold">Deep sweep indexes</div>
                                            <div className="text-[10px] text-neutral-500">Scan all 14 e-commerce platforms in parallel</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={deepScan}
                                            onChange={(e) => setDeepScan(e.target.checked)}
                                            className="h-4 w-4 rounded border-white/10 text-cyan-500 bg-transparent focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold">Verify trust certification</div>
                                            <div className="text-[10px] text-neutral-500">Enforce seller review verification algorithms</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={trustVerification}
                                            onChange={(e) => setTrustVerification(e.target.checked)}
                                            className="h-4 w-4 rounded border-white/10 text-cyan-500 bg-transparent focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>Max Parallel Workers</span>
                                            <span className="font-mono text-cyan-300">{parallelWorkers} Workers</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="32"
                                            value={parallelWorkers}
                                            onChange={(e) => setParallelWorkers(Number(e.target.value))}
                                            className="w-full accent-cyan-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>



        </div>
    );
}