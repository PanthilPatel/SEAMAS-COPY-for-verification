import React, { useState } from 'react';

// ─────────────────────────────────────────────
// Star Rating
// ─────────────────────────────────────────────
function StarRating({ rating }) {
    const filled = Math.round(rating);
    return (
        <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
                <svg key={i}
                    className={`w-3 h-3 ${i < filled ? 'text-amber-400' : 'text-slate-700'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// Verification Badge
// ─────────────────────────────────────────────
function VerificationBadge({ isVerified }) {
    if (isVerified) {
        return (
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Verified</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Search Listing</span>
        </span>
    );
}

// ─────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────
function ProductCard({ item, onCardClick, delay = 0 }) {
    const [imgError, setImgError] = useState(false);
    const hasPrice    = item.extracted_price != null && item.extracted_price > 0;
    const hasRating   = Boolean(item.rating && item.rating > 0);
    const hasReviews  = Boolean(item.reviews && item.reviews > 0);
    const isVerified  = Boolean(item.is_verified);
    const isOverBudget = item.status === 'Out of Budget';
    const hasUrl      = Boolean(item.url);

    const delayStyle = { animationDelay: `${delay * 0.06}s` };

    return (
        <div
            onClick={() => onCardClick && onCardClick(item)}
            className="group animate-card-enter"
            style={delayStyle}
        >
            <div className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                    background: 'linear-gradient(145deg, rgba(22,22,35,0.9), rgba(14,14,22,0.95))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    transform: 'translateY(0)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.12)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
                }}
            >
                {/* Image section */}
                <div className="relative w-full h-44 flex items-center justify-center overflow-hidden shrink-0"
                    style={{ background: 'linear-gradient(135deg, #fff 0%, #f8faff 100%)' }}>
                    {!imgError ? (
                        <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="object-contain w-full h-full p-3 transition-transform duration-500 group-hover:scale-108"
                            style={{ transform: 'scale(1)', transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 space-y-2">
                            <svg className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] text-slate-400">No image</span>
                        </div>
                    )}

                    {/* Over Budget overlay */}
                    {isOverBudget && (
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(4px)', color: '#fff' }}>
                            Over Budget
                        </div>
                    )}

                    {/* Gradient fade at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 h-8"
                        style={{ background: 'linear-gradient(to bottom, transparent, rgba(14,14,22,0.3))' }} />
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-4 space-y-3">

                    {/* Verification + marketplace */}
                    <div className="flex items-center justify-between gap-2">
                        <VerificationBadge isVerified={isVerified} />
                        {item.marketplace && (
                            <div className="flex items-center space-x-1.5 min-w-0">
                                <div className="h-4 w-4 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                                    {item.marketplace.charAt(0)}
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium truncate">{item.marketplace}</span>
                            </div>
                        )}
                    </div>

                    {/* Product name */}
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {item.product_name}
                    </p>

                    {/* Rating */}
                    {hasRating && (
                        <div className="flex items-center space-x-2">
                            <StarRating rating={item.rating} />
                            <span className="text-xs font-bold text-amber-400">{item.rating.toFixed(1)}</span>
                            {hasReviews && (
                                <span className="text-[10px] text-slate-600">({item.reviews.toLocaleString()})</span>
                            )}
                        </div>
                    )}

                    {/* Price */}
                    <div className="pt-1">
                        {hasPrice ? (
                            <div className="text-2xl font-black leading-none tracking-tight gradient-text"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                {item.currency || '₹'}{Number(item.extracted_price).toLocaleString('en-IN')}
                            </div>
                        ) : (
                            <span className="text-sm text-slate-600 italic">Price unavailable</span>
                        )}
                    </div>

                    {/* View Product button */}
                    <a
                        href={hasUrl ? item.url : '#'}
                        target={hasUrl ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={e => {
                            e.stopPropagation();
                            if (!hasUrl) e.preventDefault();
                        }}
                        className={`block w-full text-center py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${hasUrl
                            ? 'text-white'
                            : 'text-slate-600 cursor-not-allowed'
                        }`}
                        style={hasUrl ? {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        } : {
                            background: 'rgba(30,30,50,0.6)',
                        }}
                    >
                        {hasUrl ? 'View Product →' : 'Link Not Available'}
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// ProductGrid
// ─────────────────────────────────────────────
export default function ProductGrid({ items, onCardClick }) {
    if (!items || items.length === 0) {
        return (
            <div className="rounded-2xl p-14 text-center"
                style={{ background: 'rgba(14,14,22,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <svg className="h-6 w-6 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-400 mb-1">No products match</p>
                <p className="text-xs text-slate-600">Try adjusting your filters or search query.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item, idx) => (
                <ProductCard
                    key={`${item.url || item.product_name}-${idx}`}
                    item={item}
                    onCardClick={onCardClick}
                    delay={idx}
                />
            ))}
        </div>
    );
}