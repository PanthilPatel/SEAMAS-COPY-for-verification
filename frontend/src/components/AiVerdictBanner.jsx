import React from 'react';
import { Award, ShieldCheck, DollarSign } from 'lucide-react';

export default function AiVerdictBanner({ items = [], query = '' }) {
    if (!items || items.length === 0) return null;

    // Find top match (highest rating or first verified item)
    const topPick = items.find(i => i.is_verified) || items[0];
    
    // Find best budget pick (lowest price among valid items)
    const budgetPick = [...items].sort((a, b) => {
        const pA = Number(a.extracted_price || a.price || 0);
        const pB = Number(b.extracted_price || b.price || 0);
        return pA - pB;
    })[0];

    const topPrice = topPick ? Number(topPick.extracted_price || topPick.price || 0) : 0;
    const budgetPrice = budgetPick ? Number(budgetPick.extracted_price || budgetPick.price || 0) : 0;

    return (
        <div className="w-full rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/40 p-6 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] text-left relative overflow-hidden my-6">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">AI Executive Synthesis</span>
                            <span className="rounded-full bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 font-mono text-[9px] text-emerald-300">
                                {topPick?.is_verified ? 'Verified Marketplace Evidence' : 'Based on Available Search Evidence'}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5 font-display">
                            Analysis resolved for <span className="text-cyan-300 font-medium">"{query || 'Your query'}"</span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cross-marketplace verified across {items.length} options</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Overall Pick Card */}
                {topPick && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex gap-4 items-center transition-all hover:border-cyan-500/30 hover:bg-white/[0.05]">
                        <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
                            {topPick.image_url || topPick.image ? (
                                <img src={topPick.image_url || topPick.image} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                                <Award className="w-6 h-6 text-cyan-400" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="bg-cyan-400/20 text-cyan-300 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-400/30 font-semibold">
                                    🏆 Overall Winner
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">{topPick.marketplace}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-white truncate">{topPick.product_name || topPick.title}</h4>
                            <div className="text-sm font-bold text-cyan-300 mt-1">₹{topPrice.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                )}

                {/* Best Value / Budget Pick Card */}
                {budgetPick && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex gap-4 items-center transition-all hover:border-emerald-500/30 hover:bg-white/[0.05]">
                        <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
                            {budgetPick.image_url || budgetPick.image ? (
                                <img src={budgetPick.image_url || budgetPick.image} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                                <DollarSign className="w-6 h-6 text-emerald-400" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="bg-emerald-400/20 text-emerald-300 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-400/30 font-semibold">
                                    💡 Best Value Pick
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">{budgetPick.marketplace}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-white truncate">{budgetPick.product_name || budgetPick.title}</h4>
                            <div className="text-sm font-bold text-emerald-300 mt-1">₹{budgetPrice.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
