import React, { useState, useEffect } from 'react';
import { Heart, Star, ArrowUpRight, BadgeCheck, Store, Sparkles, Filter, LayoutGrid, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import PriceWatchdogModal from './PriceWatchdogModal';

const toneMap = {
    amber: 'text-amber-300 border-amber-400/25 bg-amber-400/[0.06]',
    cyan: 'text-cyan-300 border-cyan-400/25 bg-cyan-400/[0.06]',
    indigo: 'text-indigo-300 border-indigo-400/25 bg-indigo-400/[0.06]',
};

export const getCategoryFallbackImage = (title = '', category = '') => {
    const text = `${title} ${category}`.toLowerCase();
    if (/chair|seating|desk|furniture|table|ergonomic|cushion/.test(text)) {
        return "https://images.unsplash.com/photo-1589384267710-7a170981ca78?auto=format&fit=crop&w=600&q=80";
    }
    if (/phone|iphone|smartphone|mobile|samsung|galaxy|redmi|oneplus|realme/.test(text)) {
        return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
    }
    if (/laptop|macbook|notebook|computer|thinkpad|dell|hp|asus|acer/.test(text)) {
        return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80";
    }
    if (/headphone|earphone|earbud|audio|airpods|headset|soundbar|speaker/.test(text)) {
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
    }
    if (/watch|smartwatch|chronograph|fastrack|titan|fossil/.test(text)) {
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
    }
    if (/beauty|primer|makeup|cosmetic|lipstick|foundation|serum|cream|lotion|skincare|perfume/.test(text)) {
        return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80";
    }
    if (/shoe|sneaker|boot|footwear|sandal|crocs|nike|adidas|puma/.test(text)) {
        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";
    }
    return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80";
};

function ProductCard({ product, onCardClick, onWatchdogClick, priority = false, isWishlisted = false, onWishlistToggle }) {
    const title = product.product_name || product.title || '';
    const fallbackImage = getCategoryFallbackImage(title, product.category);
    const rawImage = product.image_url || product.image;
    const [imgSrc, setImgSrc] = useState(rawImage || fallbackImage);

    useEffect(() => {
        setImgSrc(rawImage || fallbackImage);
    }, [rawImage, fallbackImage]);

    const price = product.extracted_price != null
        ? Number(product.extracted_price)
        : (product.price != null
            ? Number(product.price)
            : (product.indexed_price != null ? Number(product.indexed_price) : null));
    const hasPrice = Number.isFinite(price) && price > 0;
    const isLiveVerified = product.price_verified === true || product.price_verification_method === 'source_page';
    const subtitle = product.subtitle || (isLiveVerified ? 'Source price checked' : (hasPrice ? 'Marketplace listing price' : 'Price and availability unverified'));
    const marketplace = product.marketplace || 'Store';
    const original = product.original_price ? Number(product.original_price) : (product.indexed_original_price ? Number(product.indexed_original_price) : null);
    const rawRating = product.rating != null ? Number(product.rating) : null;
    const hasValidRating = rawRating != null && !isNaN(rawRating) && rawRating > 0;
    const rating = hasValidRating ? Math.min(5, Math.max(1, rawRating)) : null;

    const rawReviews = product.reviews != null ? Number(product.reviews) : null;
    const hasValidReviews = rawReviews != null && !isNaN(rawReviews) && rawReviews > 0;
    const reviews = hasValidReviews ? rawReviews : null;

    const isLarge = product.span === 'lg';

    const discount = hasPrice && original && original > price ? Math.round(((original - price) / original) * 100) : 0;
    const isOverBudget = product.status === 'Out of Budget';

    const tone = product.marketplaceTone || (product.is_verified ? 'indigo' : 'cyan');

    return (
        <article
            onClick={() => onCardClick && onCardClick(product)}
            className={`seamas-glass card-reveal card-interactive product-card-glow group relative flex flex-col overflow-hidden rounded-3xl cursor-pointer ${isLarge ? 'md:row-span-2' : ''
                }`}
        >
            <div className={`relative overflow-hidden shrink-0 ${isLarge ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}
                style={{ background: 'linear-gradient(160deg, #1a1a2a 0%, #111120 100%)' }}>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent"
                    style={{ zIndex: 2 }}
                />
                <img
                    src={imgSrc}
                    alt={title}
                    referrerPolicy="no-referrer"
                    loading={priority ? 'eager' : 'lazy'}
                    className="h-full w-full object-contain p-4 transition-all duration-700 group-hover:scale-108 group-hover:rotate-1"
                    onError={() => {
                        if (imgSrc !== fallbackImage) {
                            setImgSrc(fallbackImage);
                        }
                    }}
                />

                <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-md transition-transform group-hover:scale-105">
                    <Store className="h-3 w-3 text-cyan-300 shrink-0" strokeWidth={1.75} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-100 max-w-[120px] truncate">
                        {marketplace}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onWishlistToggle) {
                            onWishlistToggle(product);
                        }
                    }}
                    className={`absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 backdrop-blur-md transition-all btn-magnetic ${isWishlisted ? 'bg-rose-500/20 text-rose-300 scale-110' : 'bg-black/40 text-neutral-200 hover:bg-black/60 hover:scale-105'
                        }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className={`h-4 w-4 transition-transform duration-300 ${isWishlisted ? 'fill-rose-400 text-rose-400 scale-110' : 'group-hover:scale-110'}`} strokeWidth={1.75} />
                </button>

                {isOverBudget ? (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.15] px-2.5 py-1 backdrop-blur-md">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-300">
                            Over Budget
                        </span>
                    </div>
                ) : discount > 0 ? (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.12] px-2.5 py-1 backdrop-blur-md badge-glow">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-200">
                            −{discount}% off
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-4 p-5 min-w-0">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-1.5 items-center">
                        {(product.tags && product.tags.length > 0
                            ? product.tags
                            : (isLiveVerified
                                ? ['Store Listing', 'Live Verified']
                                : (hasPrice ? ['Store Listing', 'Indexed Offer'] : ['Search Index', 'Price Pending']))
                        ).map((t) => (
                            <span
                                key={t}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-transform hover:scale-105 shrink-0 ${toneMap[tone] ?? toneMap.cyan
                                    }`}
                            >
                                <BadgeCheck className="h-2.5 w-2.5" strokeWidth={2} />
                                {t}
                            </span>
                        ))}
                    </div>

                    <h3 className="font-display text-[16px] sm:text-[17px] font-medium leading-snug tracking-tight text-white line-clamp-2 break-words group-hover:text-cyan-200 transition-colors" title={title}>
                        {title}
                    </h3>
                    <p className="mt-1 text-[12px] sm:text-[13px] leading-relaxed text-neutral-400 line-clamp-2 break-words">{subtitle}</p>

                    <div className="mt-3 flex items-center gap-2">
                        {rating ? (
                            <>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-3 w-3 ${i < Math.round(rating)
                                                    ? 'fill-amber-300 text-amber-300'
                                                    : 'text-neutral-700'
                                                }`}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </div>
                                <span className="font-mono text-[11px] text-neutral-400">
                                    {rating.toFixed(1)}{' '}
                                    <span className="text-neutral-600">
                                        · {reviews ? `${reviews.toLocaleString()} reviews` : 'Verified listing'}
                                    </span>
                                </span>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                                    Unrated
                                </span>
                                <span className="font-mono text-[11px] text-neutral-500">
                                    · No review data
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-display text-2xl font-semibold tracking-tight text-white price-pop">
                                {hasPrice ? `₹${price.toLocaleString('en-IN')}` : 'Price unavailable'}
                            </span>
                            {hasPrice && original && (
                                <span className="text-[13px] text-neutral-500 line-through">
                                    ₹{original.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                            {hasPrice
                                ? (isLiveVerified
                                    ? 'Live Source Verified'
                                    : (product.price_verification_method === 'store_index' ? 'Marketplace Indexed' : 'Verified Store Offer'))
                                : 'Price not verified'}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-neutral-500">
                            {product.availability_status === 'in_stock'
                                ? `In stock${product.quantity == null ? ' · exact quantity not provided' : ` · ${product.quantity} available`}`
                                : product.availability_status === 'out_of_stock' ? 'Out of stock' : 'Availability unknown'}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onWatchdogClick && onWatchdogClick(product);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-400/40 btn-magnetic"
                            title="Track Price & Set Alert"
                        >
                            <TrendingDown className="h-3 w-3" />
                            Track
                        </button>
                        {product.url ? (
                            <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-4 py-1.5 text-[12px] font-semibold text-cyan-300 transition-all hover:bg-cyan-500/30 hover:scale-105 btn-magnetic"
                            >
                                Visit
                                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                            </a>
                        ) : (
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[12px] font-semibold text-neutral-400 transition-all cursor-not-allowed"
                                disabled
                            >
                                No Link
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function ProductGrid({ items = [], query = '', ready = true, onCardClick, wishlistItems = [], onWishlistToggle }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [watchdogProduct, setWatchdogProduct] = useState(null);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        setCurrentPage(1);
    }, [items, query]);

    if (!ready) return null;

    if (!items || items.length === 0) {
        return (
            <section className="relative z-10 mx-auto w-full max-w-6xl text-center py-16 px-4 rounded-3xl seamas-glass border border-white/5 bg-white/[0.02] mt-6">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-neutral-400">
                        <LayoutGrid className="h-7 w-7 text-neutral-500 animate-pulse" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-lg font-medium tracking-tight text-white">No Marketplace Offers Found</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        We couldn't find any matching listings for <span className="text-cyan-300">"{query}"</span> on verified Indian marketplaces. The product may be out of stock, unreleased, or unavailable.
                    </p>
                </div>
            </section>
        );
    }

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const gridEl = document.getElementById('seamas-product-grid');
            if (gridEl) {
                gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const isProductWishlisted = (product) => {
        const pTitle = product.product_name || product.title;
        const pUrl = product.url;
        return wishlistItems.some(w => (w.url && w.url === pUrl) || (w.product_name || w.title) === pTitle);
    };

    return (
        <section id="seamas-product-grid" className="relative z-10 mx-auto w-full max-w-6xl text-left">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                        <Sparkles className="h-3 w-3 text-cyan-300 animate-pulse" strokeWidth={2} />
                        Composed by SEAMAS · {items.length} candidates
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                        {query ? (
                            <>
                                Recommendations for{' '}
                                <span className="text-gradient-animated">
                                    "{query.length > 60 ? query.slice(0, 60) + '…' : query}"
                                </span>
                            </>
                        ) : (
                            <>Recommendations tailored for you.</>
                        )}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[12px] text-neutral-300 hover:border-white/[0.16] hover:text-white transition-all btn-magnetic">
                        <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Refine
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[12px] text-neutral-300 hover:border-white/[0.16] hover:text-white transition-all btn-magnetic">
                        <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Bento
                    </button>
                </div>
            </div>

            <div className="grid auto-rows-[1fr] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item, idx) => (
                    <ProductCard
                        key={idx}
                        product={item}
                        priority={idx < 3}
                        onCardClick={onCardClick}
                        onWatchdogClick={(p) => setWatchdogProduct(p)}
                        isWishlisted={isProductWishlisted(item)}
                        onWishlistToggle={onWishlistToggle}
                    />
                ))}
            </div>

            {watchdogProduct && (
                <PriceWatchdogModal product={watchdogProduct} onClose={() => setWatchdogProduct(null)} />
            )}

            {totalPages > 1 && (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-white/[0.06] pt-6">
                    <div className="font-mono text-xs text-neutral-400">
                        Showing <span className="text-white font-semibold">{startIndex + 1}</span>–
                        <span className="text-white font-semibold">{Math.min(startIndex + ITEMS_PER_PAGE, items.length)}</span> of{' '}
                        <span className="text-cyan-300 font-semibold">{items.length}</span> candidates
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-neutral-300 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed btn-magnetic"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>

                        <div className="flex flex-wrap items-center justify-center gap-1 px-2">
                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isActive = pageNum === currentPage;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`h-9 w-9 rounded-xl font-mono text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 filter-pill-active'
                                                : 'border border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:border-white/[0.14] hover:text-white hover:scale-105'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-neutral-300 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed btn-magnetic"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
