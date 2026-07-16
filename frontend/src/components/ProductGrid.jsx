import React from 'react';

// ─────────────────────────────────────────────
// Star Rating — only rendered when rating > 0
// ─────────────────────────────────────────────
function StarRating({ rating }) {
    const filled = Math.round(rating);
    return (
        <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className={`w-3 h-3 ${i < filled ? 'text-amber-400' : 'text-slate-700'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function VerificationBadge({ isVerified }) {
    if (isVerified) {
        return (
            <div className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verified Listing</span>
            </div>
        );
    }
    return (
        <div className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Search Listing</span>
        </div>
    );
}

function ImagePlaceholder() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 space-y-1">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-slate-400">No image</span>
        </div>
    );
}

function ProductCard({ item, onCardClick }) {
    // Use Boolean() to prevent React rendering falsy numeric 0 as text node
    const hasPrice = item.extracted_price != null && item.extracted_price > 0;
    const hasRating = Boolean(item.rating && item.rating > 0);
    const hasReviews = Boolean(item.reviews && item.reviews > 0);
    const hasBrand = Boolean(item.brand && item.brand.trim().length > 0);
    const isVerified = Boolean(item.is_verified);
    const isOverBudget = item.status === 'Out of Budget';
    const hasUrl = Boolean(item.url);

    return (
        <div
            onClick={() => onCardClick && onCardClick(item)}
            className="group flex flex-col bg-[#1a1b1e] border border-slate-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-600/60 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
        >
            {/* ── Product Image
                image_url is always present (real URL or Unsplash fallback from backend).
                onError shows a graceful placeholder instead of hiding the element.
            ── */}
            <div className="relative w-full h-40 bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="object-contain w-full h-full p-3 transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        // Don't hide — swap to inline SVG placeholder
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        // Insert placeholder into parent if not already done
                        const parent = e.target.parentNode;
                        if (!parent.querySelector('[data-placeholder]')) {
                            const ph = document.createElement('div');
                            ph.setAttribute('data-placeholder', '1');
                            ph.className = 'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400';
                            ph.innerHTML = `<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span style="font-size:10px;margin-top:4px;color:#94a3b8">No image</span>`;
                            parent.appendChild(ph);
                        }
                    }}
                />

                {/* Over-budget badge (status field) — top right overlay on image */}
                {isOverBudget && (
                    <div className="absolute top-2 right-2 bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        Over Budget
                    </div>
                )}
            </div>

            {/* ── Card Body ── */}
            <div className="flex flex-col flex-grow p-3 space-y-2">

                {/* Verification badge — the ONLY visual differentiation by is_verified */}
                <VerificationBadge isVerified={isVerified} />

                {/* Brand (brand field — only when non-null) */}
                {hasBrand && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none">
                        {item.brand}
                    </span>
                )}

                {/* Product Name (product_name field) */}
                <h4 className="text-sm font-semibold text-[#e8eaed] line-clamp-2 leading-snug group-hover:text-white transition-colors">
                    {item.product_name}
                </h4>

                {/* Marketplace (marketplace field) */}
                <div className="flex items-center space-x-1.5">
                    <div className="h-4 w-4 bg-slate-800 border border-slate-700/60 rounded flex items-center justify-center text-[9px] font-black text-slate-400 uppercase shrink-0">
                        {(item.marketplace || 'W').charAt(0)}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{item.marketplace}</span>
                </div>

                {/* Rating & Reviews (rating + reviews fields — only shown when > 0) */}
                {hasRating && (
                    <div className="flex items-center space-x-1.5">
                        <StarRating rating={item.rating} />
                        <span className="text-[11px] font-bold text-amber-400">{item.rating.toFixed(1)}</span>
                        {hasReviews && (
                            <span className="text-[11px] text-slate-500">
                                ({item.reviews.toLocaleString()})
                            </span>
                        )}
                    </div>
                )}

                {/* ── Price — always the largest element on the card ── */}
                <div className="pt-1 mt-auto">
                    {hasPrice ? (
                        <div className="text-2xl font-black text-white leading-none tracking-tight">
                            {item.currency || '₹'}{Number(item.extracted_price).toLocaleString('en-IN')}
                        </div>
                    ) : (
                        <span className="text-sm text-slate-500 italic">Price unavailable</span>
                    )}
                </div>

                {/* ── View Product button
                    ALWAYS labelled "View Product" for all listing types.
                    Disabled (grey, cursor-not-allowed) when no URL.
                    Same color for all cards — indigo.
                ── */}
                <a
                    href={hasUrl ? item.url : '#'}
                    target={hasUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!hasUrl) e.preventDefault();
                    }}
                    className={`block w-full text-center py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${hasUrl
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {hasUrl ? 'View Product' : 'Link Not Available'}
                </a>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// ProductGrid
// Renders ALL items passed to it — no internal filtering.
// ─────────────────────────────────────────────
export default function ProductGrid({ items, onCardClick }) {
    if (!items || items.length === 0) {
        return (
            <div className="bg-[#171717] border border-slate-800/40 rounded-2xl p-14 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-400 mb-0.5">No products match</p>
                <p className="text-xs text-slate-600">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
                <ProductCard key={`${item.url || item.product_name}-${idx}`} item={item} onCardClick={onCardClick} />
            ))}
        </div>
    );
}