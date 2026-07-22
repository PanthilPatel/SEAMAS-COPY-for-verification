import React, { useState, useEffect } from 'react';
import { Heart, Star, ArrowUpRight, BadgeCheck, Store, Sparkles, Filter, LayoutGrid, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import PriceWatchdogModal from './PriceWatchdogModal';

const toneMap = {
    amber: 'text-amber-300 border-amber-400/25 bg-amber-400/[0.06]',
    cyan: 'text-cyan-300 border-cyan-400/25 bg-cyan-400/[0.06]',
    indigo: 'text-indigo-300 border-indigo-400/25 bg-indigo-400/[0.06]',
};

function ProductCard({ product, onCardClick, onWatchdogClick, priority = false }) {
    const [wished, setWished] = useState(false);
    const [imgError, setImgError] = useState(false);

    const title = product.product_name || product.title || '';
    const subtitle = product.subtitle || (product.is_verified ? 'Verified product listing' : 'Scraped search index');
    const marketplace = product.marketplace || 'Store';
    const price = product.extracted_price != null ? Number(product.extracted_price) : Number(product.price || 0);
    const original = product.original_price ? Number(product.original_price) : null;
    const rating = product.rating || 4.5;
    const reviews = product.reviews || 1200;
    const image = product.image_url || product.image;
    const isLarge = product.span === 'lg';

    const discount = original && original > price ? Math.round(((original - price) / original) * 100) : 0;
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
                {!imgError && image ? (
                    <img
                        src={image}
                        alt={title}
                        loading={priority ? 'eager' : 'lazy'}
                        className="h-full w-full object-contain p-4 transition-all duration-700 group-hover:scale-108 group-hover:rotate-1"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <div className="w-14 h-14 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                            <Sparkles className="h-6 w-6 text-neutral-600 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-600">No Image</span>
                    </div>
                )}

                <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 backdrop-blur-md transition-transform group-hover:scale-105">
                    <Store className="h-3 w-3 text-cyan-300" strokeWidth={1.75} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-100">
                        {marketplace}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setWished(!wished);
                    }}
                    className={`absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 backdrop-blur-md transition-all btn-magnetic ${wished ? 'bg-rose-500/20 text-rose-300 scale-110' : 'bg-black/40 text-neutral-200 hover:bg-black/60 hover:scale-105'
                        }`}
                    aria-label="Add to wishlist"
                >
                    <Heart className={`h-4 w-4 transition-transform duration-300 ${wished ? 'fill-rose-400 text-rose-400 scale-110' : 'group-hover:scale-110'}`} strokeWidth={1.75} />
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
                            −{discount}% verified
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {(product.tags || ['Verified Store', 'Live Stock']).map((t) => (
                            <span
                                key={t}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-transform hover:scale-105 ${toneMap[tone] ?? toneMap.cyan
                                    }`}
                            >
                                <BadgeCheck className="h-2.5 w-2.5" strokeWidth={2} />
                                {t}
                            </span>
                        ))}
                    </div>

                    <h3 className="font-display text-[17px] font-medium leading-snug tracking-tight text-white line-clamp-2 group-hover:text-cyan-200 transition-colors">
                        {title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 line-clamp-2">{subtitle}</p>

                    <div className="mt-3 flex items-center gap-2">
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
                            <span className="text-neutral-600">· {reviews.toLocaleString()}</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-display text-2xl font-semibold tracking-tight text-white price-pop">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            {original && (
                                <span className="text-[13px] text-neutral-500 line-through">
                                    ₹{original.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                            Best price · today
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
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] text-neutral-200 transition-all hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-indigo-500/20 hover:text-white hover:scale-105 btn-magnetic"
                            >
                                View
                                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
                            </a>
                        ) : (
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] text-neutral-200 transition-all hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-indigo-500/20 hover:text-white hover:scale-105 btn-magnetic"
                            >
                                View
                                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function ProductGrid({ items = [], query = '', ready = true, onCardClick }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [watchdogProduct, setWatchdogProduct] = useState(null);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        setCurrentPage(1);
    }, [items, query]);

    if (!ready || !items || items.length === 0) return null;

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