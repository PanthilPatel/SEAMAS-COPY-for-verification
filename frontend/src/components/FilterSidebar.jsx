import React from 'react';

export default function FilterSidebar({
    marketplaces,
    selectedMarketplaces,
    setSelectedMarketplaces,
    maxPriceLimit,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy
}) {
    const handleMarketplaceChange = (market) => {
        if (selectedMarketplaces.includes(market)) {
            setSelectedMarketplaces(selectedMarketplaces.filter(m => m !== market));
        } else {
            setSelectedMarketplaces([...selectedMarketplaces, market]);
        }
    };

    return (
        <aside className="w-full text-[#e3e3e3] space-y-6 pr-2 selection:bg-indigo-500/30">
            {/* Refine Section */}
            <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase mb-3">Refine results</h3>
                <div className="space-y-2 text-sm text-slate-200">
                    <div className="flex items-center space-x-2 opacity-80">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>Nearby listings only</span>
                    </div>
                    <div className="flex items-center space-x-2 opacity-80">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>On sale</span>
                    </div>
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Sort By Section */}
            <div>
                <h3 className="text-sm font-semibold text-white mb-3">Sort by</h3>
                <div className="space-y-2 text-sm">
                    {[
                        { id: 'default', label: 'Relevance' },
                        { id: 'price-asc', label: 'Price: low to high' },
                        { id: 'price-desc', label: 'Price: high to low' }
                    ].map((option) => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer group">
                            <input
                                type="radio"
                                name="sort-group"
                                checked={sortBy === option.id}
                                onChange={() => setSortBy(option.id)}
                                className="bg-transparent border-slate-650 checked:bg-indigo-500 text-indigo-500 h-4 w-4 rounded-full focus:ring-0 focus:ring-offset-0 focus:outline-none"
                            />
                            <span className={`transition-colors group-hover:text-white ${sortBy === option.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Price Section */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-white">Price</h3>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                        Max: ₹{Number(priceRange).toLocaleString()}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={maxPriceLimit > 0 ? maxPriceLimit : 150000}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none focus:outline-none mb-3"
                />
                <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">₹</span>
                        <input
                            type="text"
                            readOnly
                            value={Number(priceRange).toLocaleString()}
                            className="w-full bg-[#1e1e1e] border border-slate-800 rounded-lg py-1.5 pl-5 pr-2 text-xs text-slate-300 focus:outline-none"
                        />
                    </div>
                    <button className="bg-[#2a2a2a] hover:bg-[#333] border border-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors">
                        Go
                    </button>
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Marketplace Stores Section */}
            <div>
                <h3 className="text-sm font-semibold text-white mb-3">Merchant Stores</h3>
                {marketplaces.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No merchant stores detected.</p>
                ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                        {marketplaces.map((market) => (
                            <label key={market} className="flex items-center space-x-3 text-sm cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    checked={selectedMarketplaces.includes(market)}
                                    onChange={() => handleMarketplaceChange(market)}
                                    className="rounded border-slate-700 bg-transparent text-indigo-500 focus:ring-0 focus:ring-offset-0 focus:outline-none h-4 w-4"
                                />
                                <span className={`truncate transition-colors ${selectedMarketplaces.includes(market) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {market}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}