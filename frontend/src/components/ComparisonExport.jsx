import React from 'react';

export default function ComparisonExport({ data = [], query = '' }) {
    const handleCSVExport = () => {
        if (!data.length) return;

        const headers = ['Product Name', 'Marketplace', 'Extracted Price', 'Currency', 'Status', 'Is Verified', 'URL'];
        const rows = data.map(item => [
            `"${String(item.product_name || '').replace(/"/g, '""')}"`,
            `"${item.marketplace || ''}"`,
            item.extracted_price || 'N/A',
            `"${item.currency || '₹'}"`,
            `"${item.status || 'N/A'}"`,
            item.is_verified ? 'Verified' : 'Approximate',
            `"${item.url || ''}"`,
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SEAMAS_${query.replace(/\s+/g, '_') || 'Export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleCSVExport}
            disabled={!data.length}
            title="Export results as CSV"
            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 border border-slate-700/60 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all duration-200"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
        </button>
    );
}