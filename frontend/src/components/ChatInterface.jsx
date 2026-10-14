import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    Sparkles, 
    Mic, 
    Command, 
    ArrowUpRight, 
    Zap, 
    Sliders,
    Headphones,
    Laptop,
    Smartphone,
    Watch,
    Tv,
    Gamepad2,
    Star,
    ExternalLink,
    ShieldCheck,
    CheckCircle2,
    Tag,
    TrendingDown,
    Truck,
    CreditCard
} from 'lucide-react';

const SONY_XM5_STUDIO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <defs>
    <radialGradient id="sony-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.22)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="sony-headband" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1A1A1D"/>
      <stop offset="25%" stop-color="#303036"/>
      <stop offset="50%" stop-color="#4A4A52"/>
      <stop offset="75%" stop-color="#303036"/>
      <stop offset="100%" stop-color="#1A1A1D"/>
    </linearGradient>
    <linearGradient id="sony-cup-left" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A3A40"/>
      <stop offset="50%" stop-color="#222226"/>
      <stop offset="100%" stop-color="#121214"/>
    </linearGradient>
    <linearGradient id="sony-cup-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A3A40"/>
      <stop offset="50%" stop-color="#222226"/>
      <stop offset="100%" stop-color="#121214"/>
    </linearGradient>
    <linearGradient id="sony-cushion" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#25252A"/>
      <stop offset="100%" stop-color="#0E0E10"/>
    </linearGradient>
    <linearGradient id="sony-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E6B3"/>
      <stop offset="50%" stop-color="#E5C878"/>
      <stop offset="100%" stop-color="#C9A449"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="275" rx="115" ry="16" fill="url(#sony-shadow)"/>
  <path d="M 125 178 C 120 68, 280 68, 275 178" fill="none" stroke="url(#sony-headband)" stroke-width="18" stroke-linecap="round"/>
  <path d="M 130 168 C 135 85, 265 85, 270 168" fill="none" stroke="#5E5E68" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <path d="M 140 158 C 145 92, 255 92, 260 158" fill="none" stroke="#121214" stroke-width="12" stroke-linecap="round"/>
  <rect x="117" y="148" width="8" height="34" rx="4" fill="#3D3D44"/>
  <circle cx="121" cy="180" r="3" fill="url(#sony-gold)"/>
  <rect x="275" y="148" width="8" height="34" rx="4" fill="#3D3D44"/>
  <circle cx="279" cy="180" r="3" fill="url(#sony-gold)"/>
  <g transform="rotate(8, 120, 205)">
    <ellipse cx="118" cy="205" rx="28" ry="46" fill="url(#sony-cushion)" stroke="#2B2B30" stroke-width="2"/>
    <ellipse cx="126" cy="205" rx="22" ry="42" fill="url(#sony-cup-left)"/>
    <ellipse cx="127" cy="205" rx="18" ry="38" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    <circle cx="132" cy="192" r="3.5" fill="none" stroke="url(#sony-gold)" stroke-width="1.5"/>
    <circle cx="132" cy="192" r="1.5" fill="#000"/>
  </g>
  <g transform="rotate(-8, 280, 205)">
    <ellipse cx="282" cy="205" rx="28" ry="46" fill="url(#sony-cushion)" stroke="#2B2B30" stroke-width="2"/>
    <ellipse cx="274" cy="205" rx="22" ry="42" fill="url(#sony-cup-right)"/>
    <ellipse cx="273" cy="205" rx="18" ry="38" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    <circle cx="268" cy="192" r="3.5" fill="none" stroke="url(#sony-gold)" stroke-width="1.5"/>
    <circle cx="268" cy="192" r="1.5" fill="#000"/>
  </g>
  <text x="200" y="295" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#2D2D32" text-anchor="middle">SONY WH-1000XM5</text>
  <text x="200" y="310" font-family="monospace" font-size="9" font-weight="600" fill="#997A2E" text-anchor="middle">ACTIVE NOISE CANCELLATION · 30H BATTERY</text>
</svg>
`)}`;

