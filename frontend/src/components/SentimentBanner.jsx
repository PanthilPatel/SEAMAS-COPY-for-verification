import React, { useState } from 'react';
import { Sparkles, ChevronDown, Check, X } from 'lucide-react';

export default function SentimentBanner({ report }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!report || (!report.summary && !report.pros?.length && !report.cons?.length)) return null;
    const hasDetails = (report.pros?.length > 0) || (report.cons?.length > 0);

    return (
        <div className="seamas-glass border-white/[0.05] rounded-2xl overflow-hidden shadow-xl bg-[#0a0a0c]/40">
            <div className="flex items-start justify-between p-5 gap-4">
                <div className="flex items-start space-x-3 text-left">
                    <div className="mt-0.5 h-5 w-5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 block mb-1">AI Market Insights</span>
                        <p className="text-xs leading-relaxed text-neutral-300 font-medium font-display">{report.summary}</p>
                    </div>
                </div>
                {hasDetails && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="shrink-0 inline-flex items-center space-x-1 text-[11px] font-semibold text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-all">
                        <span>Details</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            {isExpanded && hasDetails && (
                <div className="border-t border-white/[0.04] bg-white/[0.01] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {report.pros?.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 block">Praises</span>
                            <ul className="space-y-1">
                                {report.pros.map((pro, i) => (
                                    <li key={i} className="flex items-start space-x-2 text-xs text-neutral-400 font-display">
                                        <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {report.cons?.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-rose-400 block">Complaints</span>
                            <ul className="space-y-1">
                                {report.cons.map((con, i) => (
                                    <li key={i} className="flex items-start space-x-2 text-xs text-neutral-400 font-display">
                                        <X className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}