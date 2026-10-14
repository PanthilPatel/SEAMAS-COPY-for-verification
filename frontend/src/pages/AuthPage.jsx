import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Mail, 
    Lock, 
    User, 
    Star, 
    Eye, 
    EyeOff, 
    Headphones, 
    TrendingUp, 
    ShieldCheck, 
    CheckCircle2, 
    Zap, 
    ArrowRight, 
    BarChart3, 
    Share2, 
    Sparkles,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage({ defaultIsLogin = true }) {
    const [isLogin, setIsLogin] = useState(defaultIsLogin);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeSpreadTab, setActiveSpreadTab] = useState('live');
    const navigate = useNavigate();
    const location = useLocation();

    // Live email validation
    const isEmailValid = useMemo(() => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    }, [formData.email]);

    // Reactive Password Entropy Assessment
    const entropy = useMemo(() => {
        const pass = formData.password;
        if (!pass) {
            return { score: 0, label: 'Awaiting input', color: 'bg-zinc-700', width: '0%' };
        }
        let score = 0;
        if (pass.length >= 6) score++;
        if (pass.length >= 10) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score++;

        switch (score) {
            case 1:
                return { score: 1, label: 'Weak', color: 'bg-rose-500', width: '25%' };
            case 2:
                return { score: 2, label: 'Fair', color: 'bg-amber-400', width: '50%' };
            case 3:
                return { score: 3, label: 'Good', color: 'bg-[#E6C762]', width: '75%' };
            case 4:
            default:
                return { score: 4, label: 'Cryptographic High', color: 'bg-emerald-400', width: '100%' };
        }
    }, [formData.password]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleModeSwitch = (loginMode) => {
        setIsLogin(loginMode);
        setError(null);
        navigate(loginMode ? '/login' : '/signup', { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });
                if (authError) throw authError;

                const profileName = data.user.user_metadata?.full_name || data.user.email.split('@')[0];
                localStorage.setItem('seamas_user_session', JSON.stringify({
                    id: data.user.id,
                    name: profileName,
                    email: data.user.email,
                    isLoggedIn: true
                }));
                navigate('/dashboard');
            } else {
                const { data, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name || formData.email.split('@')[0]
                        }
                    }
                });
                if (authError) throw authError;

                if (data?.user) {
                    const profileName = data.user.user_metadata?.full_name || data.user.email.split('@')[0];
                    localStorage.setItem('seamas_user_session', JSON.stringify({
                        id: data.user.id,
                        name: profileName,
                        email: data.user.email,
                        isLoggedIn: true
                    }));
                    navigate('/dashboard');
                } else {
                    setError("Sign up complete! Please check your email to confirm registration.");
                }
            }
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message || "Authentication failed. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider) => {
        try {
            setLoading(true);
            setError(null);
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/dashboard'
                }
            });
            if (authError) throw authError;
        } catch (err) {
            console.error(`${provider} sign in error:`, err);
            setError(err.message || `Failed to sign in with ${provider}.`);
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        localStorage.setItem('seamas_user_session', JSON.stringify({
            id: 'guest-explorer-uuid',
            name: 'Guest Explorer',
            email: 'guest@seamas.ai',
            isLoggedIn: false,
            isGuest: true,
            tier: 'Free',
            credits: 0
        }));
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen w-full bg-[#09090B] text-white flex flex-col font-sans relative selection:bg-[#E6C762]/30 selection:text-white">
            <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">

                {/* Subtle warm champagne specular lighting */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-b from-[#E6C762]/[0.05] via-white/[0.01] to-transparent blur-3xl pointer-events-none" />

                {/* LEFT COLUMN: Editorial Private Client Showcase */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative bg-[#09090B] border-r border-white/[0.07]">
                    
                    {/* Header */}
                    <div className="relative z-10 mb-8 text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-zinc-300 font-mono text-[10px] uppercase font-semibold tracking-widest shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E6C762] shadow-[0_0_8px_#E6C762]" />
                                SEAMAS PRIVATE CLIENT · INDIA MARKETPLACE INDEX
                            </span>
                            <span className="font-mono text-[11px] text-zinc-500 tracking-wider">LATENCY: 14ms</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-white max-w-xl leading-[1.12]">
                            Curated market intelligence, <span className="font-editorial italic font-normal text-[#E6C762]">negotiated autonomously.</span>
                        </h1>
                        <p className="text-zinc-400 text-sm sm:text-base mt-4 max-w-lg leading-relaxed font-normal">
                            Seven specialized autonomous agents deploy across verified retail ecosystems, analyzing price convergence, historical spread, and authorized seller legitimacy in milliseconds.
                        </p>
                    </div>

                    {/* Bento Grid of Real-Time Proof Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 my-auto text-left">
                        
                        {/* Card 1: Indexed Marketplaces */}
                        <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Verified Retail Partners</span>
                                    <span className="text-3xl sm:text-4xl text-[#F4F4F6] font-bold mt-1.5 tabular-nums tracking-tight">18,450+</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                                    <Share2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="my-4">
                                <svg className="w-full h-9 text-[#E6C762]" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
                                    <path d="M0 20 L15 17 L30 19 L45 12 L60 14 L75 7 L90 9 L100 2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                    <path d="M0 20 L15 17 L30 19 L45 12 L60 14 L75 7 L90 9 L100 2 V 24 H 0 Z" fill="currentColor" fillOpacity="0.1" />
                                </svg>
                            </div>
                            <p className="text-xs text-zinc-400 truncate font-normal">
                                Amazon India, Flipkart, Croma, Reliance Digital, Tata CLiQ
                            </p>
                        </div>

                        {/* Card 2: Featured Arbitrage Case Study */}
                        <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                                        <Headphones className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Featured Deal</span>
                                        <span className="text-sm font-semibold text-white truncate max-w-[140px]">Sony WH-1000XM5</span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-[#E6C762]/10 border border-[#E6C762]/30 text-[#E6C762] text-[11px] font-semibold flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-[#E6C762] text-[#E6C762]" /> 4.8
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline gap-2.5">
                                <span className="text-2xl font-bold text-[#F4F4F6] tabular-nums tracking-tight">₹24,990</span>
                                <span className="text-xs line-through text-zinc-500 tabular-nums">₹31,990</span>
                                <span className="text-[11px] font-semibold text-[#E6C762] bg-[#E6C762]/10 border border-[#E6C762]/25 px-2 py-0.5 rounded-md ml-auto tabular-nums">
                                    -22% Privileged Delta
                                </span>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400">
                                <span>Target price achieved</span>
                                <span className="text-[#34D399] font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Prime Verified
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Wide Architectural Store Spread Analysis */}
                        <div className="sm:col-span-2 p-6 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.7)]">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                                        <BarChart3 className="w-4 h-4" />
                                    </span>
                                    <span className="text-base text-white font-semibold">Active Store Spread Analysis</span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveSpreadTab('live')}
                                        className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-all ${activeSpreadTab === 'live' ? 'bg-white/10 text-white shadow-sm font-semibold' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        Live Radar
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveSpreadTab('7days')}
                                        className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-all ${activeSpreadTab === '7days' ? 'bg-white/10 text-white shadow-sm font-semibold' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        7-Day Average
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[#E6C762]/30 flex flex-col">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-[10px] text-[#E6C762] font-semibold uppercase">Amazon</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E6C762] shadow-[0_0_6px_#E6C762]" />
                                    </div>
                                    <span className="text-base font-bold text-white tabular-nums">₹24,990</span>
                                    <span className="text-[10px] text-[#34D399] mt-0.5 font-medium">Best Offer</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">Flipkart</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                    </div>
                                    <span className="text-base font-bold text-zinc-200 tabular-nums">₹25,490</span>
                                    <span className="text-[10px] text-zinc-500 mt-0.5">+₹500 delta</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">Croma</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                    </div>
                                    <span className="text-base font-bold text-zinc-200 tabular-nums">₹26,990</span>
                                    <span className="text-[10px] text-zinc-500 mt-0.5">+₹2,000 delta</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">Reliance Dig.</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                    </div>
                                    <span className="text-base font-bold text-zinc-200 tabular-nums">₹27,500</span>
                                    <span className="text-[10px] text-zinc-500 mt-0.5">+₹2,510 delta</span>
                                </div>
                            </div>

                            {/* Multi-Bar Arbitrage Distribution */}
                            <div className="w-full pt-1">
                                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                                    <span>Cross-Marketplace Price Spread</span>
                                    <span className="text-[#E6C762] font-semibold tabular-nums">Spread Delta: 10.04%</span>
                                </div>
                                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden flex gap-0.5 border border-white/5">
                                    <div className="h-full bg-[#E6C762] rounded-l-full" style={{ width: '42%' }} />
                                    <div className="h-full bg-zinc-400" style={{ width: '28%' }} />
                                    <div className="h-full bg-zinc-600" style={{ width: '18%' }} />
                                    <div className="h-full bg-zinc-700 rounded-r-full" style={{ width: '12%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Accumulated Value Created */}
                        <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Accumulated Value Created</span>
                                    <div className="text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">₹4.82 Cr</div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#34D399]">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-[11px] font-semibold tabular-nums">
                                    ↑ 24.8%
                                </span>
                                <span className="text-xs text-zinc-400">average client savings</span>
                            </div>
                        </div>

                        {/* Card 5: Accuracy & Safety */}
                        <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Fraud & Risk Guard</span>
                                    <div className="text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">99.8%</div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-zinc-400">Authorized sellers strictly filtered</span>
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-mono text-[10px] font-semibold">ZERO FRAUD</span>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Ticker */}
                    <div className="mt-8 pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-zinc-500 font-mono text-[11px] relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                            <span>Live index: Sony WH-1000XM5 verified best price ₹24,990 on Amazon India</span>
                        </div>
                        <div>END-TO-END TLS 1.3 · SUPABASE RLS</div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Elevated Private Client Auth Console */}
                <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#0D0D11] relative">
                    <div className="max-w-md w-full mx-auto">
                        
                        {/* Logo Header */}
                        <div className="mb-8 flex flex-col items-start text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/15 flex items-center justify-center shadow-lg shadow-black/50">
                                    <Sparkles className="w-5 h-5 text-[#E6C762]" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight text-white font-sans">SEAMAS</span>
                            </div>
                            <p className="text-xs text-zinc-400 tracking-wide">
                                Private Client Multi-Agent Shopping Engine
                            </p>
                        </div>

                        {/* Segmented Pill Toggle: Sign In vs Create Account */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-white text-left tracking-tight">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </h2>
                                <button 
                                    onClick={handleDemoLogin} 
                                    type="button" 
                                    className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-zinc-200 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                                >
                                    <Zap className="w-3.5 h-3.5 text-[#E6C762]" /> Instant Guest Preview
                                </button>
                            </div>
                            <div className="w-full bg-black/50 p-1 rounded-xl flex items-center border border-white/[0.08]">
                                <button 
                                    type="button" 
                                    onClick={() => handleModeSwitch(true)}
                                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all ${
                                        isLogin 
                                            ? 'bg-white text-zinc-950 shadow-sm font-bold' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleModeSwitch(false)}
                                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all ${
                                        !isLogin 
                                            ? 'bg-white text-zinc-950 shadow-sm font-bold' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>

                        {/* Alert Banners */}
                        {location.state?.infoMessage && (
                            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left flex items-start gap-2.5">
                                <Zap className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                                <span>{location.state.infoMessage}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            {!isLogin && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-zinc-400 font-medium">Full Name</label>
                                    <div className="relative flex items-center">
                                        <User className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            name="name" 
                                            placeholder="Jane Doe" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            required={!isLogin}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121215] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-[#E6C762]/60 focus:ring-1 focus:ring-[#E6C762]/40 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-zinc-400 font-medium">Email Address</label>
                                    {isEmailValid && (
                                        <span className="text-[11px] text-[#34D399] flex items-center gap-1 font-medium">
                                            <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Valid
                                        </span>
                                    )}
                                </div>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        placeholder="client@private.seamas.ai" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121215] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-[#E6C762]/60 focus:ring-1 focus:ring-[#E6C762]/40 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-zinc-400 font-medium">Password</label>
                                    {isLogin && (
                                        <a href="#" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Forgot?</a>
                                    )}
                                </div>
                                <div className="relative flex items-center">
                                    <Lock className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        placeholder="••••••••••••" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#121215] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-[#E6C762]/60 focus:ring-1 focus:ring-[#E6C762]/40 transition-all"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Bar */}
                                <div className="mt-1">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                                        <span>Security Strength</span>
                                        <span className="font-medium text-zinc-400">{entropy.label}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-full ${entropy.color} transition-all duration-300`} 
                                            style={{ width: entropy.width }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Primary Liquid Pearl White Submit Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl bg-[#F4F4F6] text-[#09090B] hover:bg-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_24px_rgba(255,255,255,0.12)] transition-all active:scale-[0.99] disabled:opacity-60"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                                    ) : (
                                        <>
                                            <span>{isLogin ? 'Sign In to SEAMAS' : 'Create Private Client Account'}</span>
                                            <ArrowRight className="w-4 h-4 text-zinc-950 transition-transform group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.08]" />
                            </div>
                            <span className="relative px-3 bg-[#0D0D11] text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                                Or continue with
                            </span>
                        </div>

                        {/* Social OAuth Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button" 
                                onClick={() => handleOAuthSignIn('google')}
                                disabled={loading}
                                className="h-11 rounded-xl bg-[#121215] border border-white/[0.08] hover:bg-white/[0.04] flex items-center justify-center gap-2 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-60"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Google</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleOAuthSignIn('github')}
                                disabled={loading}
                                className="h-11 rounded-xl bg-[#121215] border border-white/[0.08] hover:bg-white/[0.04] flex items-center justify-center gap-2 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-60"
                            >
                                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                                </svg>
                                <span>GitHub</span>
                            </button>
                        </div>

                        {/* Security Proof Badge */}
                        <div className="mt-8 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400 text-xs">
                            <ShieldCheck className="w-4 h-4 text-[#E6C762]" />
                            <span>Institutional Grade TLS 1.3 Encryption</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