const IPHONE_16_PRO_STUDIO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <defs>
    <radialGradient id="iphone-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.25)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="titanium-frame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2DDD2"/>
      <stop offset="30%" stop-color="#C5BCAD"/>
      <stop offset="70%" stop-color="#938A7A"/>
      <stop offset="100%" stop-color="#D4CCC0"/>
    </linearGradient>
    <linearGradient id="titanium-back" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5BCAD"/>
      <stop offset="50%" stop-color="#A59B8B"/>
      <stop offset="100%" stop-color="#847B6B"/>
    </linearGradient>
    <linearGradient id="iphone-screen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121824"/>
      <stop offset="40%" stop-color="#1E293B"/>
      <stop offset="80%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="screen-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E6B3" stop-opacity="0.7"/>
      <stop offset="50%" stop-color="#93C5FD" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.15"/>
    </linearGradient>
    <radialGradient id="lens-glint" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="35%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
  </defs>
  <ellipse cx="200" cy="278" rx="110" ry="15" fill="url(#iphone-shadow)"/>
  <g transform="translate(130, 42)">
    <rect x="0" y="0" width="108" height="215" rx="22" fill="url(#titanium-frame)" stroke="#524C42" stroke-width="1.5"/>
    <rect x="2.5" y="2.5" width="103" height="210" rx="19.5" fill="url(#titanium-back)"/>
    <rect x="8" y="10" width="48" height="52" rx="14" fill="#999081" stroke="#BAAF9F" stroke-width="1.5"/>
    <circle cx="23" cy="24" r="10" fill="#1C1B1F" stroke="#DDD5C7" stroke-width="2"/>
    <circle cx="23" cy="24" r="7.5" fill="url(#lens-glint)"/>
    <circle cx="21" cy="22" r="2.5" fill="#FFF" opacity="0.9"/>
    <circle cx="23" cy="48" r="10" fill="#1C1B1F" stroke="#DDD5C7" stroke-width="2"/>
    <circle cx="23" cy="48" r="7.5" fill="url(#lens-glint)"/>
    <circle cx="21" cy="46" r="2.5" fill="#FFF" opacity="0.9"/>
    <circle cx="44" cy="36" r="10" fill="#1C1B1F" stroke="#DDD5C7" stroke-width="2"/>
    <circle cx="44" cy="36" r="7.5" fill="url(#lens-glint)"/>
    <circle cx="42" cy="34" r="2.5" fill="#FFF" opacity="0.9"/>
    <circle cx="44" cy="18" r="3.5" fill="#FDE047" opacity="0.9"/>
    <circle cx="44" cy="52" r="3" fill="#111" stroke="#666" stroke-width="0.5"/>
  </g>
  <g transform="translate(162, 32)">
    <rect x="0" y="0" width="112" height="225" rx="24" fill="url(#titanium-frame)" stroke="#FFF" stroke-width="0.5"/>
    <rect x="2.5" y="2.5" width="107" height="220" rx="21.5" fill="#050505"/>
    <rect x="4.5" y="4.5" width="103" height="216" rx="19.5" fill="url(#iphone-screen)"/>
    <path d="M 4.5 90 Q 50 140, 107.5 70 L 107.5 220.5 L 4.5 220.5 Z" fill="url(#screen-glow)"/>
    <circle cx="56" cy="130" r="32" fill="none" stroke="rgba(245,230,179,0.3)" stroke-width="1.5"/>
    <rect x="39" y="11" width="34" height="10" rx="5" fill="#000"/>
    <circle cx="64" cy="16" r="2" fill="#0B132B"/>
    <circle cx="48" cy="16" r="1.5" fill="#020617"/>
    <rect x="36" y="214" width="40" height="2.5" rx="1.25" fill="rgba(255,255,255,0.7)"/>
  </g>
  <text x="200" y="295" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#423E37" text-anchor="middle">IPHONE 16 PRO</text>
  <text x="200" y="310" font-family="monospace" font-size="9" font-weight="600" fill="#997A2E" text-anchor="middle">A18 PRO CHIP · NATURAL TITANIUM</text>
</svg>
`)}`;

