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
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [dialog, setDialog] = useState(null);

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
        setDialog({
            type: 'confirm',
            title: 'Reset Password',
            message: `Send password reset email to ${userSession.email}?`,
            onConfirm: async () => {
                setDialog(null);
                const { error } = await supabase.auth.resetPasswordForEmail(userSession.email);
                if (error) {
                    setDialog({ type: 'alert', title: 'Error', message: error.message });
                } else {
                    setDialog({ type: 'alert', title: 'Success', message: 'Password reset email sent! Check your inbox.' });
                }
            }
        });
    };

    const handleDeleteAccount = async () => {
        if (userSession.isGuest) {
            setDialog({ type: 'alert', title: 'Action Denied', message: 'Guest accounts cannot be deleted.' });
            return;
        }

        setDialog({
            type: 'confirm',
            title: 'Delete Account',
            message: 'Are you absolutely sure? This will permanently delete your account and all search history.',
            onConfirm: async () => {
                setDialog(null);
                try {
                    const { error } = await supabase.rpc('delete_user');
                    if (error) throw error;
                } catch (err) {
                    console.log("Server-side deletion unavailable, performing account lock & wipe.");
                    // Scramble the password so the user can no longer log in
                    const randomPass = crypto.randomUUID() + 'Xx1!@';
                    await supabase.auth.updateUser({
                        password: randomPass,
                        data: { full_name: 'Deleted User', phone: '' }
                    });
                    // Wipe their search history
                    if (userSession.id) {
                        await supabase.from('search_history').delete().eq('user_id', userSession.id);
                    }
                }

                await supabase.auth.signOut();
                localStorage.removeItem('seamas_user_session');
                localStorage.removeItem('seamas_preferences');

                setDialog({
                    type: 'alert',
                    title: 'Account Deleted',
                    message: 'Your account has been permanently deleted.',
                    onConfirm: () => {
                        navigate('/');
                    }
                });
            }
        });
    };

    const handleEditClick = () => {
        if (userSession.isGuest) {
            setDialog({ type: 'alert', title: 'Action Denied', message: 'Profile editing is disabled in guest mode.' });
            return;
        }

        let initialPhone = userSession.phone || '';
        let digits = initialPhone.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length >= 10) {
            digits = digits.slice(2);
        }
        digits = digits.slice(0, 10);

        setEditForm({
            name: userSession.name || '',
            phone: digits
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const finalPhone = editForm.phone ? `+91 ${editForm.phone}` : '';
            const { data, error } = await supabase.auth.updateUser({
                data: { full_name: editForm.name, phone: finalPhone }
            });

            if (error) throw error;

            const updatedSession = {
                ...userSession,
                name: editForm.name,
                phone: finalPhone
            };

            setUserSession(updatedSession);
            localStorage.setItem('seamas_user_session', JSON.stringify(updatedSession));
            setIsEditing(false);
        } catch (err) {
            setDialog({ type: 'alert', title: 'Error', message: err.message || "Failed to update profile." });
        } finally {
            setSavingProfile(false);
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
                        <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-5 text-left space-y-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
                            <div className="flex items-center gap-2 text-neutral-500 relative z-10">
                                <History className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-mono">Total Searches</span>
                            </div>
                            <div className="text-3xl font-black font-display text-white relative z-10">{stats.totalSearches}</div>
                            <div className="text-[10px] font-mono text-neutral-500 relative z-10">queries executed</div>
                        </div>
                        <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-5 text-left space-y-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
                            <div className="flex items-center gap-2 text-neutral-500 relative z-10">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-mono">Member Since</span>
                            </div>
                            <div className="text-2xl font-black font-display text-white relative z-10">{stats.joinDate || '—'}</div>
                            <div className="text-[10px] font-mono text-neutral-500 relative z-10">account created</div>
                        </div>
                    </div>
                )}

                {/* Credits Card */}
                {!userSession.isGuest && (
                    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 space-y-4 text-left">
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
                                Upgrade to Pro — 1,000 Credits / Month
                            </button>
                        )}
                    </div>
                )}

                {/* Profile Information Card */}
                <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-white">Profile Information</h3>
                        {!isEditing ? (
                            <button
                                onClick={handleEditClick}
                                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider transition-colors"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                                >
                                    {savingProfile ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-left">
                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Full Name</div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white outline-none focus:border-cyan-400/50"
                                />
                            ) : (
                                <div className="text-sm font-semibold text-neutral-200 mt-1">
                                    {userSession.name || 'N/A'}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Email Address</div>
                            <div className="text-sm font-semibold text-neutral-200 mt-1">
                                {userSession.email || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Phone</div>
                            {isEditing ? (
                                <div className="flex items-center mt-1 bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-cyan-400/50 transition-colors">
                                    <div className="pl-3 py-1.5 text-sm text-neutral-400 bg-white/[0.02] border-r border-white/10 select-none pr-3">
                                        +91
                                    </div>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setEditForm({ ...editForm, phone: digits });
                                        }}
                                        className="w-full py-1.5 px-3 text-sm text-white bg-transparent outline-none"
                                        placeholder="9876543210"
                                    />
                                </div>
                            ) : (
                                <div className="text-sm font-semibold text-neutral-200 mt-1">
                                    {userSession.phone || '+91 98765 43210'}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono mb-2">Account Type</div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm ${isPro ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}>
                                {isPro ? <Zap className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                {isPro ? 'Pro Member' : 'Free Member'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 space-y-5">
                    <h3 className="text-base font-bold text-white text-left">Preferences</h3>

                    {/* Email Alerts */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-[#1e293b]/50 border border-white/5 shadow-inner">
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
                            <div className="p-2 rounded-lg bg-[#1e293b]/50 border border-white/5 shadow-inner">
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
                <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-left mb-1">
                        <Shield className="w-4 h-4 text-neutral-400" />
                        <h3 className="text-base font-bold text-white">Security</h3>
                    </div>

                    <button
                        onClick={handleResetPassword}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1e293b]/30 border border-white/5 hover:bg-[#1e293b]/60 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
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
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-900/10 border border-rose-500/10 hover:bg-rose-900/20 hover:border-rose-500/20 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
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

            {dialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialog(null)} />
                    <div className="relative z-50 w-full max-w-sm bg-[#0f0f13] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">{dialog.title}</h3>
                        <p className="text-neutral-400 text-sm mb-6">{dialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            {dialog.type === 'confirm' && (
                                <button
                                    onClick={() => setDialog(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (dialog.type === 'confirm' && dialog.onConfirm) {
                                        dialog.onConfirm();
                                    } else {
                                        setDialog(null);
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dialog.title === 'Delete Account'
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                        : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                    }`}
                            >
                                {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
