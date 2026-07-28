import React, { useState, useEffect } from 'react';
import { User, Mail, Zap, LogOut, ArrowLeft, Calendar, History, Settings, ShieldAlert, Key, Trash2, Bell, Database, CreditCard, Shield, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import SubscriptionModal from '../components/SubscriptionModal';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [userSession, setUserSession] = useState(null);
    const [stats, setStats] = useState({ totalSearches: 0, joinDate: null });
    const [settings, setSettings] = useState({ emailAlerts: true, dataSaver: false });
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const local = localStorage.getItem('seamas_user_session');
            if (!local) {
                navigate('/');
                return;
            }
            const session = JSON.parse(local);
            setUserSession(session);

            if (!session.isGuest) {
                // Fetch User Join Date
                const { data: { user } } = await supabase.auth.getUser();
                let joinDateStr = 'Unknown';
                if (user?.created_at) {
                    joinDateStr = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }

                // Fetch Search History Count
                const { count } = await supabase.from('search_history').select('*', { count: 'exact', head: true }).eq('user_id', session.id);

                setStats({ totalSearches: count || 0, joinDate: joinDateStr });
            }

            // Load Settings
            const savedSettings = localStorage.getItem('seamas_preferences');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }

            setLoading(false);
        };
        loadProfile();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('seamas_user_session');
        navigate('/');
    };

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem('seamas_preferences', JSON.stringify(newSettings));
    };

    const handleResetPassword = async () => {
        if (!userSession?.email) return;
        const confirm = window.confirm(`Send password reset email to ${userSession.email}?`);
        if (confirm) {
            const { error } = await supabase.auth.resetPasswordForEmail(userSession.email);
            if (error) alert(error.message);
            else alert("Password reset email sent! Check your inbox.");
        }
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all search history.");
        if (confirm) {
            alert("For security reasons, account deletion must be requested via support. Please contact admin@seamas.com");
        }
    };

    if (!userSession || loading) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent"></div>
        </div>
    );

    const isPro = userSession?.tier === 'Pro';
    const maxCredits = isPro ? 1000 : 50;
    const currentCredits = Math.min(maxCredits, userSession?.isGuest ? 0 : (userSession?.credits ?? 50));
    const creditPercent = Math.min(100, Math.round((currentCredits / maxCredits) * 100));

    return (
        <div className="relative min-h-screen text-white p-4 md:p-8 lg:p-12 overflow-y-auto bg-[#0a0a0f]">
            <div className="seamas-ambient" aria-hidden="true" />
            <div className="seamas-grid" aria-hidden="true" />
            <div className="seamas-noise" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-black tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">My Account</h1>
                </div>

                {/* Profile Summary Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/10">
                        {userSession.name?.slice(0, 2).toUpperCase() || 'GU'}
                    </div>
                    <div className="text-left flex-1">
                        <h2 className="text-xl font-bold tracking-tight text-white">
                            {userSession.name || 'Guest User'}
                        </h2>
                        <p className="text-xs text-cyan-400 font-mono mt-0.5 uppercase tracking-wider">
                            {isPro ? 'Pro Member' : 'Free Member'}
                        </p>
                    </div>
                    {!isPro && (
                        <button
                            onClick={() => setSubModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 border border-cyan-400/20 text-cyan-300 hover:border-cyan-400/40 hover:from-cyan-500/30 hover:to-indigo-600/30 text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                            Upgrade to Pro
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                {!userSession.isGuest && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-left space-y-1">
                            <div className="flex items-center gap-2 text-neutral-500">
                                <History className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-mono">Total Searches</span>
                            </div>
                            <div className="text-3xl font-black font-display text-white">{stats.totalSearches}</div>
                            <div className="text-[10px] font-mono text-neutral-500">queries executed</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-left space-y-1">
                            <div className="flex items-center gap-2 text-neutral-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-mono">Member Since</span>
                            </div>
                            <div className="text-2xl font-black font-display text-white">{stats.joinDate || '—'}</div>
                            <div className="text-[10px] font-mono text-neutral-500">account created</div>
                        </div>
                    </div>
                )}

                {/* Credits Card */}
                {!userSession.isGuest && (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4 text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-base font-bold text-white">Search Credits</h3>
                            </div>
                            <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${isPro ? 'bg-indigo-500/10 border border-indigo-400/20 text-indigo-300' : 'bg-neutral-800 border border-white/[0.06] text-neutral-400'}`}>
                                {isPro ? 'Pro Plan' : 'Free Plan'}
                            </span>
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-black font-display text-white">{currentCredits}</span>
                                <span className="text-xs font-mono text-neutral-500">/ {maxCredits} credits</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-700"
                                    style={{ width: `${creditPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-neutral-500 font-mono mt-2">
                                {currentCredits === 0 ? 'Out of credits — upgrade to continue searching.' : `${creditPercent}% remaining`}
                            </p>
                        </div>
                        {!isPro && (
                            <button
                                onClick={() => setSubModalOpen(true)}
                                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/20 hover:border-cyan-400/40 text-cyan-300 hover:from-cyan-600/30 hover:to-indigo-600/30 transition-all"
                            >
                                <Zap className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                                Upgrade to Pro — 5,000 Credits / Month
                            </button>
                        )}
                    </div>
                )}

                {/* Profile Information Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-white">Profile Information</h3>
                        <button
                            onClick={() => alert("Profile editing is disabled in demo mode. Please contact admin@seamas.com.")}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            Edit
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-left">
                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Full Name</div>
                            <div className="text-sm font-semibold text-neutral-200 mt-1">
                                {userSession.name || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Email Address</div>
                            <div className="text-sm font-semibold text-neutral-200 mt-1">
                                {userSession.email || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Phone</div>
                            <div className="text-sm font-semibold text-neutral-200 mt-1">
                                {userSession.phone || '+91 98765 43210'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Account Type</div>
                            <div className={`text-sm font-semibold mt-1 ${isPro ? 'text-indigo-300' : 'text-cyan-300'}`}>
                                {isPro ? '⚡ Pro Member' : '🔓 Free Member'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-5">
                    <h3 className="text-base font-bold text-white text-left">Preferences</h3>

                    {/* Email Alerts */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                <Bell className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-neutral-200">Email Alerts</div>
                                <div className="text-xs text-neutral-500 mt-0.5">Receive deal alerts and search summaries</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('emailAlerts')}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings.emailAlerts ? 'bg-cyan-500' : 'bg-white/[0.08]'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-white/[0.04]" />

                    {/* Data Saver */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                <Database className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-neutral-200">Data Saver Mode</div>
                                <div className="text-xs text-neutral-500 mt-0.5">Reduce image loading for faster results</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('dataSaver')}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings.dataSaver ? 'bg-cyan-500' : 'bg-white/[0.08]'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.dataSaver ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-left mb-1">
                        <Shield className="w-4 h-4 text-neutral-400" />
                        <h3 className="text-base font-bold text-white">Security</h3>
                    </div>

                    <button
                        onClick={handleResetPassword}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all group"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                <Key className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-neutral-200 group-hover:text-white transition-colors">Change Password</div>
                                <div className="text-xs text-neutral-500">Send a reset link to your email</div>
                            </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 rotate-180 transition-colors" />
                    </button>

                    <button
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/[0.08] hover:bg-rose-500/[0.07] hover:border-rose-500/20 transition-all group"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-rose-500/[0.05] border border-rose-500/[0.10]">
                                <Trash2 className="w-4 h-4 text-rose-400" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-rose-300 group-hover:text-rose-200 transition-colors">Delete Account</div>
                                <div className="text-xs text-neutral-500">Permanently remove your data</div>
                            </div>
                        </div>
                        <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:text-rose-400 transition-colors" />
                    </button>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            <SubscriptionModal isOpen={subModalOpen} onClose={() => setSubModalOpen(false)} userSession={userSession} />
        </div>
    );
}
