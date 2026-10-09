import React, { useState } from 'react';
import { Check, X, Shield, Zap, Lock, PlusCircle, Sparkles, Calendar } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/config';

const TOPUP_OPTIONS = [
    {
        id: 'booster_100',
        name: 'Mini Booster',
        credits: 100,
        amount: 100,
        tag: 'Popular',
        desc: 'Great for quick product searches'
    },
    {
        id: 'booster_250',
        name: 'Pro Booster',
        credits: 250,
        amount: 200,
        tag: 'Best Value',
        desc: 'Deep multi-agent comparison runs'
    },
    {
        id: 'booster_500',
        name: 'Ultra Booster',
        credits: 500,
        amount: 300,
        tag: 'Maximum Power',
        desc: 'Extensive product research & reviews'
    }
];

export default function SubscriptionModal({ isOpen, onClose, userSession, initialTab = null }) {
    const isPro = userSession?.tier?.toLowerCase() === 'pro';
    const [activeTab, setActiveTab] = useState(initialTab || (isPro ? 'topup' : 'monthly'));
    const [selectedPack, setSelectedPack] = useState('booster_100');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || (isPro ? 'topup' : 'monthly'));
        }
    }, [isOpen, initialTab, isPro]);

    if (!isOpen) return null;

    const handleCheckout = async (planType, packId = null) => {
        if (!userSession?.id || userSession?.id === 'guest') {
            alert('Please sign in to continue.');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Please sign in to continue.');
            const payload = { plan_type: planType };
            if (planType === 'topup') {
                payload.pack_id = packId || selectedPack;
            }

            const { data: orderData } = await axios.post(`${API_BASE_URL}/api/create-order`, payload, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            window.location.href = orderData.short_url;
        } catch (err) {
            console.error('Invoice creation failed', err);
            alert('Failed to initiate payment. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-white text-left animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6 w-fit">
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'monthly'
                                ? 'bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        Pro Monthly Plan
                    </button>
                    <button
                        onClick={() => setActiveTab('topup')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'topup'
                                ? 'bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Token Top-Ups
                    </button>
                </div>

                {activeTab === 'monthly' ? (
                    <div>
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Pro Monthly Subscription</h2>
                            <p className="text-neutral-400 text-sm mt-1">Unlock massive monthly search quotas and full multi-agent features.</p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 mb-6">
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-black">₹100</span>
                                <span className="text-neutral-400 text-sm font-medium">/ Month</span>
                            </div>

                            <ul className="space-y-3">
                                {[
                                    '500 Search Credits refreshed every month',
                                    'Access to On-Demand Token Top-Ups',
                                    'Premium Multi-Agent Reasoning',
                                    'Priority Storefront Scraping & Verified Deals',
                                    'No daily query throttling'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-neutral-200">
                                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {isPro && (
                                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                                    <span className="text-neutral-400 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Next Renewal Date</span>
                                    </span>
                                    <span className="text-cyan-300 font-semibold">
                                        {userSession?.renewAt
                                            ? new Date(userSession.renewAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : 'Not available'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleCheckout('pro_monthly')}
                            disabled={loading || isPro}
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                        >
                            {loading
                                ? 'Initializing Secure Checkout...'
                                : isPro
                                ? 'Currently Active (Pro Member)'
                                : 'Subscribe Now (Monthly)'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center mb-4">
                                <PlusCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Token Top-Up Booster Packs</h2>
                            <p className="text-neutral-400 text-sm mt-1">
                                {isPro
                                    ? 'Out of monthly credits? Instantly boost your balance anytime.'
                                    : 'Need extra search power? Top up your credits instantly.'}
                            </p>
                        </div>

                        <div className="grid gap-3 mb-6">
                            {TOPUP_OPTIONS.map((pack) => {
                                const isSelected = selectedPack === pack.id;
                                return (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack.id)}
                                        className={`cursor-pointer rounded-xl p-4 border transition-all flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-violet-600/10 to-sky-600/10 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/40'
                                                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? 'border-violet-400 bg-violet-600 text-white'
                                                        : 'border-neutral-600'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-white">{pack.name}</span>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                                                        +{pack.credits} Credits
                                                    </span>
                                                </div>
                                                <div className="text-xs text-neutral-400 mt-0.5">{pack.desc}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">₹{pack.amount}</div>
                                            <div className="text-[10px] text-neutral-500">Instant Credit</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handleCheckout('topup', selectedPack)}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-violet-600 to-sky-600 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                            {loading ? 'Initializing Secure Checkout...' : 'Purchase Booster Pack'}
                        </button>
                    </div>
                )}

                <div className="mt-4 text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Secure payment powered by Razorpay
                </div>
            </div>
        </div>
    );
}
