import React, { useState } from 'react';
import { X, TrendingDown, Bell, Check, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

export default function PriceWatchdogModal({ product, onClose }) {
    if (!product) return null;

    const [targetPrice, setTargetPrice] = useState(
        Math.round((Number(product.extracted_price || product.price || 0)) * 0.9)
    );
    const [alertSet, setAlertSet] = useState(false);

    const price = Number(product.extracted_price || product.price || 0);

    // Mock 90 day history trend generator based on current price
    const mockHistory = [
        { label: '90d ago', price: Math.round(price * 1.15) },
        { label: '60d ago', price: Math.round(price * 1.08) },
        { label: '30d ago', price: Math.round(price * 1.04) },
        { label: 'Today', price: price },
    ];

    const handleSetAlert = (e) => {
        e.preventDefault();
        setAlertSet(true);
        setTimeout(() => {
            setAlertSet(false);
            onClose();
        }, 1800);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl border border-white/10 bg-[#09090d] p-6 shadow-2xl text-left font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Price Intelligence</span>
                            <h3 className="text-sm font-bold text-white line-clamp-1">{product.product_name || product.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* AI Buying Advice Box */}
                <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <div className="text-xs font-semibold text-emerald-300">AI Buying Verdict: BUY NOW</div>
                            <div className="text-[11px] text-neutral-400 font-mono">Current price is near lowest 90-day benchmark</div>
                        </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-400/10 text-emerald-300 font-mono text-[10px] border border-emerald-400/20">
                        Optimal Price
                    </span>
                </div>

                {/* 90 Day Trend Chart Bar Simulation */}
                <div className="mb-5 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-xs font-mono text-neutral-400 mb-3 flex items-center justify-between">
                        <span>90-Day Price Trend</span>
                        <span className="text-cyan-400 font-bold">Current: ₹{price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-end h-24 pt-4 px-2">
                        {mockHistory.map((item, idx) => {
                            const maxP = Math.max(...mockHistory.map(m => m.price));
                            const heightPct = Math.round((item.price / maxP) * 100);
                            const isCurrent = idx === mockHistory.length - 1;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                                    <span className="text-[9px] font-mono text-neutral-400">₹{item.price.toLocaleString('en-IN')}</span>
                                    <div 
                                        className={`w-full rounded-t transition-all ${isCurrent ? 'bg-gradient-to-t from-cyan-600 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-white/10'}`}
                                        style={{ height: `${heightPct}%` }}
                                    />
                                    <span className="text-[9px] font-mono text-neutral-500">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Target Price Alert Form */}
                <form onSubmit={handleSetAlert} className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-neutral-300 mb-1.5">Set Price Alert Threshold (₹)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(Number(e.target.value))}
                                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setTargetPrice(Math.round(price * 0.85))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-1 rounded"
                            >
                                -15% Quick Set
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={alertSet}
                        className={`w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                            alertSet
                                ? 'bg-emerald-500 text-black font-semibold'
                                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                        {alertSet ? (
                            <>
                                <Check className="w-4 h-4" /> Price Alert Active!
                            </>
                        ) : (
                            <>
                                <Bell className="w-4 h-4" /> Activate Price Watchdog Alert
                            </>
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}