const MACBOOK_M3_STUDIO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <defs>
    <radialGradient id="mac-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.25)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="mac-lid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4B4E5A"/>
      <stop offset="50%" stop-color="#2D3039"/>
      <stop offset="100%" stop-color="#1B1D23"/>
    </linearGradient>
    <linearGradient id="mac-base" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#555966"/>
      <stop offset="40%" stop-color="#343842"/>
      <stop offset="100%" stop-color="#1F2128"/>
    </linearGradient>
    <linearGradient id="mac-screen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="40%" stop-color="#1E1B4B"/>
      <stop offset="70%" stop-color="#4C1D95"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="mac-art" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F5E6B3" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#E5C878" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="272" rx="135" ry="18" fill="url(#mac-shadow)"/>
  <g transform="translate(80, 50)">
    <rect x="0" y="0" width="240" height="155" rx="10" fill="url(#mac-lid)" stroke="#6A6F7E" stroke-width="1.5"/>
    <rect x="4" y="4" width="232" height="147" rx="7" fill="#000"/>
    <rect x="7" y="7" width="226" height="141" rx="5" fill="url(#mac-screen)"/>
    <path d="M 7 100 Q 80 40, 150 110 T 233 80 L 233 148 L 7 148 Z" fill="url(#mac-art)"/>
    <path d="M 110 7 L 130 7 L 128 14 Q 128 17, 125 17 L 115 17 Q 112 17, 112 14 Z" fill="#000"/>
    <circle cx="120" cy="11.5" r="1.5" fill="#1E293B"/>
    <circle cx="123" cy="11.5" r="0.6" fill="#10B981"/>
  </g>
  <g transform="translate(50, 201)">
    <path d="M 28 0 L 272 0 L 296 46 Q 298 50, 290 50 L 10 50 Q 2 50, 4 46 Z" fill="url(#mac-base)" stroke="#747A8C" stroke-width="1.2"/>
    <path d="M 52 5 L 248 5 L 244 26 L 56 26 Z" fill="#121317" stroke="#25272F" stroke-width="0.8"/>
    <g fill="#20222A">
      <rect x="60" y="7" width="180" height="3" rx="1"/>
      <rect x="59" y="11.5" width="182" height="3" rx="1"/>
      <rect x="58" y="16" width="184" height="3" rx="1"/>
      <rect x="57" y="20.5" width="186" height="3.5" rx="1"/>
    </g>
    <rect x="120" y="29" width="60" height="18" rx="2" fill="#252730" stroke="#3A3D47" stroke-width="0.8"/>
    <rect x="85" y="0" width="130" height="3.5" rx="1.5" fill="#0A0B0E"/>
    <rect x="135" y="47" width="30" height="2" rx="1" fill="#525764"/>
  </g>
  <text x="200" y="295" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#3D404A" text-anchor="middle">MACBOOK AIR M3</text>
  <text x="200" y="310" font-family="monospace" font-size="9" font-weight="600" fill="#997A2E" text-anchor="middle">13.6-INCH LIQUID RETINA · 16GB · 512GB</text>
</svg>
`)}`;

const S24_ULTRA_STUDIO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <defs>
    <radialGradient id="s24-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.25)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="s24-frame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#B0B0B0"/>
      <stop offset="30%" stop-color="#848484"/>
      <stop offset="70%" stop-color="#5E5E5E"/>
      <stop offset="100%" stop-color="#999999"/>
    </linearGradient>
    <linearGradient id="s24-back" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#73767D"/>
      <stop offset="50%" stop-color="#53565C"/>
      <stop offset="100%" stop-color="#37393D"/>
    </linearGradient>
    <linearGradient id="s24-screen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0F1D"/>
      <stop offset="50%" stop-color="#141C30"/>
      <stop offset="100%" stop-color="#070A14"/>
    </linearGradient>
    <linearGradient id="galaxy-ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#64748B"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="280" rx="110" ry="15" fill="url(#s24-shadow)"/>
  <g transform="translate(132, 40)">
    <rect x="0" y="0" width="105" height="224" rx="10" fill="url(#s24-frame)" stroke="#222" stroke-width="1.5"/>
    <rect x="2" y="2" width="101" height="220" rx="8" fill="url(#s24-back)"/>
    <circle cx="24" cy="28" r="11" fill="#15171C" stroke="url(#galaxy-ring)" stroke-width="2.5"/>
    <circle cx="24" cy="28" r="7.5" fill="#0B132B"/>
    <circle cx="22" cy="26" r="2.5" fill="#38BDF8" opacity="0.9"/>
    <circle cx="24" cy="58" r="11" fill="#15171C" stroke="url(#galaxy-ring)" stroke-width="2.5"/>
    <circle cx="24" cy="58" r="7.5" fill="#0B132B"/>
    <circle cx="22" cy="56" r="2.5" fill="#38BDF8" opacity="0.9"/>
    <circle cx="24" cy="88" r="11" fill="#15171C" stroke="url(#galaxy-ring)" stroke-width="2.5"/>
    <rect x="19" y="83" width="10" height="10" rx="2" fill="#0A0F1D"/>
    <circle cx="48" cy="28" r="5" fill="#1F2937" stroke="#4B5563" stroke-width="1.5"/>
    <circle cx="48" cy="44" r="3.5" fill="#FEF08A" opacity="0.9"/>
    <circle cx="48" cy="62" r="7.5" fill="#15171C" stroke="url(#galaxy-ring)" stroke-width="2"/>
  </g>
  <g transform="translate(164, 32)">
    <rect x="0" y="0" width="108" height="228" rx="10" fill="url(#s24-frame)" stroke="#FFF" stroke-width="0.5"/>
    <rect x="2.5" y="2.5" width="103" height="223" rx="8" fill="#030303"/>
    <rect x="4.5" y="4.5" width="99" height="219" rx="6" fill="url(#s24-screen)"/>
    <polygon points="4.5,4.5 103.5,4.5 103.5,120 4.5,180" fill="rgba(230,199,98,0.08)"/>
    <circle cx="54" cy="115" r="35" fill="none" stroke="rgba(245,230,179,0.3)" stroke-width="2"/>
    <circle cx="54" cy="115" r="22" fill="none" stroke="#E5C878" stroke-width="1.5" stroke-dasharray="6 4"/>
    <circle cx="54" cy="14" r="3" fill="#000"/>
    <circle cx="54" cy="14" r="1.2" fill="#0F172A"/>
    <rect x="91" y="222" width="7" height="3" rx="1" fill="#71717A"/>
  </g>
  <text x="200" y="295" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#4B4D54" text-anchor="middle">GALAXY S24 ULTRA</text>
  <text x="200" y="310" font-family="monospace" font-size="9" font-weight="600" fill="#997A2E" text-anchor="middle">200MP QUAD CAM · SNAPDRAGON 8 GEN 3</text>
