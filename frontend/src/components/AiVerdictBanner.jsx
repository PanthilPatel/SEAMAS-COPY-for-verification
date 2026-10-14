import React, { useState } from 'react';
import { Award, ShieldCheck, DollarSign, ThumbsUp, ThumbsDown, Check, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

const POSITIVE_REASONS = ['Accurate Prices', 'Top Recommendations', 'Good Budget Fit', 'Helpful Comparison'];
const NEGATIVE_REASONS = ['Price Mismatch', 'Irrelevant Results', 'Exceeded Budget', 'Missing Stores'];

export default function AiVerdictBanner({ items = [], query = '' }) {
    const [rating, setRating] = useState(null);
    const [selectedReason, setSelectedReason] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!items || items.length === 0) return null;

    // Find top match (highest rating or first verified item)
    const topPick = items.find(i => i.is_verified) || items[0];

    // Find best budget pick (lowest price among valid items)
    const pricedItems = items.filter(i => Number(i.extracted_price || i.price || 0) > 0);
    const budgetPick = pricedItems.length > 0
        ? [...pricedItems].sort((a, b) => {
            const pA = Number(a.extracted_price || a.price || 0);
            const pB = Number(b.extracted_price || b.price || 0);
            return pA - pB;
        })[0]
        : items[0];

    const topPrice = topPick ? Number(topPick.extracted_price || topPick.price || 0) : 0;
    const budgetPrice = budgetPick ? Number(budgetPick.extracted_price || budgetPick.price || 0) : 0;

    const handleRate = async (newRating) => {
        setRating(newRating);
        setSelectedReason(null);
    };

    const handleReasonClick = async (reason) => {
        setSelectedReason(reason);
        setSubmitting(true);
        try {
            await apiService.sendFeedback({
                query: query || 'current query',
                rating: rating || 'up',
                reason,
            });
            setSubmitted(true);
        } catch (err) {
            console.warn('Feedback submit failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickSubmit = async () => {
        if (!rating) return;
        setSubmitting(true);
        try {
            await apiService.sendFeedback({
                query: query || 'current query',
                rating,
                reason: selectedReason || 'Direct rating',
            });
            setSubmitted(true);
        } catch (err) {
            console.warn('Feedback submit failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full rounded-2xl border border-[#E6C762]/25 bg-[#121215] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_20px_40px_-15px_rgba(0,0,0,0.7)] text-left relative overflow-hidden my-6 font-sans">
            {/* Specular lighting effect */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-gradient-to-b from-[#E6C762]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E6C762]">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#E6C762] font-semibold">Executive AI Briefing</span>
                            <span className="rounded-full bg-white/[0.06] border border-white/[0.1] px-2.5 py-0.5 font-mono text-[9px] text-zinc-300">
                                {topPick?.is_verified ? 'Verified Marketplace Evidence' : 'Search Evidence Indexed'}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                            Market mandate resolved for <span className="text-[#E6C762] font-normal font-editorial italic text-lg">"{query || 'Your query'}"</span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                    <span>Cross-marketplace verified across {items.length} options</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Overall Pick Card */}
                {topPick && (
                    <div className="rounded-xl border border-[#E6C762]/30 bg-[#18181C] p-4 flex gap-4 items-center transition-all hover:border-[#E6C762]/50 shadow-sm">
                        <div className="w-16 h-16 rounded-xl bg-[#09090B] border border-white/10 shrink-0 flex items-center justify-center overflow-hidden p-1.5">
                            {topPick.image_url || topPick.image ? (
                                <img src={topPick.image_url || topPick.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                                <Award className="w-6 h-6 text-[#E6C762]" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#E6C762]/10 text-[#E6C762] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#E6C762]/25 flex items-center gap-1">
                                    <Award className="w-3 h-3 text-[#E6C762]" /> Overall Winner
                                </span>
                                <span className="text-[11px] text-zinc-400 font-mono">{topPick.marketplace}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-white truncate">{topPick.product_name || topPick.title}</h4>
                            <div className="text-sm font-bold text-white mt-1 tabular-nums">
                                {topPrice > 0 ? `₹${topPrice.toLocaleString('en-IN')}` : 'Price on Store'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Best Value / Budget Pick Card */}
                {budgetPick && (
                    <div className="rounded-xl border border-[#34D399]/30 bg-[#18181C] p-4 flex gap-4 items-center transition-all hover:border-[#34D399]/50 shadow-sm">
                        <div className="w-16 h-16 rounded-xl bg-[#09090B] border border-white/10 shrink-0 flex items-center justify-center overflow-hidden p-1.5">
                            {budgetPick.image_url || budgetPick.image ? (
                                <img src={budgetPick.image_url || budgetPick.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                                <DollarSign className="w-6 h-6 text-[#34D399]" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#34D399]/10 text-[#34D399] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#34D399]/25 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#34D399]" /> Best Value Pick
                                </span>
                                <span className="text-[11px] text-zinc-400 font-mono">{budgetPick.marketplace}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-white truncate">{budgetPick.product_name || budgetPick.title}</h4>
                            <div className="text-sm font-bold text-[#34D399] mt-1 tabular-nums">
                                {budgetPrice > 0 ? `₹${budgetPrice.toLocaleString('en-IN')}` : 'Price on Store'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive User Evaluation Feedback Bar */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#E6C762]" />
                    <span className="text-xs text-zinc-300">Were these executive recommendations helpful?</span>
                </div>

                <div className="flex items-center gap-2">
                    {submitted ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs font-medium">
                            <Check className="w-3.5 h-3.5" />
                            <span>Feedback recorded. Thank you.</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => (rating === 'up' ? handleQuickSubmit() : handleRate('up'))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    rating === 'up'
                                        ? 'bg-[#34D399]/15 border-[#34D399]/50 text-[#34D399]'
                                        : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                                }`}
                                title="Accurate & helpful"
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Yes</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRate('down')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    rating === 'down'
                                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                                        : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                                }`}
                                title="Needs improvement"
                            >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>No</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Reason Selector */}
            {rating && !submitted && (
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="text-xs text-zinc-400 mr-1">Detail:</span>
                    {(rating === 'up' ? POSITIVE_REASONS : NEGATIVE_REASONS).map((reason) => (
                        <button
                            key={reason}
                            type="button"
                            disabled={submitting}
                            onClick={() => handleReasonClick(reason)}
                            className={`px-3 py-1 rounded-lg text-xs transition-all border ${
                                selectedReason === reason
                                    ? 'bg-[#E6C762]/15 border-[#E6C762] text-[#E6C762]'
                                    : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                            }`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
