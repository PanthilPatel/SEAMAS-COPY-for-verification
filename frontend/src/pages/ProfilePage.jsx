import React, { useState, useEffect } from 'react';
import { User, Mail, Zap, LogOut, ArrowLeft, Calendar, History, Settings, ShieldAlert, Key, Trash2, Bell, Database } from 'lucide-react';
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
            <div className="animate-pulse w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        </div>
    );

    const isPro = userSession?.tier === 'Pro';
    const currentCredits = userSession?.isGuest ? 0 : (userSession?.credits ?? 50);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Profile & Subscription) */}
                    <div className="space-y-6 lg:col-span-1">
                        
                        {/* Profile Card */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center mb-4 text-4xl font-bold shadow-lg shadow-cyan-500/20">
                                    {userSession.name?.slice(0, 2).toUpperCase() || 'GU'}
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {userSession.name || 'Guest User'}
                                </h2>
                                <p className="text-neutral-400 text-sm mt-1 mb-6 flex items-center gap-1.5 justify-center">
                                    <Mail className="w-3.5 h-3.5" /> {userSession.email || 'No email provided'}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2.5 rounded-xl font-medium text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Subscription Card */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 relative overflow-hidden">
                            {isPro && <div className="absolute inset-0 bg-violet-500/5 pointer-events-none" />}
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className={`w-5 h-5 ${isPro ? 'text-violet-400' : 'text-neutral-400'}`} />
                                <h3 className="font-semibold">Subscription Plan</h3>
                            </div>
                            
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Current Tier</div>
                                    <div className={`text-2xl font-black ${isPro ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400' : 'text-white'}`}>
                                        {userSession.tier || 'Free'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Tokens</div>
                                    <div className="text-xl font-mono text-neutral-200">{currentCredits.toLocaleString()}</div>
                                </div>
                            </div>

                            {!isPro && !userSession.isGuest && (
                                <button 
                                    onClick={() => setSubModalOpen(true)}
                                    className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 transition-all text-white shadow-lg shadow-violet-500/25"
                                >
                                    Upgrade to Pro
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Stats, Prefs, Security) */}
                    <div className="space-y-6 lg:col-span-2">
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                                    <History className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-neutral-400 text-sm">Total Searches</div>
                                    <div className="text-2xl font-bold font-mono">{stats.totalSearches}</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <Calendar className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-neutral-400 text-sm">Member Since</div>
                                    <div className="text-lg font-bold">{stats.joinDate || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Settings className="w-5 h-5 text-neutral-400" />
                                <h3 className="font-semibold">Preferences</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-3">
                                        <Bell className="w-5 h-5 text-neutral-400 mt-0.5" />
                                        <div>
                                            <div className="font-medium">Email Notifications</div>
                                            <div className="text-sm text-neutral-500">Receive alerts when tracked product prices drop.</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleSetting('emailAlerts')}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.emailAlerts ? 'bg-cyan-500' : 'bg-neutral-700'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.emailAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-3">
                                        <Database className="w-5 h-5 text-neutral-400 mt-0.5" />
                                        <div>
                                            <div className="font-medium">Data Saver Mode</div>
                                            <div className="text-sm text-neutral-500">Limits deep web scraping to preserve your token balance.</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleSetting('dataSaver')}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.dataSaver ? 'bg-cyan-500' : 'bg-neutral-700'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.dataSaver ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Security & Danger Zone */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldAlert className="w-5 h-5 text-neutral-400" />
                                <h3 className="font-semibold">Security</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05]">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-neutral-400" />
                                        <div className="font-medium text-sm">Change Password</div>
                                    </div>
                                    <button 
                                        onClick={handleResetPassword}
                                        className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors text-sm font-medium"
                                    >
                                        Send Reset Email
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="w-5 h-5 text-rose-400" />
                                        <div>
                                            <div className="font-medium text-sm text-rose-400">Delete Account</div>
                                            <div className="text-xs text-rose-400/70">Permanently delete your data.</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleDeleteAccount}
                                        className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors text-sm font-medium"
                                    >
                                        Delete...
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            <SubscriptionModal isOpen={subModalOpen} onClose={() => setSubModalOpen(false)} userSession={userSession} />
        </div>
    );
}
