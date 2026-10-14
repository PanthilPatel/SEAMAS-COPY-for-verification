import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Zap, LogOut, ArrowLeft, Calendar, History, Settings,
    ShieldAlert, Key, Trash2, Bell, Database, CreditCard, Shield,
    Sparkles, CheckCircle2, ChevronRight, Phone, Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import SubscriptionModal from '../components/SubscriptionModal';
import { apiService } from '../services/api';
import { settleWithin } from '../lib/async';
import { normalizeCreditSnapshot, normalizeProfileSettings } from '../lib/profileState';

export default function ProfilePage() {
    const navigate = useNavigate();
    const loadEpoch = useRef(0);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [loadError, setLoadError] = useState('');
    const [userSession, setUserSession] = useState(() => {
        try {
            const local = localStorage.getItem('seamas_user_session');
            if (local) {
                const parsed = JSON.parse(local);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
                return {
                id: parsed.id,
                email: parsed.email,
                name: parsed.name,
                isGuest: parsed.isGuest,
                tier: parsed.tier || 'Free',
                credits: parsed.credits ?? 50,
                phone: parsed.phone,
                renewAt: parsed.renewAt || null
            };
            }
        } catch (error) {
            console.warn('Could not restore saved profile session:', error);
        }
        return null;
    });
    const [stats, setStats] = useState({ totalSearches: 0, joinDate: null });
    const [settings, setSettings] = useState({
        emailAlerts: true,
        dataSaver: false,
        ambientGlow: true,
        defaultSteering: 'balanced',
        preferredCurrency: 'INR'
    });
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [subModalTab, setSubModalTab] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [dialog, setDialog] = useState(null);

    useEffect(() => {
        const epoch = ++loadEpoch.current;
        const active = () => epoch === loadEpoch.current;
        const loadProfile = async () => {
            setLoadError('');
            try {
                let session;
                try {
                    session = JSON.parse(localStorage.getItem('seamas_user_session') || 'null');
                } catch {
                    localStorage.removeItem('seamas_user_session');
                }
                if (!session || typeof session !== 'object' || Array.isArray(session)) {
                    navigate('/login', { replace: true });
                    return;
                }
                if (!session.isGuest && (!session.id || !session.email)) {
                    localStorage.removeItem('seamas_user_session');
                    navigate('/login', { replace: true });
                    return;
                }
                if (active()) setUserSession(session);

                if (!session.isGuest) {
                    const [authResult, historyResult, creditsResult] = await Promise.allSettled([
                        settleWithin(supabase.auth.getUser(), 8000, 'Profile session lookup'),
                        settleWithin(supabase.from('search_history').select('*', { count: 'exact', head: true }).eq('user_id', session.id), 8000, 'Search history lookup'),
                        settleWithin(apiService.getCredits(), 8000, 'Subscription lookup')
                    ]);

                    let joinDateStr = 'Unknown';
                    const user = authResult.status === 'fulfilled' ? authResult.value.data?.user : null;
                    if (authResult.status !== 'fulfilled' || !user || user.id !== session.id) {
                        localStorage.removeItem('seamas_user_session');
                        navigate('/login', { replace: true });
                        return;
                    }
                    if (user?.created_at) {
                        joinDateStr = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                    const count = historyResult.status === 'fulfilled' ? historyResult.value.count : null;
                    if (creditsResult.status === 'fulfilled') {
                        const data = normalizeCreditSnapshot(creditsResult.value);
                        const updatedSession = {
                            ...session,
                            tier: data.tier,
                            credits: data.credits,
                            renewAt: data.renew_at || session.renewAt || null
                        };
                        if (active()) {
                            setUserSession(updatedSession);
                            localStorage.setItem('seamas_user_session', JSON.stringify(updatedSession));
                        }
                    } else {
                        throw new Error('Your profile credits could not be verified. Check your connection and retry.');
                    }

                    if (active()) setStats({ totalSearches: count || 0, joinDate: joinDateStr });
                }

                const preferences = localStorage.getItem('seamas_preferences');
                const normalizedSettings = normalizeProfileSettings(preferences, settings);
                if (active()) setSettings(normalizedSettings);
                if (preferences && normalizedSettings === settings) localStorage.removeItem('seamas_preferences');
            } catch (error) {
                console.error('Profile could not be fully refreshed:', error);
                if (active()) setLoadError(error?.message || 'Profile could not be loaded. Please retry.');
            } finally {
                if (active()) setLoading(false);
            }
        };
        loadProfile();
        return () => { loadEpoch.current += 1; };
    }, [navigate, loadAttempt]);

    const handleLogout = async () => {
        loadEpoch.current += 1;
        try {
            await settleWithin(supabase.auth.signOut(), 4000, 'Sign out');
        } catch (error) {
            console.warn('Remote sign-out did not complete; clearing the local session:', error);
        }
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
                } catch (error) {
                    setDialog({
                        type: 'alert',
                        title: 'Account deletion failed',
                        message: error?.message || 'The account could not be deleted. Please try again later.'
                    });
                    return;
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
            const { error } = await supabase.auth.updateUser({
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

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div role="status" aria-label="Loading profile" className="animate-spin w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent"></div>
        </div>
    );

    if (loadError) return (
        <main className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 text-white">
            <section role="alert" className="max-w-md rounded-2xl border border-white/10 bg-[#0f1422] p-7 text-center">
                <h1 className="text-xl font-bold">Profile unavailable</h1>
                <p className="mt-3 text-sm text-neutral-300">{loadError}</p>
                <button onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }} className="mt-6 rounded-xl bg-cyan-600 px-5 py-3 font-semibold hover:bg-cyan-500">
                    Retry
                </button>
            </section>
        </main>
    );

    if (!userSession) return (
        <main className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 text-white">
            <section role="alert" className="rounded-2xl border border-white/[0.08] bg-[#121215] p-7 text-center shadow-xl">
                <h1 className="text-xl font-bold font-display">Profile unavailable</h1>
                <p className="mt-3 text-sm text-zinc-400">Your session could not be restored.</p>
                <button onClick={() => navigate('/login', { replace: true })} className="mt-6 rounded-xl bg-[#E5C878] text-[#09090B] px-5 py-3 font-semibold hover:bg-white transition-colors">Sign in again</button>
            </section>
        </main>
    );

    const isPro = userSession?.tier === 'Pro';
    const basePlanQuota = isPro ? 500 : 50;
    const currentCredits = userSession?.isGuest ? 0 : (userSession?.credits ?? basePlanQuota);
    const maxCapacity = Math.max(basePlanQuota, currentCredits);
    const creditPercent = maxCapacity > 0 ? Math.min(100, Math.round((currentCredits / maxCapacity) * 100)) : 0;
    const addOnCredits = Math.max(0, currentCredits - basePlanQuota);

    // Format renewal date for Monthly Pro subscription
    const formattedRenewalDate = (() => {
        if (!isPro) return null;
        if (!userSession?.renewAt) return null;
        const renewalDate = new Date(userSession.renewAt);
        if (Number.isNaN(renewalDate.getTime())) return null;
        return renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    })();

    return (
        <div className="relative min-h-screen text-white p-4 md:p-8 lg:p-12 overflow-y-auto bg-[#09090B] selection:bg-[#E6C762]/30 selection:text-[#F3E5AB]">
            {/* Ambient Background Lights & Studio Spotlight */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[55rem] h-[32rem] bg-[radial-gradient(ellipse_at_center,rgba(230,199,98,0.1)_0%,transparent_70%)] blur-3xl pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">

                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#E6C762]/40 text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 group"
                            title="Return to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#E6C762]" />
                        </button>
                        <div className="text-left">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display text-white">
                                Account Console
                            </h1>
                            <p className="text-xs text-zinc-400 font-mono">Manage subscription, credentials & multi-agent telemetry</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono border backdrop-blur-md ${
                            isPro
                                ? 'bg-[#E6C762]/15 text-[#E6C762] border-[#E6C762]/35 shadow-sm'
                                : 'bg-white/[0.03] text-zinc-400 border-white/[0.08]'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-[#E6C762] animate-pulse' : 'bg-zinc-500'}`} />
                            {isPro ? 'PRO ACTIVE' : 'FREE TIER'}
                        </span>
                    </div>
                </div>

                {/* Hero Profile Banner Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121215] p-6 md:p-8 backdrop-blur-xl shadow-2xl text-left">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E6C762]/[0.08] to-transparent rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/15 flex items-center justify-center text-2xl font-bold text-[#E6C762] shadow-xl ring-4 ring-white/[0.06]">
                                    {userSession.name?.slice(0, 2).toUpperCase() || 'GU'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 p-1 bg-[#09090B] rounded-full">
                                    <div className="w-4 h-4 rounded-full bg-[#34D399] flex items-center justify-center ring-2 ring-[#09090B]">
                                        <CheckCircle2 className="w-3 h-3 text-[#09090B]" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-left space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                                        {userSession.name || 'Guest User'}
                                    </h2>
                                    {isPro && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E6C762]/15 border border-[#E6C762]/35 text-[#E6C762] shadow-sm">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-400 font-mono">
                                    {userSession.email || 'guest@seamas.ai'}
                                </p>

                                {isPro ? (
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#E5C878] pt-1">
                                        <Award className="w-3.5 h-3.5 text-[#E6C762]" />
                                        <span>
                                            {formattedRenewalDate 
                                                ? `Pro Membership Active · Renews on ${formattedRenewalDate}` 
                                                : 'Pro Membership Active · Priority Multi-Agent Access'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-[11px] font-mono text-zinc-500 pt-0.5">
                                        Standard Free Quota Active
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center">
                            {!isPro ? (
                                <button
                                    onClick={() => {
                                        setSubModalTab('monthly');
                                        setSubModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Zap className="w-4 h-4 fill-[#09090B]" />
                                    Upgrade to Pro
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSubModalTab('topup');
                                        setSubModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#E5C878]/15 hover:bg-[#E5C878]/25 text-[#F3E5AB] border border-[#E5C878]/35 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Sparkles className="w-4 h-4 text-[#E6C762]" />
                                    + Add Credits
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                {!userSession.isGuest && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] p-5 text-left backdrop-blur-md shadow-xl group hover:border-[#E6C762]/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-[#E6C762]" />
                                    Queries Run
                                </span>
                                <span className="w-2 h-2 rounded-full bg-[#E6C762]/60 group-hover:bg-[#E6C762] group-hover:shadow-[0_0_8px_rgba(230,199,98,0.8)] transition-all" />
                            </div>
                            <div className="text-3xl font-bold font-display text-white tracking-tight tabular-nums">
                                {stats.totalSearches}
                            </div>
                            <p className="text-[11px] font-mono text-zinc-500 mt-1">Multi-agent deep scans</p>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] p-5 text-left backdrop-blur-md shadow-xl group hover:border-[#E6C762]/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#E6C762]" />
                                    Member Since
                                </span>
                                <span className="w-2 h-2 rounded-full bg-[#E6C762]/60 group-hover:bg-[#E6C762] group-hover:shadow-[0_0_8px_rgba(230,199,98,0.8)] transition-all" />
                            </div>
                            <div className="text-2xl font-bold font-display text-white tracking-tight">
                                {stats.joinDate || '—'}
                            </div>
                            <p className="text-[11px] font-mono text-zinc-500 mt-1">Verified account history</p>
                        </div>
                    </div>
                )}

                {/* Credits Balance Showcase Card */}
                {!userSession.isGuest && (
                    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121215] p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-left space-y-5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6C762]/[0.05] rounded-full blur-3xl pointer-events-none" />

                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white tracking-tight">Search Quota & Credits</h3>
                                    <p className="text-[11px] font-mono text-zinc-400">Real-time token allocation</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                {addOnCredits > 0 && (
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#E6C762]/15 border border-[#E6C762]/35 text-[#E6C762] shadow-sm flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-[#E6C762]" />
                                        +{addOnCredits} Booster Added
                                    </span>
                                )}
                                <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
                                    isPro
                                        ? 'bg-[#E6C762]/15 border-[#E6C762]/35 text-[#E6C762]'
                                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400'
                                }`}>
                                    {isPro ? 'Pro Monthly Plan' : 'Free Plan'}
                                </span>
                            </div>
                        </div>

                        {/* Main Numbers & Progress */}
                        <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-inner">
                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-white tabular-nums">
                                        {currentCredits}
                                    </span>
                                    <span className="text-xs font-mono text-[#E5C878] font-medium">total available credits</span>
                                </div>

                                <div className="text-right font-mono text-xs text-zinc-400">
                                    {addOnCredits > 0 ? (
                                        <span>
                                            <strong className="text-white">{basePlanQuota}</strong> Plan + <strong className="text-[#E6C762]">{addOnCredits}</strong> Booster
                                        </span>
                                    ) : (
                                        <span>
                                            Capacity: <strong className="text-white">{basePlanQuota}</strong> credits
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar with champagne gold styling */}
                            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#F5E6B3] via-[#E5C878] to-[#C9A449] shadow-[0_0_12px_rgba(230,199,98,0.4)] transition-all duration-700"
                                    style={{ width: `${creditPercent}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                                <span>{creditPercent}% remaining balance</span>
                                <span>5–20 credits / query</span>
                            </div>
                        </div>

                        {/* Separate Add-On Credits Highlight Box */}
                        {addOnCredits > 0 && (
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs text-zinc-200">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#E6C762] shrink-0" />
                                    <span>
                                        <strong>{addOnCredits} credits</strong> purchased separately from the {isPro ? 'Pro' : 'Free'} plan.
                                    </span>
                                </div>
                                <span className="font-mono text-[10px] bg-[#E6C762]/10 border border-[#E6C762]/30 text-[#E6C762] px-2 py-0.5 rounded-full shrink-0">
                                    Never Expires
                                </span>
                            </div>
                        )}

                        {/* Renewal Date Banner for Pro Plan */}
                        {isPro && formattedRenewalDate && (
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Calendar className="w-4 h-4 text-[#E6C762] shrink-0" />
                                    <span>Monthly Plan Cycle Renewal:</span>
                                </div>
                                <span className="text-[#E6C762] font-semibold bg-[#E6C762]/10 px-2 py-0.5 rounded border border-[#E6C762]/30">
                                    {formattedRenewalDate}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setSubModalTab('topup');
                                    setSubModalOpen(true);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#E5C878]/15 hover:bg-[#E5C878]/25 border border-[#E5C878]/35 text-[#F3E5AB] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-[#E6C762]" />
                                + Buy More Credits (Add-On)
                            </button>

                            {!isPro ? (
                                <button
                                    onClick={() => {
                                        setSubModalTab('monthly');
                                        setSubModalOpen(true);
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Zap className="w-4 h-4 fill-[#09090B]" />
                                    Upgrade to Pro (₹100/mo)
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSubModalTab('monthly');
                                        setSubModalOpen(true);
                                    }}
                                    className="py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Award className="w-3.5 h-3.5 text-[#E6C762]" />
                                    View Plan Details
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Information & Credentials */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 md:p-7 shadow-xl space-y-6 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2.5 text-left">
                            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#E6C762]">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white tracking-tight">Profile Credentials</h3>
                                <p className="text-[11px] font-mono text-zinc-400">Account identity and contacts</p>
                            </div>
                        </div>

                        {!isEditing ? (
                            <button
                                onClick={handleEditClick}
                                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#E6C762]/10 border border-white/[0.08] hover:border-[#E6C762]/35 text-[#F3E5AB] text-xs font-semibold uppercase tracking-wider transition-all"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="px-4 py-1.5 rounded-xl bg-[#E5C878] hover:bg-[#F3E5AB] text-[#09090B] text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {savingProfile ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                        {/* Name */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                <User className="w-3 h-3 text-[#E6C762]" />
                                Full Name
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full mt-1 bg-black/60 border border-[#E6C762]/40 rounded-lg py-1.5 px-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#E6C762]"
                                />
                            ) : (
                                <div className="text-sm font-semibold text-white pt-0.5">
                                    {userSession.name || 'Not provided'}
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-[#E6C762]" />
                                Registered Email
                            </div>
                            <div className="text-sm font-semibold text-white pt-0.5 truncate">
                                {userSession.email || 'N/A'}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#E6C762]" />
                                Mobile Number
                            </div>
                            {isEditing ? (
                                <div className="flex items-center mt-1 bg-black/60 border border-[#E6C762]/40 rounded-lg overflow-hidden">
                                    <div className="pl-3 py-1.5 text-xs text-zinc-400 bg-white/[0.05] border-r border-white/10 select-none pr-3 font-mono">
                                        +91
                                    </div>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setEditForm({ ...editForm, phone: digits });
                                        }}
                                        className="w-full py-1.5 px-3 text-sm text-white bg-transparent outline-none font-mono"
                                        placeholder="9876543210"
                                    />
                                </div>
                            ) : (
                                <div className="text-sm font-semibold text-white pt-0.5 font-mono">
                                    {userSession.phone || '+91 ••••• •••••'}
                                </div>
                            )}
                        </div>

                        {/* Account Tier */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                <Award className="w-3 h-3 text-[#E6C762]" />
                                Tier Status
                            </div>
                            <div className="pt-0.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    isPro
                                        ? 'bg-[#E6C762]/15 text-[#E6C762] border border-[#E6C762]/35'
                                        : 'bg-white/[0.05] text-zinc-300 border border-white/10'
                                }`}>
                                    {isPro ? <Zap className="w-3.5 h-3.5 text-[#E6C762]" /> : <Shield className="w-3.5 h-3.5 text-zinc-400" />}
                                    {isPro ? 'Pro Monthly Member' : 'Free Member'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Preferences Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 md:p-7 shadow-xl space-y-5 text-left">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#E6C762]">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">System Preferences</h3>
                            <p className="text-[11px] font-mono text-zinc-400">Agent steering and performance toggles</p>
                        </div>
                    </div>

                    {/* Email Alerts */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-semibold text-sm text-zinc-200">Smart Deal Alerts</div>
                                <div className="text-xs text-zinc-500">Get notified when tracked prices drop to historic lows</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('emailAlerts')}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings.emailAlerts ? 'bg-[#E6C762]' : 'bg-white/[0.08]'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#09090B] transition-transform duration-300 ${settings.emailAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Data Saver */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                                <Database className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-semibold text-sm text-zinc-200">High-Speed Data Mode</div>
                                <div className="text-xs text-zinc-500">Optimizes network payload for ultra-fast agent synthesis</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('dataSaver')}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings.dataSaver ? 'bg-[#E6C762]' : 'bg-white/[0.08]'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#09090B] transition-transform duration-300 ${settings.dataSaver ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Security & Danger Area */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 md:p-7 shadow-xl space-y-4 text-left">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-300">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">Security & Account</h3>
                            <p className="text-[11px] font-mono text-zinc-400">Access credentials & session management</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                            onClick={handleResetPassword}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                                    <Key className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-zinc-200 group-hover:text-white">Reset Password</div>
                                    <div className="text-[11px] text-zinc-500">Send reset link to email</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/[0.03] hover:bg-rose-500/[0.08] border border-rose-500/15 hover:border-rose-500/30 transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-rose-300 group-hover:text-rose-200">Delete Account</div>
                                    <div className="text-[11px] text-zinc-500">Erase all profile history</div>
                                </div>
                            </div>
                            <ShieldAlert className="w-4 h-4 text-rose-500/70 group-hover:text-rose-400 transition-colors" />
                        </button>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleLogout}
                            className="w-full py-3.5 rounded-2xl font-semibold text-xs uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out of Session
                        </button>
                    </div>
                </div>

            </div>

            <SubscriptionModal
                isOpen={subModalOpen}
                onClose={() => setSubModalOpen(false)}
                userSession={userSession}
                initialTab={subModalTab}
                onSuccess={(newTier, newCredits) => {
                    const updated = {
                        ...userSession,
                        tier: newTier || userSession.tier,
                        credits: newCredits ?? userSession.credits
                    };
                    setUserSession(updated);
                    localStorage.setItem('seamas_user_session', JSON.stringify(updated));
                }}
            />

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
