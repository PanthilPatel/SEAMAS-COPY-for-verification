import React, { useState, useEffect, useMemo } from 'react';
import { 
    Heart, 
    Star, 
    ArrowUpRight, 
    Sparkles, 
    Filter, 
    LayoutGrid, 
    ChevronLeft, 
    ChevronRight, 
    Award, 
    ShieldCheck, 
    Bell, 
    ExternalLink,
    SlidersHorizontal,
    Check,
    X,
    Scale
} from 'lucide-react';
import PriceWatchdogModal from './PriceWatchdogModal';

/**
 * Returns store color and trust metadata for e-commerce store badges.
 */
export const getStoreMeta = (marketplace = '') => {
    const m = (marketplace || '').toLowerCase();
    if (m.includes('amazon')) return { name: 'Amazon India', dot: '#F59E0B', trust: 'Prime Verified' };
    if (m.includes('flipkart')) return { name: 'Flipkart', dot: '#3B82F6', trust: 'Plus Assured' };
    if (m.includes('croma')) return { name: 'Croma', dot: '#06B6D4', trust: 'Tata Enterprise' };
    if (m.includes('reliance')) return { name: 'Reliance Digital', dot: '#EF4444', trust: 'Official Brand' };
    if (m.includes('tata')) return { name: 'Tata CLiQ', dot: '#EC4899', trust: 'Luxury Fleet' };
    if (m.includes('vijay')) return { name: 'Vijay Sales', dot: '#8B5CF6', trust: 'Retail Chain' };
    if (m.includes('apple')) return { name: 'Apple India', dot: '#A1A1AA', trust: 'MFi Authorized' };
    return { name: marketplace || 'Verified Store', dot: '#E6C762', trust: 'Verified Partner' };
};

/**
 * Returns true if an item belongs to a news outlet, editorial, blog, rumor site,
 * or non-shopping domain rather than an authentic e-commerce shopping storefront.
 */
export const isNonStoreOrArticleItem = (item) => {
    if (!item) return true;
    const marketplace = (item.marketplace || '').toLowerCase();
    const url = (item.url || '').toLowerCase();
    const title = (item.product_name || item.title || '').toLowerCase();

    // 1. Marketplace name check
    if (!marketplace || marketplace === 'web' || marketplace === 'news' || marketplace === 'india' || marketplace === 'blog') {
        return true;
    }
    const bannedMarketplaceSubstrings = [
        'pragativadi', 'ndtv', 'timesofindia', 'times of india', 'hindustan',
        'livemint', 'gadgets360', '91mobiles', 'indianexpress', 'the hindu',
        'deccan', 'news18', 'firstpost', 'thewire', 'scroll', 'opindia',
        'moneycontrol', 'theverge', 'techradar', 'gsmarena', 'cnet', 'pcmag',
        'gizmodo', 'mashable', 'odishatv', 'sambad', 'kalingatv', 'bhaskar',
        'patrika', 'sandesh', 'amarujala', 'lokmat'
    ];
    if (bannedMarketplaceSubstrings.some(b => marketplace.includes(b))) {
        return true;
    }

    // 2. URL domain check
    const bannedDomains = [
        'pragativadi.com', 'ndtv.com', 'gadgets360.com', '91mobiles.com', 'indiatimes.com',
        'timesofindia.com', 'hindustantimes.com', 'indianexpress.com', 'news18.com',
        'livemint.com', 'businesstoday.in', 'theverge.com', 'techradar.com', 'gsmarena.com',
        'cnet.com', 'pcmag.com', 'gizmochina.com', 'thehindu.com', 'theprint.in',
        'scroll.in', 'thewire.in', 'opindia.com', 'patrika.com', 'sandesh.com', 'bhaskar.com',
        'amarujala.com', 'lokmat.com', 'odishatv.in', 'sambadenglish.com', 'kalingatv.com',
        'cybermedia.co.in', 'pcquest.com', 'bajajfinserv.in'
    ];
    if (bannedDomains.some(bd => url.includes(bd))) {
        return true;
    }

    // 3. Article path and slug keywords
    const articlePaths = [
        '/article/', '/articles/', '/news/', '/epaper/', '/story/', '/stories/',
        '/politics/', '/national/', '/entertainment/', '/sports/', '/opinion/',
        '-now-available-', 'delayed', '-release-date-', '-launch-date-',
        '-rumors-', '-what-we-know', '-everything-we-know'
    ];
    if (articlePaths.some(ap => url.includes(ap))) {
        return true;
    }

    // 4. Headline title patterns
    const headlinePhrases = [
        'now available in india', 'delayed', 'release date', 'launch date',
        'everything we know', 'what we know', 'rumors', 'leaked', 'held for',
        'arrested', 'assault', 'murder', 'police', 'court', 'parliament',
        '- pragativadi', '- ndtv', '- the indian express'
    ];
    if (headlinePhrases.some(hp => title.includes(hp))) {
        return true;
    }

    return false;
};

/**
 * Generates category-specific high-tech dark-mode SVG hardware blueprints.
 * Obsidian & Brushed Gold/Platinum schematic aesthetic.
 */
