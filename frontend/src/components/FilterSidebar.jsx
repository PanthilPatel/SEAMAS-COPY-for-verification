import React from 'react';

// ─────────────────────────────────────────────
// Section heading helper
// ─────────────────────────────────────────────
function SectionHeading({ label }) {
    return (
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
            {label}
        </h3>
    );
}

// ─────────────────────────────────────────────
// FilterSidebar
// All filters map directly to real backend fields:
//   marketplace  → price_data[].marketplace
//   extracted_price → price_data[].extracted_price
//   is_verified  → price_data[].is_verified
//   status       → price_data[].status ("Target Match" | "Out of Budget")
// ─────────────────────────────────────────────
export default function FilterSidebar({
    // Marketplace filter
    marketplaces = [],
    selectedMarketplaces = [],
    setSelectedMarketplaces,
    // Price range filter
    maxPriceLimit = 250000,
    priceRange = 250000,
    setPriceRange,
    // Sort
    sortBy = 'default',
    setSortBy,
    // Verification filter (maps to is_verified)
    verifiedOnly = false,
    setVerifiedOnly,
    // Budget filter (maps to status === "Target Match")
    inBudgetOnly = false,
    setInBudgetOnly,
    // Whether a budget ceiling was detected
    hasBudget = false,
}) {
    const toggleMarketplace = (store) => {
        if (selectedMarketplaces.includes(store)) {
            setSelectedMarketplaces(selectedMarketplaces.filter(s => s !== store));
        } else {
            setSelectedMarketplaces([...selectedMarketplaces, store]);
        }
    };

    const activeFilterCount = [
        verifiedOnly,
        inBudgetOnly,
        selectedMarketplaces.length > 0,
        priceRange < maxPriceLimit,
        sortBy !== 'default',
    ].filter(Boolean).length;

    return (
        <div className="space-y-5 text-[#e8eaed]">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Filters</h2>
                {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        {activeFilterCount} active
                    </span>
                )}
            </div>

            <div className="h-px bg-slate-800" />

            {/* ── Sort By ── */}
            <div>
                <SectionHeading label="Sort By" />
                <div className="space-y-1.5">
                    {[
                        { id: 'default', label: 'Relevance' },
                        { id: 'price-asc', label: 'Price: Low → High' },
                        { id: 'price-desc', label: 'Price: High → Low' },
                    ].map(opt => (
                        <label
                            key={opt.id}
                            className="flex items-center space-x-2.5 cursor-pointer group"
                        >
                            <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                sortBy === opt.id
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-slate-600 group-hover:border-slate-400'
                            }`}>
                                {sortBy === opt.id && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                            </div>
                            <input
                                type="radio"
                                name="sort-option"
                                checked={sortBy === opt.id}
                                onChange={() => setSortBy(opt.id)}
                                className="sr-only"
                            />
                            <span className={`text-xs transition-colors ${
                                sortBy === opt.id ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-px bg-slate-800" />

            {/* ── Listing Type (is_verified) ── */}
            <div>
                <SectionHeading label="Listing Type" />
                <label className="flex items-center space-x-2.5 cursor-pointer group">
                    <div
                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            verifiedOnly
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-600 group-hover:border-slate-400'
                        }`}
                    >
                        {verifiedOnly && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <div className={`text-xs font-medium transition-colors ${verifiedOnly ? 'text-emerald-400' : 'text-slate-300 group-hover:text-white'}`}>
                            Verified Listings Only
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            Prices from actual product pages
                        </div>
                    </div>
                </label>
            </div>

            <div className="h-px bg-slate-800" />

            {/* ── Budget Status (status field) ── */}
            {hasBudget && (
                <>
                    <div>
                        <SectionHeading label="Budget Fit" />
                        <label className="flex items-center space-x-2.5 cursor-pointer group">
                            <div
                                onClick={() => setInBudgetOnly(!inBudgetOnly)}
                                className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                    inBudgetOnly
                                        ? 'border-indigo-500 bg-indigo-500'
                                        : 'border-slate-600 group-hover:border-slate-400'
                                }`}
                            >
                                {inBudgetOnly && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className={`text-xs font-medium transition-colors ${inBudgetOnly ? 'text-indigo-400' : 'text-slate-300 group-hover:text-white'}`}>
                                    Within Budget Only
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    Hide over-budget listings
                                </div>
                            </div>
                        </label>
                    </div>
                    <div className="h-px bg-slate-800" />
                </>
            )}

            {/* ── Price Range (extracted_price) ── */}
            <div>
                <div className="flex items-center justify-between mb-2.5">
                    <SectionHeading label="Max Price" />
                    <span className="text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                        ₹{priceRange.toLocaleString('en-IN')}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={maxPriceLimit}
                    step={Math.max(100, Math.floor(maxPriceLimit / 100))}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-indigo-500 cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(priceRange / maxPriceLimit) * 100}%, #334155 ${(priceRange / maxPriceLimit) * 100}%, #334155 100%)`
                    }}
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
                    <span>₹0</span>
                    <span>₹{maxPriceLimit.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <div className="h-px bg-slate-800" />

            {/* ── Marketplace (marketplace field) ── */}
            {marketplaces.length > 0 && (
                <div>
                    <SectionHeading label="Marketplace" />
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {marketplaces.map(store => {
                            const isSelected = selectedMarketplaces.includes(store);
                            return (
                                <label
                                    key={store}
                                    className="flex items-center space-x-2.5 cursor-pointer group"
                                    onClick={() => toggleMarketplace(store)}
                                >
                                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                            ? 'border-indigo-500 bg-indigo-500'
                                            : 'border-slate-600 group-hover:border-slate-400'
                                    }`}>
                                        {isSelected && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-xs truncate transition-colors ${
                                        isSelected ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'
                                    }`}>
                                        {store}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}