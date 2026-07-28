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
                    <div className="text-left">
                        <h2 className="text-xl font-bold tracking-tight text-white">
                            {userSession.name || 'Guest User'}
                        </h2>
                        <p className="text-xs text-cyan-400 font-mono mt-0.5 uppercase tracking-wider">
                            {isPro ? 'Pro Member' : 'Free Member'}
                        </p>
                    </div>
                </div>

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
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Member Since</div>
                            <div className="text-sm font-semibold text-neutral-200 mt-1">
                                {stats.joinDate || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-6">
                    <h3 className="text-base font-bold text-white text-left">Settings</h3>

                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <div className="font-medium text-sm text-neutral-200">Dark Theme</div>
                            <div className="text-xs text-neutral-500 mt-0.5">Adjust the appearance of the store</div>
                        </div>
                        <button 
                            onClick={() => toggleSetting('dataSaver')}
                            className="w-12 h-6 rounded-full p-1 bg-cyan-500 transition-colors"
                        >
                            <div className="w-4 h-4 rounded-full bg-white translate-x-6 transition-transform" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <div className="font-medium text-sm text-neutral-200">Notifications</div>
                            <div className="text-xs text-neutral-500 mt-0.5">Receive order updates via email</div>
                        </div>
                        <button 
                            onClick={() => toggleSetting('emailAlerts')}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            {settings.emailAlerts ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
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
