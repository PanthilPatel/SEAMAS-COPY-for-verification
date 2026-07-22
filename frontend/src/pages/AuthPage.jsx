import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles, Zap } from 'lucide-react';

const PREVIEW_QUERIES = [
    "Best noise-cancelling headphones under ₹20,000",
    "iPhone 15 Pro Max lowest price",
    "Ergonomic gaming chair with lumbar support",
    "4K OLED TV best deals this week",
    "Mechanical keyboard with RGB under ₹5,000",
];

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [activeQuery] = useState(PREVIEW_QUERIES[0]);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        let name = formData.name?.trim();
        if (!name && formData.email) {
            const prefix = formData.email.split('@')[0];
            name = prefix.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
        localStorage.setItem('seamas_user_session', JSON.stringify({ name: name || 'Guest User', email: formData.email, isLoggedIn: true }));
        navigate('/dashboard');
    };

    const handleDemoLogin = () => {
        localStorage.setItem('seamas_user_session', JSON.stringify({ name: 'Elena Marquez', email: 'elena@seamas.ai', isLoggedIn: true }));
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#06020F] text-white overflow-x-hidden relative">
            
            {/* ── Background blobs ── */}
            <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-violet-700/25 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[110px] pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-fuchsia-700/10 blur-[100px] pointer-events-none" />

            {/* ── Navbar ── */}
            <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-base font-bold tracking-tight">SEAMAS</span>
                </div>
                <button
                    onClick={handleDemoLogin}
                    className="flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-white transition-colors"
                >
                    Try a demo <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </nav>

            {/* ── Main Layout ── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-6 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-80px)]">

                {/* ── LEFT: Hero Copy ── */}
                <div className="space-y-8 text-left">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-medium text-violet-300">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            6 AI Agents Online
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.07] tracking-tight">
                            Find the{' '}
                            <span className="relative inline-block">
                                <span className="relative z-10 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                                    best deal
                                </span>
                                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 rounded-full blur-sm" />
                            </span>
                            {' '}without lifting a finger.
                        </h1>

                        <p className="text-lg text-white/50 leading-relaxed max-w-lg font-sans">
                            Just tell SEAMAS what you want. Our AI agents hunt across Amazon, Flipkart, and 16 more stores — comparing prices, sentiment, and delivery — in seconds.
                        </p>
                    </div>

                    {/* ── Animated Search Preview ── */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-white/30 uppercase tracking-widest">People are searching</p>
                        <div className="space-y-2">
                            {PREVIEW_QUERIES.slice(0, 4).map((q, i) => (
                                <div
                                    key={q}
                                    className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition-all cursor-default"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                    {q}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Social Proof ── */}
                    <div className="flex items-center gap-6 pt-2">
                        <div className="flex -space-x-2.5">
                            {['#7C3AED','#4F46E5','#9333EA','#6D28D9'].map((c, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#06020F] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-white/40">
                            <span className="text-white font-semibold">2,800+</span> shoppers saved money this week
                        </p>
                    </div>
                </div>

                {/* ── RIGHT: Auth Card ── */}
                <div className="flex justify-center lg:justify-end w-full">
                    <div className="w-full max-w-md">
                        {/* Glowing card border */}
                        <div className="relative rounded-2xl p-px bg-gradient-to-br from-violet-500/40 via-fuchsia-500/20 to-indigo-500/40 shadow-[0_0_80px_rgba(124,58,237,0.2)]">
                            <div className="rounded-2xl bg-[#0D0A1E]/95 backdrop-blur-xl px-8 py-9 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                                {/* Tab Toggle */}
                                <div className="flex bg-white/5 rounded-xl p-1 mb-8">
                                    {[['sign-in', 'Sign In', true], ['register', 'Register', false]].map(([id, label, isLoginMode]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => { setIsLogin(isLoginMode); setFormData({ name: '', email: '', password: '' }); }}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                                isLogin === isLoginMode
                                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                                                    : 'text-white/40 hover:text-white/70'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-7">
                                    <h2 className="text-2xl font-bold text-white">{isLogin ? 'Welcome back 👋' : 'Join SEAMAS 🚀'}</h2>
                                    <p className="text-sm text-white/40 mt-1">{isLogin ? 'Sign in to your smart shopping workspace.' : 'Start finding the best deals in seconds.'}</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!isLogin && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-white/50 block">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                                <input
                                                    type="text"
                                                    name="name"
                                                    placeholder="Your full name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required={!isLogin}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/20 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-white/50 block">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/20 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-white/50 block">Password</label>
                                            {isLogin && <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Forgot?</a>}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="••••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/20 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full mt-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 group"
                                    >
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </form>

                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-xs text-white/30">or</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                <button
                                    onClick={handleDemoLogin}
                                    className="w-full py-3 rounded-xl text-sm font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    Try Demo — No Account Needed
                                </button>

                                <p className="text-center text-xs text-white/20 mt-6">
                                    By continuing, you agree to our{' '}
                                    <a href="#" className="underline underline-offset-2 hover:text-white/40">Terms</a>
                                    {' '}and{' '}
                                    <a href="#" className="underline underline-offset-2 hover:text-white/40">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
