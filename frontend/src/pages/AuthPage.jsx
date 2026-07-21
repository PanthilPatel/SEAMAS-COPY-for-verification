import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({ name: '', email: '', password: '' });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('seamas_user_session', JSON.stringify({
            name: isLogin ? 'User' : formData.name || 'User',
            email: formData.email,
            isLoggedIn: true
        }));

        // Redirect to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="relative min-h-screen text-white flex flex-col items-center justify-center p-6 overflow-hidden bg-[#030305]">
            <div className="seamas-ambient" aria-hidden="true" />
            <div className="seamas-grid" aria-hidden="true" />
            <div className="seamas-noise" />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center">
                <div className="flex flex-col items-center mb-10 animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Sparkles className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                    </div>
                    <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">SEAMAS</h1>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Smart E-Commerce Orchestration</p>
                </div>

                <div className="w-full rounded2xl seamas-glass p-8 sm:p-10 animate-scale-in relative flex flex-col">

                    <div className="mb-8 text-center space-y-1.5">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400">
                            {isLogin ? 'Authentication' : 'Registration'}
                        </span>
                        <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
                            {isLogin ? 'Initialize Session' : 'Create Access Node'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        <div className={`overflow-hidden transition-all duration-500 ${isLogin ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 ml-1">
                                    Agent Alias
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-4 py-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:border-white/10 transition-all font-body text-sm"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 ml-1">
                                Secure Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-4 py-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:border-white/10 transition-all font-body text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 ml-1 flex justify-between">
                                <span>Access Key</span>
                                {isLogin && (
                                    <a href="#" className="text-cyan-500/70 hover:text-cyan-400 transition-colors">Recover</a>
                                )}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-4 py-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:border-white/10 transition-all font-body text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="w-full group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] btn-magnetic border border-transparent"
                            >
                                <span className="aurora-cta absolute inset-0" aria-hidden="true" />
                                <span className="relative flex items-center gap-2">
                                    {isLogin ? 'Establish Connection' : 'Deploy Identity'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                                </span>
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <span className="text-xs font-body text-neutral-500 mr-2">
                            {isLogin ? "No active node?" : "Identity confirmed?"}
                        </span>
                        <button
                            onClick={toggleMode}
                            type="button"
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                            {isLogin ? 'Initialize New' : 'Authenticate Here'}
                        </button>
                    </div>
                </div>

                <div className="w-full mt-12 mb-6">
                    <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600 flex items-center justify-center gap-2">
                        <span>&copy; 2026 SEAMAS</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                        <span>Multi-Agent Core</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
