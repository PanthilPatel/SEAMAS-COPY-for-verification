import React, { useState, useMemo } from 'react';
import { TrendingDown, ShieldCheck, Sparkles } from 'lucide-react';

export default function MarketTicker({ items = [] }) {
    const [paused, setPaused] = useState(false);

    // Filter valid items with real prices
    const validDeals = useMemo(() => {
        if (!items || items.length === 0) return [];
        return items.filter(i => {
            const p = Number(i.extracted_price || i.price || 0);
            return p > 0;
        });
    }, [items]);

    // Idle state: do not render any fake or static ticker
    if (validDeals.length === 0) {
        return null;
    }

    const tickerItems = validDeals.slice(0, 10).map((product, idx) => {
        const price = Number(product.extracted_price || product.price || 0);
        const original = product.original_price ? Number(product.original_price) : null;
        const discount = original && original > price ? Math.round(((original - price) / original) * 100) : 0;
        const marketplace = product.marketplace || 'Store';
        const name = product.product_name || product.title || 'Product';

        let tag = 'Matched Deal';
        let Icon = Sparkles;
        let text = `${marketplace}: ${name} at ₹${price.toLocaleString('en-IN')}`;

        if (discount > 0) {
            tag = `${discount}% Price Drop`;
            Icon = TrendingDown;
            text = `${marketplace}: ${name} dropped to ₹${price.toLocaleString('en-IN')} (save ₹${(original - price).toLocaleString('en-IN')})`;
        } else if (product.is_verified) {
            tag = 'Verified Offer';
            Icon = ShieldCheck;
            text = `${marketplace}: ${name} confirmed at ₹${price.toLocaleString('en-IN')}`;
        }

        return {
            id: idx,
            tag,
            Icon,
            text
        };
    });

    return (
        <div 
            className="w-full bg-neutral-950/80 border-b border-white/[0.06] backdrop-blur-md px-4 py-1.5 overflow-hidden select-none z-20 flex items-center text-left transition-all duration-500 animate-fade-in"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white/10">
                <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-md shadow-[0_0_12px_-3px_rgba(34,211,238,0.3)]">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                    </span>
                    <span className="text-cyan-400 font-mono text-[9px] uppercase tracking-widest font-semibold">Live Feed</span>
                </div>
            </div>

            <div 
                className="flex-1 overflow-hidden relative"
                style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)' }}
            >
                <div 
                    className={`flex items-center gap-8 whitespace-nowrap ${paused ? '' : 'animate-marquee'}`}
                    style={{ display: 'inline-flex' }}
                >
                    {[...tickerItems, ...tickerItems].map((item, idx) => {
                        const Icon = item.Icon;
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
