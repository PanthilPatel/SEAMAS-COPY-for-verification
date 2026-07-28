import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShoppingBag, Star, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── Lifestyle product deal cards shown on the hero side ── */
const DEAL_CARDS = [
    {
        id: 1,
        category: 'Electronics',
        name: 'Sony WH-1000XM5',
        desc: 'Noise Cancelling Headphones',
        price: '₹26,990',
        original: '₹34,990',
        off: '23% OFF',
        color: '#7C3AED',
        emoji: '🎧',
        stars: 4.8,
        badge: 'Best Seller',
        style: { top: '10%', left: '5%', rotate: '-3deg' },
    },
    {
        id: 2,
        category: 'Fashion',
        name: 'Nike Air Max 270',
        desc: 'Men\'s Running Shoes',
        price: '₹8,995',
        original: '₹12,995',
        off: '31% OFF',
        color: '#0EA5E9',
        emoji: '👟',
        stars: 4.6,
        badge: 'Trending',
        style: { bottom: '20%', left: '5%', rotate: '4deg' },
    },
    {
        id: 3,
        category: 'Beauty',
        name: 'Dyson Airwrap',
        desc: 'Multi-Styler Complete',
        price: '₹44,900',
        original: '₹54,900',
        off: '18% OFF',
        color: '#F59E0B',
        emoji: '💇',
        stars: 4.9,
        badge: 'Limited Deal',
        style: { top: '40%', left: '45%', rotate: '3deg' },
    },
];



export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
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

    const handleDemoLogin = () => {
        localStorage.setItem('seamas_user_session', JSON.stringify({ name: 'Guest User', email: 'guest@seamas.ai', isLoggedIn: false, isGuest: true }));
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @keyframes floatUp {
                    0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
                    50%       { transform: translateY(-14px) rotate(var(--rot)); }
                }
                @keyframes fadeSlideIn {
                    from { opacity:0; transform: translateY(20px); }
                    to   { opacity:1; transform: translateY(0); }
                }
                .deal-card { animation: floatUp 5s ease-in-out infinite; }
                .fade-in   { animation: fadeSlideIn 0.5s ease forwards; }
                input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 1000px #1a1033 inset !important;
                    -webkit-text-fill-color: white !important;
                }
            `}</style>

            {/* ══════════════════════════════════════════
                LEFT PANEL – Vibrant lifestyle hero
            ══════════════════════════════════════════ */}
            <div
                className="hidden lg:flex relative flex-col justify-between"
                style={{
                    width: '52%',
                    background: 'linear-gradient(135deg, #1a0533 0%, #0f0a2e 40%, #0a1628 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Big ambient blobs */}
                <div className="absolute top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 65%)' }} />
                <div className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 65%)' }} />
                <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

                {/* Top bar */}
                <div className="relative z-20 px-10 pt-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                        🛒
                    </div>
                    <div>
                        <div className="font-bold text-base tracking-tight">SEAMAS</div>
                        <div className="text-[10px] opacity-40 tracking-wider uppercase">Smart Shopping</div>
                    </div>
                </div>

                {/* Hero copy */}
                <div className="relative z-20 px-10 py-6">
                    <p className="text-xs font-semibold tracking-widest uppercase mb-4"
                        style={{ color: '#A78BFA' }}>
                        ✦ Compare · Save · Shop Smarter
                    </p>
                    <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight mb-4">
                        Best prices,{' '}
                        <span style={{
                            background: 'linear-gradient(90deg, #A78BFA, #60A5FA, #34D399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            guaranteed.
                        </span>
                        <br />Every single time.
                    </h1>
                    <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        We scan stores and compare live prices so you always get the best deal — without spending hours searching.
                    </p>
                </div>

                {/* Floating deal cards */}
                {DEAL_CARDS.map((card) => (
                    <div
                        key={card.id}
                        className="deal-card absolute z-10 rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            ...card.style,
                            '--rot': card.style.rotate,
                            width: '200px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(16px)',
                            animationDelay: `${card.id * 0.5}s`,
                        }}
                    >
                        {/* Card top color bar */}
                        <div className="h-1 w-full" style={{ background: card.color }} />
                        <div className="p-3.5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: card.color + '22', color: card.color }}>
                                    {card.badge}
                                </span>
                                <span className="text-2xl">{card.emoji}</span>
                            </div>
                            <div className="text-[11px] opacity-40 mb-0.5">{card.category}</div>
                            <div className="font-bold text-sm text-white leading-tight">{card.name}</div>
                            <div className="text-[10px] opacity-40 mb-2">{card.desc}</div>
                            <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(card.stars) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`} />
                                ))}
                                <span className="text-[10px] opacity-40 ml-1">{card.stars}</span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="font-black text-base" style={{ color: card.color }}>{card.price}</span>
                                <span className="text-[10px] line-through opacity-30">{card.original}</span>
                                <span className="text-[10px] font-bold text-green-400">{card.off}</span>
                            </div>
                        </div>
                    </div>
                ))}



                {/* Bottom stats */}
                <div className="relative z-20 px-10 pb-10 flex gap-8">
                    {[['18+', 'Stores'], ['₹2.4M+', 'Saved'], ['30s', 'Avg Search']].map(([v, l]) => (
                        <div key={l}>
                            <div className="text-2xl font-black text-white">{v}</div>
                            <div className="text-xs opacity-30">{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT PANEL – Clean sign-in form
            ══════════════════════════════════════════ */}
            <div
                className="flex-1 flex items-center justify-center px-8 py-12"
                style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #0a0a14 100%)' }}
            >
                <div className="w-full max-w-sm fade-in text-left">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                            🛒
                        </div>
                        <span className="font-bold text-sm">SEAMAS</span>
                    </div>

                    {/* Heading */}
                    {location.state?.infoMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-300 font-mono tracking-wide animate-fade-in">
                            <span className="text-sm">⚠️</span>
                            <span>{location.state.infoMessage}</span>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-xs text-rose-300 font-mono tracking-wide animate-fade-in">
                            <span className="text-sm">❌</span>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="mb-7">
                        <h2 className="text-3xl font-black tracking-tight text-white">
                            {isLogin ? 'Sign in' : 'Join SEAMAS'}
                        </h2>
                        <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            {isLogin ? 'Find the best deals in seconds.' : 'Sign up free — no credit card needed.'}
                        </p>
                    </div>

                    {/* Tab */}
                    <div
                        className="flex rounded-xl p-1 mb-7"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        {[['Sign In', true], ['Register', false]].map(([label, mode]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => { setIsLogin(mode); setFormData({ name: '', email: '', password: '' }); }}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                                style={isLogin === mode
                                    ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(14,165,233,0.4))', color: 'white', border: '1px solid rgba(124,58,237,0.4)' }
                                    : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                                    <input type="text" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} required={!isLogin}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                                <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
                                {isLogin && <a href="#" className="text-xs" style={{ color: '#A78BFA' }}>Forgot?</a>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                                <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required
                                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none"
                                >
                                    {showPassword ? 
                                        <EyeOff className="w-4 h-4 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }} /> : 
                                        <Eye className="w-4 h-4 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }} />
                                    }
                                </button>
                            </div>
                        </div>

                        <button type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)', boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    <button onClick={handleDemoLogin}
                        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Browse without signing in
                    </button>

                    <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {isLogin ? "Don't have an account? " : 'Already have one? '}
                        <button type="button" onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', password: '' }); }}
                            className="font-bold" style={{ color: '#A78BFA' }}>
                            {isLogin ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
