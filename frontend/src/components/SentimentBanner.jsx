import React, { useState } from 'react';

// ─────────────────────────────────────────────
// SentimentBanner
// Maps to real backend fields:
//   report.summary → analysis_report.summary
//   report.pros    → analysis_report.pros
//   report.cons    → analysis_report.cons
// ─────────────────────────────────────────────
export default function SentimentBanner({ report }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!report || (!report.summary && !report.pros?.length && !report.cons?.length)) {
        return null;
    }

    const hasProsOrCons = (report.pros?.length > 0) || (report.cons?.length > 0);

    return (
        <div className="bg-[#171717] border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm mb-6 transition-all duration-300">

            {/* ── Always-visible header row ── */}
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex items-start space-x-3 min-w-0">
                    {/* Pulsing AI indicator */}
                    <div className="relative flex h-2 w-2 mt-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                AI Market Insights
                            </span>
                        </div>
                        {report.summary && (
                            <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                                {report.summary}
                            </p>
                        )}
                    </div>
                </div>

                {/* Expand / Collapse button — only shown when there's more to see */}
                {hasProsOrCons && (
                    <button
                        onClick={() => setIsExpanded(v => !v)}
                        className="shrink-0 flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 px-2.5 py-1.5 rounded-lg transition-all duration-200"
                        aria-label={isExpanded ? 'Collapse insights' : 'Expand insights'}
                    >
                        <span>{isExpanded ? 'Less' : 'Details'}</span>
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* ── Expandable Pros & Cons ── */}
            {isExpanded && hasProsOrCons && (
                <div className="border-t border-slate-800/60 px-4 pb-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Pros */}
                    {report.pros?.length > 0 && (
                        <div>
                            <div className="flex items-center space-x-1.5 mb-2">
                                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Praises</span>
                            </div>
                            <ul className="space-y-1.5">
                                {report.pros.map((pro, i) => (
                                    <li key={i} className="flex items-start space-x-2">
                                        <span className="text-emerald-500 mt-0.5 shrink-0 text-xs">✓</span>
                                        <span className="text-xs text-slate-300 leading-relaxed">{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cons */}
                    {report.cons?.length > 0 && (
                        <div>
                            <div className="flex items-center space-x-1.5 mb-2">
                                <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Complaints</span>
                            </div>
                            <ul className="space-y-1.5">
                                {report.cons.map((con, i) => (
                                    <li key={i} className="flex items-start space-x-2">
                                        <span className="text-rose-500 mt-0.5 shrink-0 text-xs">✗</span>
                                        <span className="text-xs text-slate-300 leading-relaxed">{con}</span>
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