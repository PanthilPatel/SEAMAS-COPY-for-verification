import React, { useState } from 'react';
import { Check, X, Shield, Zap, Lock } from 'lucide-react';
import axios from 'axios';

export default function SubscriptionModal({ isOpen, onClose, userSession }) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!userSession?.id || userSession?.id === 'guest') {
            alert('Please sign in to upgrade your account.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create invoice (payment link) on backend
            const { data: orderData } = await axios.post('http://localhost:8000/api/create-order', {
                name: userSession?.name,
                email: userSession?.email
            });

            // 2. Redirect to Razorpay Invoice Page
            window.location.href = orderData.short_url;
        } catch (err) {
            console.error('Invoice creation failed', err);
            alert('Failed to initiate payment.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#0a0a0f] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-white text-left animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Upgrade to Pro</h2>
                    <p className="text-neutral-400 text-sm mt-1">Unlock massive search quotas and premium features.</p>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 mb-6">
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-black">₹1</span>
                        <span className="text-neutral-400 text-sm font-medium">/ Month</span>
                    </div>

                    <ul className="space-y-3">
                        {['5,000 Search Credits instantly', 'Premium Multi-Agent Reasoning', 'Priority Live Scraping', 'No daily rate limits'].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-neutral-200">
                                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                    {loading ? 'Initializing Secure Checkout...' : 'Upgrade Now'}
                </button>
                <div className="mt-3 text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Secure payment powered by Razorpay
                </div>
            </div>
        </div>
    );
}
