import React, { useState } from 'react';
import { Zap, TrendingDown, ShieldCheck, Sparkles, Activity } from 'lucide-react';

const INITIAL_TICKER_ITEMS = [
    { id: 1, type: 'deal', text: 'Amazon: Sony WH-1000XM5 price dropped by 14% to ₹25,990', icon: TrendingDown, tag: 'Price Dip' },
    { id: 2, type: 'agent', text: 'Price Comparison Agent matched 18 sellers across Flipkart & Amazon', icon: Sparkles, tag: 'Agent Activity' },
    { id: 3, type: 'trust', text: 'Review Analyzer verified 420+ authentic buyer reviews for Keychron K2', icon: ShieldCheck, tag: 'Verified Deal' },
    { id: 4, type: 'deal', text: 'Flipkart: Apple Watch Series 9 down to ₹34,999 (Limited Stock)', icon: Zap, tag: 'Flash Deal' },
    { id: 5, type: 'system', text: 'Multi-Agent Pipeline operating at 99.9% uptime (Avg latency: 1.2s)', icon: Activity, tag: 'System Status' },
];

export default function MarketTicker() {
    const [paused, setPaused] = useState(false);

    return (
        <div 
            className="w-full bg-neutral-950/80 border-b border-white/[0.06] backdrop-blur-md px-4 py-1.5 overflow-hidden select-none z-20 flex items-center text-left"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white/10 text-cyan-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span>Live Feed</span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div 
                    className={`flex items-center gap-8 whitespace-nowrap ${paused ? '' : 'animate-marquee'}`}
                    style={{ display: 'inline-flex' }}
                >
                    {[...INITIAL_TICKER_ITEMS, ...INITIAL_TICKER_ITEMS].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 text-xs text-neutral-300">
                                <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-medium text-cyan-300 border border-white/5">
                                    <Icon className="w-3 h-3 text-cyan-400" />
                                    {item.tag}
                                </span>
                                <span className="text-neutral-300 font-sans text-[11px]">{item.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