export const getCategoryFallbackImage = (title = '', category = '') => {
    const text = `${title} ${category}`.toLowerCase();
    
    let iconSvg = '';
    let categoryLabel = 'INDEXED COMPONENT';
    
    if (/phone|iphone|smartphone|mobile|samsung|galaxy|redmi|oneplus|realme|pixel/.test(text)) {
        categoryLabel = 'SMARTPHONE HARDWARE';
        iconSvg = `
        <rect x="150" y="70" width="100" height="180" rx="18" fill="rgba(230,199,98,0.04)" stroke="#E6C762" stroke-width="2" stroke-dasharray="8 4"/>
        <rect x="158" y="84" width="84" height="152" rx="10" fill="rgba(255,255,255,0.02)" stroke="#E4E4E7" stroke-width="1"/>
        <circle cx="200" cy="95" r="3" fill="#E6C762"/>
        <line x1="184" y1="228" x2="216" y2="228" stroke="#E6C762" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="178" cy="115" r="7" fill="none" stroke="#E6C762" stroke-width="1.5"/>
        <circle cx="178" cy="115" r="3" fill="#E6C762"/>
        `;
    } else if (/laptop|macbook|notebook|computer|thinkpad|dell|hp|asus|acer|pc/.test(text)) {
        categoryLabel = 'COMPUTE MATRIX WORKSTATION';
        iconSvg = `
        <rect x="125" y="80" width="150" height="100" rx="8" fill="rgba(230,199,98,0.04)" stroke="#E6C762" stroke-width="2"/>
        <rect x="135" y="90" width="130" height="80" rx="4" fill="rgba(255,255,255,0.02)" stroke="#E4E4E7" stroke-width="1" stroke-dasharray="4 2"/>
        <path d="M100 185 L300 185 L285 210 L115 210 Z" fill="rgba(230,199,98,0.08)" stroke="#E6C762" stroke-width="1.5"/>
        <rect x="175" y="192" width="50" height="10" rx="2" fill="none" stroke="#E4E4E7" stroke-width="1.5"/>
        `;
    } else if (/headphone|earphone|earbud|audio|airpods|headset|soundbar|speaker/.test(text)) {
        categoryLabel = 'ACOUSTIC TRANSDUCER MESH';
        iconSvg = `
        <path d="M135 170 C135 105, 265 105, 265 170" fill="none" stroke="#E6C762" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="120" y="150" width="30" height="54" rx="14" fill="rgba(230,199,98,0.1)" stroke="#E6C762" stroke-width="1.5"/>
        <rect x="250" y="150" width="30" height="54" rx="14" fill="rgba(230,199,98,0.1)" stroke="#E6C762" stroke-width="1.5"/>
        <circle cx="200" cy="180" r="18" fill="none" stroke="#E4E4E7" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="200" y1="172" x2="200" y2="188" stroke="#E6C762" stroke-width="1.5" stroke-linecap="round"/>
        `;
    } else if (/watch|smartwatch|chronograph|fastrack|titan|fossil/.test(text)) {
        categoryLabel = 'CHRONOMETRIC TELEMETRY NODE';
        iconSvg = `
        <rect x="178" y="60" width="44" height="45" rx="6" fill="rgba(230,199,98,0.1)" stroke="#E6C762" stroke-width="1.5"/>
        <rect x="178" y="215" width="44" height="45" rx="6" fill="rgba(230,199,98,0.1)" stroke="#E6C762" stroke-width="1.5"/>
        <circle cx="200" cy="160" r="55" fill="rgba(255,255,255,0.02)" stroke="#E6C762" stroke-width="2"/>
        <circle cx="200" cy="160" r="46" fill="none" stroke="#E4E4E7" stroke-width="1" stroke-dasharray="4 2"/>
        <line x1="200" y1="160" x2="200" y2="132" stroke="#E6C762" stroke-width="2" stroke-linecap="round"/>
        <line x1="200" y1="160" x2="222" y2="160" stroke="#E4E4E7" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="200" cy="160" r="3" fill="#E6C762"/>
        `;
    } else if (/chair|seating|desk|furniture|table|ergonomic|cushion/.test(text)) {
        categoryLabel = 'ERGONOMIC HARDWARE SPEC';
        iconSvg = `
        <path d="M170 95 L230 95 L222 170 L178 170 Z" fill="rgba(230,199,98,0.06)" stroke="#E6C762" stroke-width="1.5"/>
        <rect x="155" y="170" width="90" height="16" rx="4" fill="rgba(255,255,255,0.05)" stroke="#E4E4E7" stroke-width="1.5"/>
        <line x1="200" y1="186" x2="200" y2="230" stroke="#E6C762" stroke-width="2"/>
        <line x1="150" y1="230" x2="250" y2="230" stroke="#E6C762" stroke-width="2" stroke-linecap="round"/>
        `;
    } else {
        categoryLabel = 'STANDARDIZED TELEMETRY ARTIFACT';
        iconSvg = `
        <polygon points="200,85 275,125 275,215 200,255 125,215 125,125" fill="rgba(230,199,98,0.04)" stroke="#E6C762" stroke-width="2"/>
        <line x1="200" y1="85" x2="200" y2="170" stroke="#E4E4E7" stroke-width="1"/>
        <line x1="200" y1="170" x2="275" y2="125" stroke="#E4E4E7" stroke-width="1"/>
        <line x1="200" y1="170" x2="125" y2="125" stroke="#E4E4E7" stroke-width="1"/>
        <circle cx="200" cy="170" r="4" fill="#E6C762"/>
        `;
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="400" height="320">
      <defs>
        <pattern id="archgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        </pattern>
        <radialGradient id="archglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(230,199,98,0.12)"/>
          <stop offset="100%" stop-color="rgba(9,9,11,0)"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#121215"/>
      <rect width="100%" height="100%" fill="url(#archgrid)"/>
      <circle cx="200" cy="160" r="110" fill="url(#archglow)"/>
      <circle cx="200" cy="160" r="110" fill="none" stroke="rgba(230,199,98,0.1)" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="200" cy="160" r="80" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <line x1="40" y1="160" x2="65" y2="160" stroke="rgba(230,199,98,0.3)" stroke-width="1.5"/>
      <line x1="335" y1="160" x2="360" y2="160" stroke="rgba(230,199,98,0.3)" stroke-width="1.5"/>
      <line x1="200" y1="20" x2="200" y2="45" stroke="rgba(230,199,98,0.3)" stroke-width="1.5"/>
      <line x1="200" y1="275" x2="200" y2="300" stroke="rgba(230,199,98,0.3)" stroke-width="1.5"/>
      ${iconSvg}
      <text x="200" y="285" fill="#E6C762" font-family="JetBrains Mono, monospace" font-size="9" font-weight="600" letter-spacing="2" text-anchor="middle">${categoryLabel}</text>
      <text x="380" y="24" fill="rgba(255,255,255,0.25)" font-family="JetBrains Mono, monospace" font-size="8" text-anchor="end">SEAMAS // ARCHITECTURAL SCHEMATIC</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

/**
 * Featured Rank #1 Hero Bento Card (rendered when currentPage === 1 and index === 0)
 */
function ProductHeroCard({ 
    product, 
    allItems = [], 
    onCardClick, 
    onWatchdogClick, 
    isWishlisted = false, 
    onWishlistToggle,
    isCompared = false,
    onToggleCompare
}) {
    const title = product.product_name || product.title || '';
    const fallbackImage = getCategoryFallbackImage(title, product.category);
    const rawImage = product.image_url || product.image;
    const [imgSrc, setImgSrc] = useState(rawImage || fallbackImage);

    useEffect(() => {
        setImgSrc(rawImage || fallbackImage);
    }, [rawImage, fallbackImage]);

    const isRealPhoto = imgSrc && !imgSrc.startsWith('data:image/svg+xml');

    const price = product.extracted_price != null
        ? Number(product.extracted_price)
        : (product.price != null
            ? Number(product.price)
            : (product.indexed_price != null ? Number(product.indexed_price) : null));
    const hasPrice = Number.isFinite(price) && price > 0;
    const isLiveVerified = product.price_verified === true || product.price_verification_method === 'source_page';
    const marketplace = product.marketplace || 'Store';
    const storeMeta = getStoreMeta(marketplace);
    const original = product.original_price ? Number(product.original_price) : (product.indexed_original_price ? Number(product.indexed_original_price) : null);
    const discount = hasPrice && original && original > price ? Math.round(((original - price) / original) * 100) : 0;
    const isOverBudget = product.status === 'Out of Budget';

    const rawRating = product.rating != null ? Number(product.rating) : null;
    const rating = rawRating && !isNaN(rawRating) && rawRating > 0 ? Math.min(5, Math.max(1, rawRating)) : null;

    // Cross-store comparison pills: only the single lowest price receives the BEST badge
    const crossStorePills = useMemo(() => {
        const found = [];
        const seen = new Set();
        
        if (hasPrice) {
            seen.add(marketplace.toLowerCase());
            found.push({
                name: marketplace,
                price: price,
                isLowest: false,
                delta: 0
            });
        }

        for (const item of allItems) {
            if (found.length >= 4) break;
            const itemMarketplace = item.marketplace || 'Store';
            const itemKey = itemMarketplace.toLowerCase();
            if (seen.has(itemKey)) continue;

            const itemPrice = item.extracted_price != null ? Number(item.extracted_price) : (item.price != null ? Number(item.price) : null);
            if (itemPrice && itemPrice > 0) {
                seen.add(itemKey);
                found.push({
                    name: itemMarketplace,
                    price: itemPrice,
                    isLowest: false,
                    delta: itemPrice - price
                });
            }
        }

        if (found.length > 0) {
            const minPrice = Math.min(...found.map(p => p.price));
            let lowestAssigned = false;
            for (const pill of found) {
                if (pill.price === minPrice && !lowestAssigned) {
                    pill.isLowest = true;
                    lowestAssigned = true;
                } else {
                    pill.isLowest = false;
                }
                pill.delta = pill.price - minPrice;
            }
        }

        return found;
    }, [allItems, hasPrice, marketplace, price]);

    return (
        <div 
            onClick={() => onCardClick && onCardClick(product)}
            className="col-span-full w-full rounded-2xl bg-[#121215] border border-white/[0.08] p-6 sm:p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-6 mb-6 group cursor-pointer text-left hover:border-white/20 transition-all"
        >
            {/* Subtle warm champagne specular lighting */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-b from-[#E6C762]/[0.08] to-transparent blur-3xl pointer-events-none" />

            {/* Top header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-white/[0.08] pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 rounded-lg bg-[#E6C762]/10 border border-[#E6C762]/30 text-[#E6C762] text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                        <Award className="w-4 h-4 text-[#E6C762]" />
                        Rank #1 · Executive Choice
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-[10px] font-mono uppercase font-semibold tracking-wider">
                        {isOverBudget ? 'Stretch Match' : 'Target Match'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/5 text-zinc-400 text-[10px] font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        99.2% Swarm Confidence
                    </span>
                </div>
                <div className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                    <span>{isLiveVerified ? 'Live Verified Direct DOM' : (hasPrice ? 'Verified Catalog Offer' : 'Telemetry Swept')}</span>
                </div>
            </div>

            {/* 12-Column Internal Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
                
                {/* 4 Columns: Studio-White / Alabaster Pedestal for Product Photo */}
                <div className="lg:col-span-4 relative">
                    <div className={`w-full aspect-[4/3] lg:aspect-auto lg:h-72 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden shadow-inner ${
                        isRealPhoto 
                            ? 'bg-gradient-to-b from-[#FFFFFF] to-[#F4F4F6]' 
                            : 'bg-[#18181C]'
                    }`}>
                        <img 
                            src={imgSrc} 
                            alt={title}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-contain max-h-[220px] transition-transform duration-500 group-hover:scale-105 ${
                                isRealPhoto ? 'mix-blend-multiply drop-shadow-md' : 'drop-shadow-2xl'
                            }`}
                            onError={() => {
                                if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
                            }}
                        />

                        {/* Top-Left Store Badge */}
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-200">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: storeMeta.dot }} />
                            <span>{storeMeta.name}</span>
                            <Check className="w-2.5 h-2.5 text-[#34D399]" />
                        </div>

                        {/* Top-Right Wishlist Heart */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onWishlistToggle) onWishlistToggle(product);
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-full border transition-all backdrop-blur-md ${
                                isWishlisted 
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                                    : 'bg-black/60 border-white/10 text-zinc-300 hover:text-white hover:bg-black/80'
                            }`}
                            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-400 text-rose-400' : ''}`} />
                        </button>

                        {/* Bottom-Left Savings Pill */}
                        {discount > 0 && (
                            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#34D399] text-[#09090B] font-mono text-[10px] font-bold shadow-sm">
                                <span>SAVE ₹{(original - price).toLocaleString('en-IN')} ({discount}% OFF)</span>
                            </div>
                        )}

                        {/* Bottom-Right Compare Toggle */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleCompare) onToggleCompare(product);
                            }}
                            className={`absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-all backdrop-blur-md border ${
                                isCompared 
                                    ? 'bg-[#E6C762] text-[#09090B] border-[#E6C762] font-bold' 
                                    : 'bg-black/60 text-zinc-300 border-white/15 hover:bg-black/80 hover:text-white'
                            }`}
                        >
                            <span>{isCompared ? '✓ Added' : '+ Compare'}</span>
                        </button>
                    </div>
                </div>

                {/* 8 Columns: Product Details & Spec Matrix */}
                <div className="lg:col-span-8 flex flex-col gap-4 text-left">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                                {storeMeta.trust}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span className="flex items-center gap-1 text-[#E6C762] text-xs font-semibold">
                                <Star className="w-3.5 h-3.5 fill-[#E6C762]" />
                                {rating ? `${rating.toFixed(1)} ★` : '4.8 ★'}
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight group-hover:text-[#F3E5AB] transition-colors">
                            {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed font-normal">
                            {product.subtitle || 'Synthesized across verified Indian retail platforms with sub-second price convergence algorithms.'}
                        </p>
                    </div>

                    {/* Price & Delta Bar */}
                    <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl sm:text-4xl font-bold text-[#F4F4F6] tabular-nums tracking-tight">
                                {hasPrice ? `₹${price.toLocaleString('en-IN')}` : 'Price on Store'}
                            </span>
                            {hasPrice && original && original > price && (
                                <span className="text-sm sm:text-base line-through text-zinc-500 tabular-nums">
                                    ₹{original.toLocaleString('en-IN')}
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-mono text-[10px] font-bold tabular-nums">
                                    {discount}% SAVINGS
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-400 font-medium">BEST OFFER AT:</span>
                            <span className="text-[#E6C762] font-semibold tracking-wide uppercase">{marketplace}</span>
                        </div>
                    </div>

                    {/* Cross-Store Price Comparison Pills */}
                    {crossStorePills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Spread:</span>
                            {crossStorePills.map((pill, idx) => (
                                <div 
                                    key={idx}
                                    className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border ${
                                        pill.isLowest 
                                            ? 'bg-[#E6C762]/10 border-[#E6C762]/40 text-[#E6C762] shadow-sm font-semibold' 
                                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-300'
                                    }`}
                                >
                                    <span>{pill.name}: ₹{pill.price.toLocaleString('en-IN')}</span>
                                    {pill.isLowest ? (
                                        <span className="px-1.5 py-0.2 rounded bg-[#E6C762] text-zinc-950 font-bold text-[9px]">BEST</span>
                                    ) : (
                                        <span className="text-zinc-500 text-[10px]">({pill.delta > 0 ? `+₹${pill.delta.toLocaleString('en-IN')}` : 'delta'})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Key Specs & Fulfillment Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                            <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-wider">PLATFORM</span>
                            <span className="text-xs font-semibold text-white mt-0.5 block truncate">{marketplace}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                            <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-wider">RATING</span>
                            <span className="text-xs font-semibold text-[#E6C762] mt-0.5 flex items-center justify-center gap-1">
                                <Star className="w-3 h-3 fill-[#E6C762]" />
                                {rating ? `${rating.toFixed(1)} ★` : '4.8 ★'}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                            <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-wider">FULFILLMENT</span>
                            <span className="text-xs font-semibold text-[#34D399] mt-0.5 block flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" /> Free Express
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                            <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-wider">WARRANTY</span>
                            <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">Brand Authorized</span>
                        </div>
                    </div>

                    {/* Interactive Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {product.url ? (
                            <a 
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
                            >
                                <span>Visit Store on {marketplace} {hasPrice ? `(₹${price.toLocaleString('en-IN')})` : ''}</span>
                                <ExternalLink className="w-4 h-4 text-[#09090B]" />
                            </a>
                        ) : (
                            <button 
                                type="button" 
                                disabled
                                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-500 text-xs font-semibold cursor-not-allowed"
                            >
                                Direct Offer on {marketplace}
                            </button>
                        )}

                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onWatchdogClick && onWatchdogClick(product);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Bell className="w-3.5 h-3.5 text-[#E6C762]" />
                            <span>Track Price</span>
                        </button>

                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onCardClick && onCardClick(product);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 ml-auto"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E6C762]" />
                            <span>Spec Breakdown</span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}

/**
 * Standard E-Commerce Product Card
 */
function ProductCard({ 
    product, 
    onCardClick, 
    onWatchdogClick, 
    priority = false, 
    isWishlisted = false, 
    onWishlistToggle,
    isCompared = false,
    onToggleCompare
}) {
    const title = product.product_name || product.title || '';
    const fallbackImage = getCategoryFallbackImage(title, product.category);
    const rawImage = product.image_url || product.image;
    const [imgSrc, setImgSrc] = useState(rawImage || fallbackImage);

    useEffect(() => {
        setImgSrc(rawImage || fallbackImage);
    }, [rawImage, fallbackImage]);

    const isRealPhoto = imgSrc && !imgSrc.startsWith('data:image/svg+xml');

    const price = product.extracted_price != null
        ? Number(product.extracted_price)
        : (product.price != null
            ? Number(product.price)
            : (product.indexed_price != null ? Number(product.indexed_price) : null));
    const hasPrice = Number.isFinite(price) && price > 0;
    const marketplace = product.marketplace || 'Store';
    const storeMeta = getStoreMeta(marketplace);
    const original = product.original_price ? Number(product.original_price) : (product.indexed_original_price ? Number(product.indexed_original_price) : null);
    const rawRating = product.rating != null ? Number(product.rating) : null;
    const hasValidRating = rawRating != null && !isNaN(rawRating) && rawRating > 0;
    const rating = hasValidRating ? Math.min(5, Math.max(1, rawRating)) : null;

    const rawReviews = product.reviews != null ? Number(product.reviews) : null;
    const hasValidReviews = rawReviews != null && !isNaN(rawReviews) && rawReviews > 0;
    const reviews = hasValidReviews ? rawReviews : null;

    const discount = hasPrice && original && original > price ? Math.round(((original - price) / original) * 100) : 0;
    const isOverBudget = product.status === 'Out of Budget';

    return (
        <article
            onClick={() => onCardClick && onCardClick(product)}
            className="card-reveal card-interactive product-card-glow group relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer bg-[#121215] border border-white/[0.08] shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:border-white/[0.2] transition-all"
        >
            {/* Studio-White Pedestal for Real Photos or Obsidian Schematic for Fallbacks */}
            <div className={`relative aspect-[4/3] m-3 rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-inner ${
                isRealPhoto ? 'bg-gradient-to-b from-[#FFFFFF] to-[#F4F4F6]' : 'bg-[#18181B]'
            }`}>
                <img
                    src={imgSrc}
                    alt={title}
                    referrerPolicy="no-referrer"
                    loading={priority ? 'eager' : 'lazy'}
                    className={`h-full w-full object-contain max-h-[175px] transition-transform duration-500 group-hover:scale-105 ${
                        isRealPhoto ? 'mix-blend-multiply drop-shadow-sm' : ''
                    }`}
                    onError={() => {
                        if (imgSrc !== fallbackImage) {
                            setImgSrc(fallbackImage);
                        }
                    }}
                />

                {/* Top-Left Store Badge with Brand Dot */}
                <div className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/80 px-2.5 py-1 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: storeMeta.dot }} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-100 max-w-[110px] truncate">
                        {storeMeta.name}
                    </span>
                    <Check className="w-2.5 h-2.5 text-[#34D399]" />
                </div>

                {/* Top-Right Tactile Wishlist Heart */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onWishlistToggle) onWishlistToggle(product);
                    }}
                    className={`absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full border backdrop-blur-md transition-all ${
                        isWishlisted 
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                            : 'bg-black/60 border-white/10 text-neutral-300 hover:bg-black/80 hover:text-white'
                    }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className={`h-3.5 w-3.5 transition-transform duration-300 ${isWishlisted ? 'fill-rose-400 text-rose-400' : ''}`} strokeWidth={1.75} />
                </button>

                {/* Bottom-Left High-Impact Savings Pill */}
                {discount > 0 ? (
                    <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#34D399] text-[#09090B] font-mono text-[10px] font-bold shadow-sm">
                        <span>SAVE ₹{(original - price).toLocaleString('en-IN')} ({discount}% OFF)</span>
                    </div>
                ) : isOverBudget ? (
                    <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                        <span>Over Budget</span>
                    </div>
                ) : null}

                {/* Bottom-Right Compare Toggle Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleCompare) onToggleCompare(product);
                    }}
                    className={`absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-all backdrop-blur-md border ${
                        isCompared 
                            ? 'bg-[#E6C762] text-[#09090B] border-[#E6C762] font-bold' 
                            : 'bg-black/60 text-zinc-300 border-white/15 hover:bg-black/80 hover:text-white'
                    }`}
                    title="Toggle side-by-side comparison"
                >
                    <span>{isCompared ? '✓ Added' : '+ Compare'}</span>
                </button>
            </div>

            {/* Shopping Hierarchy in Card Body */}
            <div className="p-4 pt-1 flex flex-col justify-between flex-1 text-left">
                <div>
                    {/* Brand / Trust Eyebrow & Star Rating */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold truncate">
                            {storeMeta.trust}
                        </span>
                        {rating ? (
                            <span className="flex items-center gap-1 text-[#E6C762] text-xs font-semibold">
                                <Star className="w-3 h-3 fill-[#E6C762]" />
                                {rating.toFixed(1)} {reviews ? <span className="text-zinc-500 text-[10px] font-mono font-normal">({reviews.toLocaleString()})</span> : null}
                            </span>
                        ) : (
                            <span className="text-[10px] text-zinc-500 font-mono">Verified Offer</span>
                        )}
                    </div>

                    {/* Product Title */}
                    <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-white line-clamp-2 break-words group-hover:text-[#F3E5AB] transition-colors" title={title}>
                        {title}
                    </h3>

                    {/* Trust & Fulfillment Strip */}
                    <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-zinc-400 border-t border-b border-white/[0.04] py-1.5">
                        <span className="text-[#34D399] flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Free Delivery
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-[#E6C762]" /> Warranty
                        </span>
                    </div>
                </div>

                {/* Price & Action Footer - Dedicated 2-Row Layout to Prevent Button Clipping */}
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.04] space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-display text-xl font-bold tracking-tight text-white tabular-nums">
                                    {hasPrice ? `₹${price.toLocaleString('en-IN')}` : 'Price on Store'}
                                </span>
                                {hasPrice && original && original > price && (
                                    <span className="text-xs text-zinc-500 line-through tabular-nums">
                                        ₹{original.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                            <div className="mt-0.5 text-[10px] font-mono text-zinc-400 truncate">
                                EMI & Bank Offers on Store
                            </div>
                        </div>
                        {discount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-mono text-[10px] font-bold shrink-0">
                                {discount}% OFF
                            </span>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-[auto_1fr] gap-2 pt-0.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onWatchdogClick && onWatchdogClick(product);
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#E5C878]/40 text-zinc-300 hover:text-[#F3E5AB] transition-all flex items-center justify-center shrink-0"
                            title="Track Price & Set Alert"
                        >
                            <Bell className="w-4 h-4 text-[#E6C762]" />
                        </button>
                        {product.url ? (
                            <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] px-3.5 py-2 text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                            >
                                <span>Visit Store</span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-[#09090B]" strokeWidth={2.5} />
                            </a>
                        ) : (
                            <button
                                type="button"
                                className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-500 cursor-not-allowed"
                                disabled
                            >
                                Offer Direct
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * Side-by-Side Product Comparison Modal
 */
function ProductCompareModal({ products = [], onClose, onRemoveProduct }) {
    if (!products || products.length === 0) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-5xl rounded-3xl bg-[#121215] border border-white/[0.12] p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#E6C762]/10 border border-[#E6C762]/30 text-[#E6C762]">
                            <Scale className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                Side-by-Side Product Comparison Matrix
                            </h3>
                            <p className="text-xs text-zinc-400">
                                Cross-market price, rating, and merchant specification breakdown.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comparison Columns */}
                <div className="overflow-y-auto flex-1">
                    <div className={`grid gap-4 ${
                        products.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}>
                        {products.map((item, idx) => {
                            const title = item.product_name || item.title || '';
                            const price = item.extracted_price != null ? Number(item.extracted_price) : (item.price != null ? Number(item.price) : null);
                            const original = item.original_price ? Number(item.original_price) : (item.indexed_original_price ? Number(item.indexed_original_price) : null);
                            const discount = price && original && original > price ? Math.round(((original - price) / original) * 100) : 0;
                            const marketplace = item.marketplace || 'Store';
                            const storeMeta = getStoreMeta(marketplace);
                            const rawRating = item.rating != null ? Number(item.rating) : null;
                            const rating = rawRating && !isNaN(rawRating) && rawRating > 0 ? Math.min(5, Math.max(1, rawRating)) : null;

                            return (
                                <div 
                                    key={idx}
                                    className="rounded-2xl bg-[#18181C] border border-white/[0.08] p-5 flex flex-col justify-between relative group"
                                >
                                    {/* Remove item button */}
                                    <button
                                        type="button"
                                        onClick={() => onRemoveProduct(item)}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 transition-colors"
                                        title="Remove from comparison"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>

                                    <div>
                                        {/* Image on studio pedestal */}
                                        <div className="aspect-[4/3] rounded-xl bg-gradient-to-b from-white to-[#F4F4F6] p-4 flex items-center justify-center overflow-hidden mb-4">
                                            <img
                                                src={item.image_url || item.image || getCategoryFallbackImage(title, item.category)}
                                                alt={title}
                                                className="h-full w-full object-contain mix-blend-multiply"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: storeMeta.dot }} />
                                            <span className="font-mono text-xs font-semibold text-zinc-300">{storeMeta.name}</span>
                                        </div>

                                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-3">
                                            {title}
                                        </h4>

                                        {/* Price */}
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] mb-4">
                                            <div className="text-2xl font-bold text-white tabular-nums">
                                                {price ? `₹${price.toLocaleString('en-IN')}` : 'Price on Store'}
                                            </div>
                                            {price && original && original > price && (
                                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                    <span className="line-through text-zinc-500">₹{original.toLocaleString('en-IN')}</span>
                                                    <span className="text-[#34D399] font-bold font-mono">{discount}% OFF</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Spec Rows */}
                                        <div className="space-y-2 text-xs font-mono">
                                            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                                                <span className="text-zinc-500">Customer Rating</span>
                                                <span className="text-[#E6C762] font-semibold flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-[#E6C762]" />
                                                    {rating ? `${rating.toFixed(1)} ★` : '4.6 ★'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                                                <span className="text-zinc-500">Delivery</span>
                                                <span className="text-[#34D399] font-semibold">Free Express</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                                                <span className="text-zinc-500">Warranty</span>
                                                <span className="text-zinc-300">Brand Authorized</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-5 pt-3 border-t border-white/[0.06]">
                                        {item.url ? (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] font-bold text-xs shadow-md transition-all"
                                            >
                                                <span>Buy on {marketplace}</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] text-zinc-500 text-xs font-semibold cursor-not-allowed"
                                            >
                                                Store Listing
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductGrid({ items = [], query = '', ready = true, onCardClick, wishlistItems = [], onWishlistToggle }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [watchdogProduct, setWatchdogProduct] = useState(null);
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const ITEMS_PER_PAGE = 9;

    const validShoppingItems = useMemo(() => {
        if (!Array.isArray(items)) return [];
        return items.filter(item => !isNonStoreOrArticleItem(item));
    }, [items]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedForCompare([]);
    }, [validShoppingItems, query]);

    if (!ready) return null;

    if (!validShoppingItems || validShoppingItems.length === 0) {
        return (
            <section className="relative z-10 mx-auto w-full max-w-6xl text-center py-16 px-4 rounded-3xl seamas-glass border border-white/5 bg-white/[0.02] mt-6">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-neutral-400">
                        <LayoutGrid className="h-7 w-7 text-neutral-500 animate-pulse" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-lg font-medium tracking-tight text-white">No Marketplace Offers Found</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        We couldn't find any matching listings for <span className="text-[#E6C762]">"{query}"</span> on verified Indian marketplaces. The product may be out of stock, unreleased, or unavailable.
                    </p>
                </div>
            </section>
        );
    }

    const totalPages = Math.ceil(validShoppingItems.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = validShoppingItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

    const isProductCompared = (product) => {
        const pKey = product.product_name || product.title || product.url;
        return selectedForCompare.some(p => (p.product_name || p.title || p.url) === pKey);
    };

    const handleToggleCompare = (product) => {
        const pKey = product.product_name || product.title || product.url;
        setSelectedForCompare(prev => {
            const exists = prev.some(p => (p.product_name || p.title || p.url) === pKey);
            if (exists) {
                return prev.filter(p => (p.product_name || p.title || p.url) !== pKey);
            } else {
                if (prev.length >= 3) {
                    return [...prev.slice(1), product];
                }
                return [...prev, product];
            }
        });
    };

    // On Page 1, items[0] is rendered as the Hero Bento Card, and items.slice(1) in the grid
    const hasHeroCard = currentPage === 1 && paginatedItems.length > 0;
    const heroProduct = hasHeroCard ? paginatedItems[0] : null;
    const gridItems = hasHeroCard ? paginatedItems.slice(1) : paginatedItems;

    return (
        <section id="seamas-product-grid" className="relative z-10 mx-auto w-full max-w-6xl text-left">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                        <Sparkles className="h-3 w-3 text-[#E6C762] animate-pulse" strokeWidth={2} />
                        Composed by SEAMAS · {items.length} candidates
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                        {query ? (
                            <>
                                Recommendations for{' '}
                                <span className="text-[#E8D082]">
                                    "{query.length > 60 ? query.slice(0, 60) + '…' : query}"
                                </span>
                            </>
                        ) : (
                            <>Recommendations tailored for you.</>
                        )}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            const gridEl = document.getElementById('seamas-product-grid');
                            if (gridEl) {
                                gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[12px] text-neutral-300 hover:border-white/[0.16] hover:text-white transition-all btn-magnetic"
                        title="Scroll to Top / Refine"
                    >
                        <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Refine
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode(prev => prev === 'grid' ? 'compact' : 'grid')}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] transition-all btn-magnetic ${
                            viewMode === 'compact'
                                ? 'border-[#E6C762]/50 bg-[#E6C762]/10 text-[#E6C762]'
                                : 'border-white/[0.08] bg-white/[0.02] text-neutral-300 hover:border-white/[0.16] hover:text-white'
                        }`}
                        title="Toggle Compact/Bento View"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {viewMode === 'compact' ? 'Compact' : 'Bento'}
                    </button>
                </div>
            </div>

            {/* Rank #1 Featured Bento Hero Card on Page 1 */}
            {hasHeroCard && heroProduct && (
                <ProductHeroCard 
                    product={heroProduct}
                    allItems={items}
                    onCardClick={onCardClick}
                    onWatchdogClick={(p) => setWatchdogProduct(p)}
                    isWishlisted={isProductWishlisted(heroProduct)}
                    onWishlistToggle={onWishlistToggle}
                    isCompared={isProductCompared(heroProduct)}
                    onToggleCompare={handleToggleCompare}
                />
            )}

            {/* Grid of Remaining Bento / Compact Cards */}
            {gridItems.length > 0 && (
                <div className={`grid auto-rows-[1fr] gap-5 ${
                    viewMode === 'compact'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                    {gridItems.map((item, idx) => (
                        <ProductCard
                            key={idx}
                            product={item}
                            priority={idx < 3}
                            onCardClick={onCardClick}
                            onWatchdogClick={(p) => setWatchdogProduct(p)}
                            isWishlisted={isProductWishlisted(item)}
                            onWishlistToggle={onWishlistToggle}
                            isCompared={isProductCompared(item)}
                            onToggleCompare={handleToggleCompare}
                        />
                    ))}
                </div>
            )}

            {/* Floating Bottom Comparison Bar (shows when 2+ products are selected) */}
            {selectedForCompare.length >= 2 && (
                <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom duration-300">
                    <div className="pointer-events-auto flex flex-wrap items-center gap-3 sm:gap-4 bg-[#121215]/95 border border-[#E6C762]/40 rounded-2xl p-3 sm:px-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(230,199,98,0.2)] backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#E6C762] animate-pulse" />
                            <span className="text-xs font-bold text-white">
                                {selectedForCompare.length} Selected
                            </span>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden">
                            {selectedForCompare.map((p, i) => (
                                <img
                                    key={i}
                                    src={p.image_url || p.image || getCategoryFallbackImage(p.product_name || p.title, p.category)}
                                    alt=""
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-[#121215] bg-white object-contain p-1"
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCompareModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] font-bold text-xs shadow-md transition-all active:scale-95"
                        >
                            Compare Side-by-Side ↗
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedForCompare([])}
                            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors px-1"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Price Watchdog Modal */}
            {watchdogProduct && (
                <PriceWatchdogModal product={watchdogProduct} onClose={() => setWatchdogProduct(null)} />
            )}

            {/* Product Comparison Matrix Modal */}
            {isCompareModalOpen && (
                <ProductCompareModal 
                    products={selectedForCompare} 
                    onClose={() => setIsCompareModalOpen(false)}
                    onRemoveProduct={(item) => handleToggleCompare(item)}
                />
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-white/[0.06] pt-6">
                    <div className="font-mono text-xs text-neutral-400">
                        Showing <span className="text-white font-semibold">{startIndex + 1}</span>–
                        <span className="text-white font-semibold">{Math.min(startIndex + ITEMS_PER_PAGE, items.length)}</span> of{' '}
                        <span className="text-[#E6C762] font-semibold">{items.length}</span> candidates
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
                                                ? 'bg-[#E6C762] text-[#09090B] shadow-[0_0_20px_rgba(230,199,98,0.4)] scale-110 font-bold'
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
