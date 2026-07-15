import React from 'react';

export default function ConfidenceTag({ level = 'high', explanation = '' }) {
    const config = {
        high: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'High Certainty' },
        medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Moderate Match' },
        low: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Low Data Bound' }
    };

    const active = config[level.toLowerCase()] || config.medium;

    return (
        <div className={`inline-flex flex-col border rounded-xl p-3 max-w-xs ${active.bg}`}>
            <div className="flex items-center space-x-1.5 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-current"></span>
                <span className="text-xs font-bold uppercase tracking-wider">{active.text}</span>
            </div>
            {explanation && (
                <p className="text-[11px] leading-normal opacity-90 font-medium">{explanation}</p>
            )}
        </div>
    );
}