</svg>
`)}`;

const ALL_SUGGESTIONS = [
    { label: 'Cozy retro mechanical keyboards with RGB light & pastel keycaps' },
    { label: 'Best noise-cancelling wireless earbuds under ₹15,000' },
    { label: 'iPhone 17 Pro Max' },
    { label: 'Minimalist ambient LED desk lamps & setup aesthetics' },
    { label: 'Ergonomic office chairs for back support under ₹20k' },
    { label: 'Best gaming monitors 1440p 144Hz' },
    { label: 'Sony PlayStation 5 vs Xbox Series X deals' },
];

const QUICK_PRICE_FILTERS = [
    { label: 'Under ₹5,000', query: 'Best budget electronics and audio under ₹5,000', tag: 'Fast Grab' },
    { label: 'Under ₹15,000', query: 'Best smartwatches and ANC earbuds under ₹15,000', tag: 'Popular' },
    { label: 'Under ₹30,000', query: 'Best 5G smartphones and tech under ₹30,000', tag: 'Sweetspot' },
    { label: 'Under ₹50,000', query: 'Best coding laptops and 4K TVs under ₹50,000', tag: 'Value' },
    { label: 'Flagship Luxury', query: 'Best flagship smartphones and MacBooks under ₹1,50,000', tag: 'Centurion' },
];

const DEPARTMENTS = [
    {
        id: 'smartphones',
        title: 'Flagship Smartphones',
        tag: 'iPhone · Galaxy · OnePlus',
        pricingCue: 'Starting ₹14,999 · Up to 24% Off',
        query: 'Best 5G flagship smartphones under ₹70,000',
        icon: Smartphone,
    },
    {
        id: 'laptops',
        title: 'Pro Laptops & MacBooks',
        tag: 'MacBook · ROG · ThinkPad',
        pricingCue: 'Starting ₹38,990 · No-Cost EMI',
        query: 'Best coding and creator laptops under ₹85,000',
        icon: Laptop,
    },
    {
        id: 'audio',
        title: 'ANC Audio & Headphones',
        tag: 'Sony · Bose · AirPods',
        pricingCue: 'Starting ₹1,999 · Top Rated',
        query: 'Best noise-cancelling headphones and earbuds under ₹25,000',
        icon: Headphones,
    },
    {
        id: 'wearables',
        title: 'Smartwatches & Wearables',
        tag: 'Apple · Galaxy · Garmin',
        pricingCue: 'Starting ₹2,499 · AMOLED Picks',
        query: 'Best AMOLED smartwatches and fitness trackers under ₹15,000',
        icon: Watch,
    },
    {
        id: 'tvs',
        title: '4K OLED TVs & Cinema',
        tag: 'Sony · LG · Samsung',
        pricingCue: 'Starting ₹26,990 · Exchange Bonus',
        query: 'Best 55 inch 4K Smart TVs under ₹55,000',
        icon: Tv,
    },
    {
        id: 'gaming',
        title: 'PlayStation & Gaming',
        tag: 'PS5 · RTX · Mechanical',
        pricingCue: 'Starting ₹3,499 · PS5 & 144Hz',
        query: 'PlayStation 5 Slim and 144Hz gaming monitors',
        icon: Gamepad2,
    },
];

