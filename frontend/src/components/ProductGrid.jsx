import React from 'react';

export default function ProductGrid({ items }) {
    if (!items || items.length === 0) {
        return (
            <div className="bg-[#111111] border border-slate-800 rounded-2xl p-16 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <h3 className="text-md font-medium text-slate-300 mb-1">No matches found within current filters</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Try updating your pricing slider parameters or unchecking target marketplace merchant filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {items.map((item, idx) => {
                const isVerified = item.is_verified === true;
                const hasPrice = item.extracted_price !== null && item.extracted_price !== undefined;

                return (
                    <div
                        key={idx}
                        className="flex flex-col group justify-between transition-transform duration-200"
                    >
                        {/* White Rounded Image Container */}
                        <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center p-6 border border-slate-800/20 relative overflow-hidden shadow-xs">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="object-contain w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            )}

                            {/* Context Tag/Badge */}
                            {isVerified ? (
                                <div className="absolute bottom-3 left-3 bg-[#1a237e] text-indigo-200 text-[11px] font-medium px-2.5 py-0.5 rounded-md flex items-center space-x-1 shadow-xs">
                                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full"></span>
                                    <span>Verified Store</span>
                                </div>
                            ) : (
                                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-md">
                                    Web Mention
                                </div>
                            )}
                        </div>

                        {/* Product Details Text Context */}
                        <div className="mt-3 px-1 flex-grow flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-normal text-[#e8eaed] line-clamp-2 min-h-[40px] leading-snug group-hover:text-indigo-400 transition-colors">
                                    {item.product_name}
                                </h4>

                                <div className="mt-1 flex items-baseline space-x-1.5">
                                    <span className="text-md font-bold text-white">
                                        {hasPrice ? `₹${Number(item.extracted_price).toLocaleString()}` : 'Price Unlisted'}
                                    </span>
                                    {item.status === 'Out of Budget' && (
                                        <span className="text-[10px] text-rose-400 font-medium font-mono uppercase tracking-wider bg-rose-500/10 px-1 rounded">
                                            Over Budget
                                        </span>
                                    )}
                                </div>

                                {/* Marketplace Store Link Label */}
                                <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                                    <span className="h-3.5 w-3.5 bg-white/10 text-white rounded-md flex items-center justify-center text-[9px] font-bold uppercase border border-white/5">
                                        {item.marketplace.charAt(0)}
                                    </span>
                                    <span className="hover:underline text-slate-300">{item.marketplace}</span>
                                </div>
                            </div>

                            {/* Action Link Button */}
                            <div className="mt-3">
                                {item.url ? (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full text-center block bg-[#202124] hover:bg-[#2c2d30] text-slate-200 border border-slate-800 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors"
                                    >
                                        View Store Deal
                                    </a>
                                ) : (
                                    <button disabled className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-600 border border-slate-900/50 cursor-not-allowed">
                                        No Link Available
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}