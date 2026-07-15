import React from 'react';

export default function ComparisonExport({ data = [], query = '' }) {
    const handleCSVExport = () => {
        if (!data.length) return;

        const headers = ['Product Name', 'Marketplace', 'Extracted Price', 'Status', 'Deal URL'];
        const rows = data.map(item => [
            `"${item.product_name.replace(/"/g, '""')}"`,
            `"${item.marketplace}"`,
            item.extracted_price || 'N/A',
            `"${item.status || 'N/A'}"`,
            `"${item.url || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SEAMAS_Report_${query.replace(/\s+/g, '_') || 'Export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleCSVExport}
            disabled={!data.length}
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 border border-slate-200 disabled:border-slate-100 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-xs transition-colors disabled:cursor-not-allowed"
        >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Export Dataset (.CSV)</span>
        </button>
    );
}