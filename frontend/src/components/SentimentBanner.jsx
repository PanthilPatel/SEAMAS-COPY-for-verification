import React, { useState } from 'react';

export default function SentimentBanner({ report }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!report || (!report.summary && !report.pros?.length && !report.cons?.length)) {
        return null;
    }

    const hasProsOrCons = (report.pros?.length > 0) || (report.cons?.length > 0);

    return (
        <div className="mb-6 rounded-2xl overflow-hidden animate-slide-up"
            style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06), rgba(14,14,22,0.9))',
                border: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
            }}>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex items-start space-x-3 min-w-0">

                    {/* Animated AI dot */}
                    <div className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                            style={{ background: '#818cf8' }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: '#818cf8' }}>
                                AI Market Insights
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                Live Analysis
                            </span>
                        </div>
                        {report.summary && (
                            <p className="text-sm text-slate-300 leading-relaxed"
                                style={{ fontFamily: "'Inter', sans-serif" }}>
                                {report.summary}
                            </p>
                        )}
                    </div>
                </div>

                {hasProsOrCons && (
                    <button
                        onClick={() => setIsExpanded(v => !v)}
                        className="shrink-0 flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#94a3b8',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                            e.currentTarget.style.color = '#a5b4fc';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        <span>{isExpanded ? 'Collapse' : 'View Details'}</span>
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Expandable pros/cons */}
            {isExpanded && hasProsOrCons && (
                <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in"
                    style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>

                    {/* Pros */}
                    {report.pros?.length > 0 && (
                        <div className="pt-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="h-5 w-5 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Praises</span>
                            </div>
                            <ul className="space-y-2">
                                {report.pros.map((pro, i) => (
                                    <li key={i} className="flex items-start space-x-2.5">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-500" />
                                        <span className="text-xs text-slate-300 leading-relaxed">{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cons */}
                    {report.cons?.length > 0 && (
                        <div className="pt-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="h-5 w-5 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}>
                                    <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Complaints</span>
                            </div>
                            <ul className="space-y-2">
                                {report.cons.map((con, i) => (
                                    <li key={i} className="flex items-start space-x-2.5">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-rose-500" />
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