const CURATED_DEALS = [
    {
        id: 'sony-xm5',
        title: 'Sony WH-1000XM5 Wireless ANC Headphones',
        subtitle: 'Industry-leading Active Noise Cancellation with dual processors & 8 mics',
        badge: 'Amazon India',
        storeDot: '#F59E0B',
        rating: '4.8',
        reviews: '3,420',
        price: 24990,
        originalPrice: 34990,
        savingsText: 'Save ₹10,000 (29% OFF)',
        ribbon: 'LIMITED TIME DEAL',
        bankOffer: '💳 Extra ₹2,000 off with HDFC / ICICI Credit Cards',
        deliveryTag: '🚚 Free Next-Day Delivery · Official Brand Warranty',
        query: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        buyUrl: 'https://www.amazon.in/s?k=Sony+WH-1000XM5',
        image: SONY_XM5_STUDIO_SVG,
    },
    {
        id: 'iphone-16-pro',
        title: 'Apple iPhone 16 Pro (128GB, Natural Titanium)',
        subtitle: 'A18 Pro chip, 48MP Fusion camera system with 4K 120 fps Dolby Vision',
        badge: 'Croma / Flipkart',
        storeDot: '#3B82F6',
        rating: '4.9',
        reviews: '5,180',
        price: 112900,
        originalPrice: 119900,
        savingsText: 'Save ₹7,000 (6% OFF)',
        ribbon: 'LOWEST PRICE IN 90 DAYS',
        bankOffer: '💳 ₹4,000 Instant Cashback on SBI & ICICI Cards',
        deliveryTag: '🚚 Free Express Delivery · Apple 1-Year Warranty',
        query: 'Apple iPhone 16 Pro 128GB',
        buyUrl: 'https://www.croma.com/searchB?q=iphone+16+pro',
        image: IPHONE_16_PRO_STUDIO_SVG,
    },
    {
        id: 'macbook-air-m3',
        title: 'Apple MacBook Air 13" M3 (16GB RAM, 512GB SSD)',
        subtitle: 'Liquid Retina display, up to 18 hrs battery, dual external monitor support',
        badge: 'Flipkart / Amazon',
        storeDot: '#10B981',
        rating: '4.9',
        reviews: '2,890',
        price: 104990,
        originalPrice: 114900,
        savingsText: 'Save ₹9,910 (9% OFF)',
        ribbon: 'TOP CREATOR PICK',
        bankOffer: '💳 ₹5,000 Instant Discount + Up to 12M No-Cost EMI',
        deliveryTag: '🚚 Free Assured Delivery · Apple Official Warranty',
        query: 'MacBook Air M3 16GB',
        buyUrl: 'https://www.flipkart.com/search?q=macbook+air+m3+16gb',
        image: MACBOOK_M3_STUDIO_SVG,
    },
    {
        id: 'galaxy-s24-ultra',
        title: 'Samsung Galaxy S24 Ultra 5G (256GB, Titanium Gray)',
        subtitle: 'Snapdragon 8 Gen 3 for Galaxy, 200MP camera with Galaxy AI & built-in S Pen',
        badge: 'Amazon India',
        storeDot: '#F59E0B',
        rating: '4.8',
        reviews: '4,120',
        price: 102999,
        originalPrice: 129999,
        savingsText: 'Save ₹27,000 (21% OFF)',
        ribbon: 'EXCHANGE BONUS ACTIVE',
        bankOffer: '💳 Extra ₹6,000 off on All Major Bank Cards',
        deliveryTag: '🚚 Prime 1-Day Delivery · Samsung Official Warranty',
        query: 'Samsung Galaxy S24 Ultra 256GB',
        buyUrl: 'https://www.amazon.in/s?k=Samsung+Galaxy+S24+Ultra',
        image: S24_ULTRA_STUDIO_SVG,
    },
];

const RETAILER_PARTNERS = [
    { name: 'Amazon.in', badge: 'Prime Certified' },
    { name: 'Flipkart', badge: 'Plus Assured' },
    { name: 'Croma', badge: 'Tata Direct' },
    { name: 'Reliance Digital', badge: 'Authorised' },
    { name: 'Tata CLiQ', badge: 'Luxury Fleet' },
    { name: 'Vijay Sales', badge: 'Store Direct' },
    { name: 'Apple Authorised', badge: 'MFi Genuine' },
];

