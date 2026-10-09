import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Star, Eye, EyeOff, MoreHorizontal, ChevronRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── Bento Grid layout replaces old floating cards ── */



export default function AuthPage({ defaultIsLogin = true }) {
    const isLogin = defaultIsLogin;
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Sign In using Supabase auth
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
                // Register using Supabase auth
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
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/dashboard'
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error(`${provider} sign in error:`, err);
            setError(err.message || `Failed to sign in with ${provider}.`);
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        localStorage.setItem('seamas_user_session', JSON.stringify({ name: 'Guest User', email: 'guest@seamas.ai', isLoggedIn: false, isGuest: true, tier: 'Free', credits: 0 }));
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen flex text-white overflow-hidden bg-[#070d19] font-sans relative">
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity:0; transform: translateY(20px); }
                    to   { opacity:1; transform: translateY(0); }
                }
                .fade-in { animation: fadeSlideIn 0.5s ease forwards; }
                
                /* Custom scrollbar for the charts */
                .mini-bar {
                    background: linear-gradient(to top, #3b82f6, #93c5fd);
                    border-radius: 2px 2px 0 0;
                }
                .mini-bar.alt { background: linear-gradient(to top, #94a3b8, #e2e8f0); }
                .mini-bar.dark { background: linear-gradient(to top, #1e293b, #64748b); }
            `}</style>

            {/* Background glowing effects & grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
            <div className="absolute top-0 right-[20%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* LEFT PANEL - Dashboard Grid */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
                <div className="w-full max-w-[640px] grid grid-cols-2 gap-4">

                    {/* Box 1: Stores Scanned */}
                    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Stores Scanned</span>
                            <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold tracking-tight text-white mb-1">18,450+</div>
                            <div className="text-xs text-neutral-400 mb-6">Active Stores</div>
                        </div>
                        {/* Mock Line Chart */}
                        <div className="h-16 w-full flex items-end justify-between gap-1 mt-auto">
                            {[40, 30, 50, 40, 60, 55, 70, 65, 80, 75, 90].map((h, i) => (
                                <div key={i} className="w-full bg-blue-500/20 rounded-t-sm" style={{ height: `${h}%` }}>
                                    <div className="w-full bg-blue-400 rounded-t-sm opacity-50" style={{ height: '2px' }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-5 left-5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Trending Now
                        </div>
                    </div>

                    {/* Box 2: Trending Product */}
                    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Trending Product</span>
                            <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div className="w-full h-28 bg-[#e2e8f0] rounded-xl flex items-center justify-center text-4xl mb-3 shadow-inner">
                            🎧
                        </div>
                        <div className="text-sm font-bold text-white">Sony WH-1000XM5</div>
                        <div className="flex justify-between items-center mt-1 mb-4">
                            <span className="text-lg font-bold text-white">₹26,990</span>
                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                <Star className="w-3 h-3 fill-amber-400" /> 4.8
                            </div>
                        </div>
                        {/* Mini sparkline */}
                        <div className="h-6 w-full flex items-end justify-between gap-0.5 mt-auto">
                            {[20, 30, 25, 40, 35, 50, 45, 60, 70, 80].map((h, i) => (
                                <div key={i} className="w-full bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Box 3: Price Comparison */}
                    <div className="col-span-2 bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Price Comparison</span>
                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-medium text-neutral-300 flex items-center gap-1 cursor-pointer">
                                Last 7 Days <ChevronRight className="w-3 h-3 rotate-90" />
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-4 justify-center mb-6 text-[10px] font-medium text-neutral-400">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1e293b]"></div> Amazon</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> BestBuy</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#94a3b8]"></div> Target</div>
                        </div>
                        {/* Chart */}
                        <div className="flex items-end justify-around h-32 mt-4 px-4 border-l border-b border-white/10 relative pb-2 pt-2">
                            {/* Y-axis labels */}
                            <div className="absolute -left-6 bottom-0 h-full flex flex-col justify-between text-[8px] text-neutral-500 py-2">
                                <span>$30k</span><span>$20k</span><span>$10k</span><span>0</span>
                            </div>

                            {[1, 2, 3, 4].map(group => (
                                <div key={group} className="flex items-end gap-1.5 h-full">
                                    <div className="w-4 mini-bar dark" style={{ height: `${40 + Math.random() * 20}%` }}></div>
                                    <div className="w-4 mini-bar" style={{ height: `${60 + Math.random() * 30}%` }}></div>
                                    <div className="w-4 mini-bar alt" style={{ height: `${30 + Math.random() * 30}%` }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-around text-[10px] text-neutral-500 mt-3 font-medium">
                            <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
                        </div>
                    </div>

                    {/* Box 4: Savings */}
                    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Total Savings</span>
                            <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 24.8%
                            </div>
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-white mt-1">₹14,230</div>
                    </div>

                    {/* Box 5: Insights */}
                    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Data Insights</span>
                            <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div className="text-xl font-bold text-white mb-2">Inter</div>
                        <div className="h-12 w-full flex items-end justify-between gap-1 mt-auto">
                            {[10, 20, 15, 30, 25, 40, 35, 50, 45, 60].map((h, i) => (
                                <div key={i} className="w-full bg-indigo-500/30 rounded-t-sm" style={{ height: `${h}%` }}>
                                    <div className="w-full bg-indigo-400 rounded-t-sm opacity-60" style={{ height: '2px' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT PANEL - Glassmorphism Login */}
            <div className="flex-1 flex items-center justify-center p-8 relative z-20">
                <div className="w-full max-w-[440px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl fade-in text-center relative overflow-hidden">
                    {/* Glass shine effect */}
                    <div className="absolute top-0 left-[-50%] w-[200%] h-32 bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-12 pointer-events-none"></div>

                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-[#0f52ba] flex items-center justify-center shadow-lg shadow-blue-500/20 text-sm">
                            🛒
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">SEAMAS</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome back!' : 'Create an account'}
                    </h2>
                    <p className="text-sm text-neutral-400 mb-8">
                        {isLogin ? 'Sign in to your account' : 'Sign up to start saving'}
                    </p>

                    {location.state?.infoMessage && (
                        <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left flex items-start gap-2">
                            <span className="shrink-0 text-sm">ℹ️</span>
                            <span>{location.state.infoMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required={!isLogin}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0f172a]/60 border border-white/5 placeholder:text-neutral-500 focus:border-blue-500/50 focus:bg-[#0f172a]/80"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0f172a]/60 border border-white/5 placeholder:text-neutral-500 focus:border-blue-500/50 focus:bg-[#0f172a]/80"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required
                                className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0f172a]/60 border border-white/5 placeholder:text-neutral-500 focus:border-blue-500/50 focus:bg-[#0f172a]/80"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <a href="#" className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 bg-[#0f52ba] shadow-lg shadow-blue-900/20 mt-2"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-[11px]">
                            <span className="bg-transparent px-2 text-neutral-500 font-medium tracking-wide">Or sign in with</span>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center mb-8">
                        <button onClick={() => handleOAuthSignIn('google')} type="button" disabled={loading} className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:bg-[#1e293b] transition-colors text-sm font-bold text-white shadow-lg disabled:opacity-60">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button onClick={() => handleOAuthSignIn('github')} type="button" disabled={loading} className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:bg-[#1e293b] transition-colors text-sm font-bold text-white shadow-lg disabled:opacity-60">
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                            Github
                        </button>
                    </div>

                    <p className="text-[11px] text-neutral-500 font-medium">
                        {isLogin ? "Don't have an account? " : "Already have one? "}
                        <button onClick={() => { navigate(isLogin ? '/signup' : '/login'); setFormData({ name: '', email: '', password: '' }); }} className="text-blue-400 hover:text-blue-300 ml-1 font-bold">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <button onClick={handleDemoLogin} className="text-[11px] text-neutral-500 hover:text-white transition-colors">
                            Or continue as Guest User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
