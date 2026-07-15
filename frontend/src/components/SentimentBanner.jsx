import React from 'react';

export default function SentimentBanner({ report }) {
    if (!report || (!report.summary && !report.pros?.length && !report.cons?.length)) {
        return null;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <h2 className="text-lg font-semibold tracking-wide uppercase text-indigo-400">AI Buyer Sentiment Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Market Overview Summary</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{report.summary || "No aggregate review overview generated."}</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-emerald-400 flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Top Praises (Pros)
                    </h3>
                    <ul className="space-y-1.5">
                        {report.pros?.map((pro, index) => (
                            <li key={index} className="text-sm text-slate-300 flex items-start">
                                <span className="text-emerald-500 mr-2">•</span> {pro}
                            </li>
                        )) || <span className="text-xs text-slate-500">None extracted</span>}
                    </ul>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-rose-400 flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Common Defects / Complaints (Cons)
                    </h3>
                    <ul className="space-y-1.5">
                        {report.cons?.map((con, index) => (
                            <li key={index} className="text-sm text-slate-300 flex items-start">
                                <span className="text-rose-500 mr-2">•</span> {con}
                            </li>
                        )) || <span className="text-xs text-slate-500">None extracted</span>}
                    </ul>
                </div>
            </div>
        </div>
    );
}