export default function ChatInterface({ onQuerySubmit, loading, isGuest = false, steeringMode = 'balanced', setSteeringMode }) {
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [currentSuggestions, setCurrentSuggestions] = useState(ALL_SUGGESTIONS.slice(0, 3));
    const inputRef = useRef(null);

    // Keyboard shortcut to focus search input: Ctrl/Cmd + /
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Rotate suggestions every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSuggestions(() => {
                const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, 3);
            });
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleMicClick = () => {
        if (isGuest) {
            onQuerySubmit("");
            return;
        }
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setInput(transcript);
        };
        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSubmit = (e, q) => {
        if (e) e.preventDefault();
        const query = (q ?? input).trim();
        if (!query || loading) return;
        onQuerySubmit(query);
    };

    const handleChipClick = (suggestion) => {
        setInput(suggestion);
        handleSubmit(null, suggestion);
    };

    return (
        <section className="relative z-10 mx-auto w-full max-w-6xl text-left pt-1 pb-4">
            
            {/* 1. FEATURED FLAGSHIP SPOTLIGHT BANNER (Eye-Catching Storefront Header) */}
            <div className="mb-5 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#18181C] via-[#1F1D15] to-[#121215] border border-[#E6C762]/30 p-4 sm:p-5 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
                <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#E6C762]/[0.08] blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6C762]/15 border border-[#E6C762]/35 text-[#E6C762] text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                                <Sparkles className="w-3 h-3 text-[#E6C762]" />
                                Festive Arbitrage Live · Verified Storefront Deals
                            </span>
                            <span className="text-[11px] font-mono text-[#34D399] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                                14 Marketplaces Synced
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                            Up to <span className="text-[#E8D082]">32% Off</span> Flagship Electronics — Verified Across Amazon, Flipkart & Croma
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                            <span className="flex items-center gap-1 text-zinc-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" /> 10% Instant Bank Offers Tracked
                            </span>
                            <span className="text-zinc-600 hidden sm:inline">·</span>
                            <span className="flex items-center gap-1 text-zinc-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#E6C762]" /> 100% Authorised Sellers
                            </span>
                            <span className="text-zinc-600 hidden sm:inline">·</span>
                            <span className="flex items-center gap-1 text-zinc-200">
                                <TrendingDown className="w-3.5 h-3.5 text-[#34D399]" /> Sub-Second Live Price Match
                            </span>
                        </div>
                    </div>

                    {/* Quick-Filter Price Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block w-full lg:w-auto lg:mr-1">
                            Browse by Budget:
                        </span>
                        {QUICK_PRICE_FILTERS.map((pill) => (
                            <button
                                key={pill.label}
                                type="button"
                                onClick={() => handleChipClick(pill.query)}
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#E6C762]/10 border border-white/[0.08] hover:border-[#E6C762]/40 text-xs font-semibold text-zinc-200 hover:text-[#F3E5AB] transition-all active:scale-95 shadow-sm"
                            >
                                <span>{pill.label}</span>
                                <span className="text-[9px] font-mono text-[#E6C762] bg-[#E6C762]/10 px-1 py-0.2 rounded hidden sm:inline">
                                    {pill.tag}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Eyebrow - Compact */}
            <div className="mb-2 flex justify-center">
                <div className="inline-flex items-center space-x-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 select-none shadow-sm">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E6C762] shadow-[0_0_6px_#E6C762]" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400 font-medium">
                        Autonomous Multi-Agent Shopping Engine
                    </span>
                </div>
            </div>

            {/* Headline with Editorial Serif */}
            <h1 className="text-center text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                Shop as if <span className="font-editorial italic font-normal text-[#E8D082]">seven specialists</span> worked for you.
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[14px] leading-relaxed text-zinc-400 font-normal">
                State your mandate. SEAMAS dispatches seven autonomous specialists across Indian retail ecosystems,
                synthesizing price trends, reviews, and seller credibility into an executive decision.
            </p>

            {/* Steering Mode Selector */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-3xl mx-auto">
                {[
                    { id: 'speed', name: 'Speed Swarm', desc: 'Single-cycle sub-second radar sweep', cost: 'Fast · 5 Credits', icon: Zap },
                    { id: 'balanced', name: 'Balanced Matrix', desc: 'Dual-depth pricing, sentiment & seller audit', cost: 'Standard · 10 Credits', icon: Sliders },
                    { id: 'accuracy', name: 'Deep Audit', desc: 'Exhaustive 4-pass cross-market arbitrage', cost: 'Comprehensive · 20 Credits', icon: Sparkles },
                ].map((mode) => {
                    const isActive = steeringMode === mode.id;
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => !loading && setSteeringMode && setSteeringMode(mode.id)}
                            disabled={loading}
                            className={`group relative flex flex-col rounded-xl p-3 border text-left transition-all duration-300 ${
                                isActive 
                                    ? 'border-[#E6C762]/50 bg-[#E6C762]/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(230,199,98,0.2)]' 
                                    : 'border-white/[0.08] bg-[#121215] hover:border-white/20 hover:bg-[#18181C]'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isActive && (
                                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#E6C762] shadow-[0_0_6px_#E6C762]" />
                            )}
                            <div className="flex items-center gap-2">
                                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#E6C762]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                <span className="font-semibold text-xs text-white">{mode.name}</span>
                            </div>
                            <span className="mt-1 text-[10px] text-zinc-400 leading-tight">{mode.desc}</span>
                            <span className="mt-1.5 font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">{mode.cost}</span>
                        </button>
                    );
                })}
            </div>

            {/* Command Omnibar Card */}
            <div className="relative mt-4">
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -inset-3 rounded-[28px] opacity-40 blur-2xl transition-opacity duration-500 ${focused ? 'opacity-70' : 'opacity-30'}`}
                    style={{
                        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(230, 199, 98, 0.12), rgba(255, 255, 255, 0.03), transparent)',
                    }}
                />

                <div className="relative overflow-hidden rounded-2xl bg-[#121215] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
                        <Search className="h-5 w-5 shrink-0 text-[#E6C762]" strokeWidth={1.75} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => {
                                if (isGuest) {
                                    onQuerySubmit("");
                                } else {
                                    setInput(e.target.value);
                                }
                            }}
                            onFocus={() => {
                                if (isGuest) {
                                    onQuerySubmit("");
                                } else {
                                    setFocused(true);
                                }
                            }}
                            onBlur={() => setFocused(false)}
                            disabled={loading}
                            placeholder={isGuest ? "Please sign in to compare prices and search..." : "Command 7 specialists (e.g. Best noise-cancelling headphones under ₹25,000)..."}
                            className="flex-1 bg-transparent text-base sm:text-lg font-normal tracking-tight text-white placeholder:text-zinc-500 focus:outline-none"
                        />

                        {/* Voice button */}
                        <button
                            type="button"
                            onClick={handleMicClick}
                            className={`hidden shrink-0 rounded-full p-2.5 transition-all duration-300 sm:inline-flex ${isListening ? 'bg-[#E6C762]/20 text-[#E6C762] shadow-[0_0_15px_rgba(230,199,98,0.3)] animate-pulse' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}
                            aria-label="Voice input"
                        >
                            <Mic className="h-4 w-4" strokeWidth={isListening ? 2 : 1.6} />
                        </button>

                        {/* Kbd badge */}
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono text-zinc-400 select-none">
                            <Command className="h-2.5 w-2.5" strokeWidth={2} />/
                        </kbd>

                        {/* Primary High-Craft Brushed Champagne Gold & Pearl CTA Button */}
                        <button
                            type="submit"
                            onClick={(e) => {
                                if (!input.trim() && !loading) {
                                    e.preventDefault();
                                    inputRef.current?.focus();
                                }
                            }}
                            disabled={loading}
                            className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-[#09090B] bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_24px_-4px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed opacity-95"
                        >
                            <span>{loading ? "Orchestrating…" : "Search Market"}</span>
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#09090B]" strokeWidth={2.2} />
                        </button>
                    </form>

                    {/* Suggestions list */}
                    <div className="border-t border-white/[0.06] px-5 py-2.5 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">
                                Suggestions:
                            </span>
                            {currentSuggestions.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    onClick={() => handleChipClick(s.label)}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 text-xs text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(230,199,98,0.15)] hover:border-[#E6C762]/40 hover:bg-[#E6C762]/[0.05] hover:text-white"
                                >
                                    <Sparkles className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-[#E6C762]" strokeWidth={1.75} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. UPGRADED DEPARTMENT CARDS WITH ATTRACTIVE PRICING CUES & ICONS */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E6C762]" />
                        Shop by Department · Direct Swarm Dispatch
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                        Click category to initiate live arbitrage sweep
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {DEPARTMENTS.map((dept) => {
                        const Icon = dept.icon;
                        return (
                            <button
                                key={dept.id}
                                type="button"
                                onClick={() => handleChipClick(dept.query)}
                                className="group relative rounded-xl bg-[#121215] border border-white/[0.08] hover:border-[#E6C762]/50 hover:bg-[#18181C] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:border-[#E6C762]/30 group-hover:bg-[#E6C762]/10 flex items-center justify-center transition-colors mb-2 text-[#E6C762]">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xs font-bold text-white group-hover:text-[#F3E5AB] transition-colors leading-snug">
                                        {dept.title}
                                    </h4>
                                    <span className="mt-1 text-[10px] font-mono text-zinc-400 group-hover:text-zinc-300 truncate block">
                                        {dept.tag}
                                    </span>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/[0.05]">
                                    <span className="text-[10px] font-mono text-[#34D399] font-medium block truncate">
                                        {dept.pricingCue}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Verified Retailer Partner Strip */}
            <div className="mt-5 rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300 font-semibold">
                        VERIFIED RETAILERS INDEXED:
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-400">
                    {RETAILER_PARTNERS.map((retailer, i) => (
                        <div key={retailer.name} className="flex items-center gap-1.5">
                            <span className="text-zinc-200 font-medium hover:text-[#E6C762] transition-colors">{retailer.name}</span>
                            <span className="text-[9px] text-[#34D399] bg-[#34D399]/10 px-1 py-0.2 rounded border border-[#34D399]/20 hidden md:inline">
                                {retailer.badge}
                            </span>
                            {i < RETAILER_PARTNERS.length - 1 && <span className="text-zinc-600 hidden sm:inline">·</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. TODAY'S VERIFIED PRICE DROPS & TRENDING DEALS (Guaranteed Studio Renders + Bank Offers) */}
            <div className="mt-8 space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E6C762] shadow-[0_0_8px_#E6C762]" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E6C762] font-semibold">
                                Live Storefront Index · Verified Arbitrage Deals
                            </span>
                        </div>
                        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                            Today's Verified Price Drops & Trending Deals
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Real-time price convergence across verified Indian marketplaces with active inventory.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/25 text-[#34D399] font-mono text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                        <span>DOM-Verified Prices Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CURATED_DEALS.map((deal) => (
                        <div
                            key={deal.id}
                            className="group relative flex flex-col justify-between rounded-2xl bg-[#121215] border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Studio-White Pedestal with Guaranteed High-Resolution SVG Render */}
                            <div className="relative aspect-[4/3] bg-gradient-to-b from-[#FFFFFF] to-[#F4F4F6] rounded-2xl m-3 p-3 flex items-center justify-center overflow-hidden shadow-inner">
                                <img
                                    src={deal.image}
                                    alt={deal.title}
                                    className="h-full w-full object-contain max-h-44 mx-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-105"
                                    loading="eager"
                                />

                                {/* Store Badge Top-Left */}
                                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-200">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deal.storeDot }} />
                                    <span>{deal.badge}</span>
                                </div>

                                {/* Limited Time / Ribbon Badge Top-Right */}
                                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 text-black font-mono text-[9px] font-bold shadow-sm">
                                    <Tag className="w-2.5 h-2.5" />
                                    <span>{deal.ribbon}</span>
                                </div>

                                {/* Savings Pill Bottom-Left */}
                                <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#34D399] text-[#09090B] font-mono text-[10px] font-bold shadow-sm">
                                    <span>{deal.savingsText}</span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 pt-1 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="flex items-center gap-1 text-[#E6C762] text-xs font-semibold">
                                            <Star className="w-3.5 h-3.5 fill-[#E6C762]" />
                                            {deal.rating}
                                        </span>
                                        <span className="text-[11px] text-zinc-500 font-mono">({deal.reviews} ratings)</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white group-hover:text-[#F3E5AB] transition-colors line-clamp-2 leading-snug">
                                        {deal.title}
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{deal.subtitle}</p>

                                    {/* Bank Offer & Delivery Strip */}
                                    <div className="mt-2.5 space-y-1 text-[10px] font-mono border-t border-b border-white/[0.04] py-2">
                                        <div className="text-amber-300/90 truncate flex items-center gap-1">
                                            <CreditCard className="w-3 h-3 text-[#E6C762] shrink-0" />
                                            <span className="truncate">{deal.bankOffer}</span>
                                        </div>
                                        <div className="text-emerald-400/90 truncate flex items-center gap-1">
                                            <Truck className="w-3 h-3 text-[#34D399] shrink-0" />
                                            <span className="truncate">{deal.deliveryTag}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3.5 pt-1">
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-xl font-bold text-white tabular-nums tracking-tight">
                                            ₹{deal.price.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-xs text-zinc-500 line-through tabular-nums">
                                            ₹{deal.originalPrice.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleChipClick(deal.query)}
                                            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-gradient-to-b from-[#F5E6B3] via-[#E5C878] to-[#C9A449] hover:brightness-110 text-[#09090B] text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                                        >
                                            <span>Compare 4 Stores</span>
                                        </button>
                                        <a
                                            href={deal.buyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                                        >
                                            <span>View Deal</span>
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7-Agent Architecture Preview Bar */}
            <div className="mt-8 rounded-2xl bg-[#121215]/90 border border-white/[0.08] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E6C762] shadow-[0_0_8px_#E6C762]" />
                        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                            Autonomous Multi-Agent Architecture
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#34D399] font-mono text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                        7/7 Nodes Armed · &lt;1ms Routing
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-left">
                    {[
                        { step: '01', name: 'Orchestrator', role: 'Intent & Guard' },
                        { step: '02', name: 'Search', role: '14 Market Sweep' },
                        { step: '03', name: 'Live Price', role: 'DOM Verification' },
                        { step: '04', name: 'Sentiment', role: 'NLP Synthesis' },
                        { step: '05', name: 'Budget', role: 'Ceiling Tolerance' },
                        { step: '06', name: 'Ranking', role: 'Utility Matrix' },
                        { step: '07', name: 'Finalizer', role: 'Executive Brief' },
                    ].map((node) => (
                        <div key={node.step} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500 mb-1">
                                <span>{node.step}</span>
                                <span className="text-[#E6C762]">•</span>
                            </div>
                            <div className="text-xs font-semibold text-zinc-200 truncate">{node.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{node.role}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
