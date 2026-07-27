import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, X, Loader2, KeyRound } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                onClose();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                setSuccessMsg('Signup successful! You can now sign in.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-[360px]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
            
            <div className="relative z-50 w-full max-w-sm animate-scale-in">
                <div className="bg-neutral-900/80 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-50" />
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full bg-white/5 border border-white/5 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="mb-8 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <KeyRound className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white font-display tracking-tight mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-center text-neutral-400 text-sm mb-8">
                        {isLogin ? 'Sign in to access your wishlists and history.' : 'Join SEAMAS to save your favorite deals.'}
                    </p>

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                            {error}
                        </div>
                    )}
                    
                    {successMsg && (
                        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-4 bg-white text-black font-semibold rounded-xl text-sm transition-all hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs text-neutral-400 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
