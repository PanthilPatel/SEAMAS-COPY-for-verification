import asyncio
import os
import re
from typing import List, Dict, Any, Set
from urllib.parse import urlparse
from tools.search_tools import web_search_tool, NON_SHOPPING_DOMAINS

MAX_SEARCH_PAGES = int(os.getenv("MAX_SEARCH_PAGES", "2"))


def normalize_url(raw_url: str) -> str:
    """
    Normalizes a URL string for consistent deduplication.
    Strips whitespace, lowercases scheme & host, removes 'www.', trailing slashes,
    and strips common tracking query parameters (utm_*, ref, tag, etc.).
    """
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url.strip())
        scheme = parsed.scheme.lower() or "https"
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/")
        # Keep clean query without tracking clutter
        q_params = []
        if parsed.query:
            for pair in parsed.query.split("&"):
                k = pair.split("=")[0].lower()
                if not any(k.startswith(t) for t in ["utm_", "ref", "tag", "fbclid", "gclid"]):
                    q_params.append(pair)
        query_str = f"?{'&'.join(q_params)}" if q_params else ""
        return f"{scheme}://{netloc}{path}{query_str}"
    except Exception:
        return raw_url.strip().lower().rstrip("/")


def compute_relevance_score(title: str, snippet: str, query_tokens: Set[str], category: str) -> float:
    """
    Computes a deterministic keyword-overlap relevance score between 0.0 and 1.0.
    Enforces strict guards against:
    - Counterfeit / clone / replica listings (unless specifically requested in query)
    - Accessory / case / part mismatches when hardware device is searched
    - Cross-category collisions (e.g., scooters/vehicles appearing for electronics/wearables searches)
    """
    text = (title + " " + snippet).lower()

    # 1. Strict Counterfeit / Clone / Fake rejection
    clone_keywords = {"clone", "cloned", "replica", "first copy", "1st copy", "mastercopy", "fake", "dupe", "knockoff"}
    if any(re.search(rf"\b{re.escape(ck)}\b", text) for ck in clone_keywords):
        if not any(ck in query_tokens for ck in ["clone", "replica", "copy", "fake"]):
            return 0.0

    # 2. Strict Accessory rejection when main device/gadget is requested
    device_indicators = {"airpods", "earbuds", "earphone", "headphones", "phone", "iphone", "smartphone", "laptop", "smartwatch", "watch"}
    query_is_device = any(di in query_tokens for di in device_indicators)
    query_is_accessory = any(acc in query_tokens for acc in ["case", "cover", "skin", "strap", "cushion", "cables", "cable", "protector"])

    if query_is_device and not query_is_accessory:
        accessory_terms = [
            "case for", "cover for", "skin for", "strap for", "pouch for",
            "ear pads for", "ear cushion for", "replacement for", "earbuds case",
            "protective case", "silicone case", "hard case", "leather case",
            "press stud", "tws skin", "ear hooks", "replacement cable", "charging case only",
            "protective cover", "anti-lost strap"
        ]
        title_lower = title.lower()
        if any(acc in title_lower for acc in accessory_terms):
            return 0.0

    # 3. Guard: Reject automotive / vehicle records for electronics/wearables/smartphones/laptops/audio
    if category in ("wearables", "smartphones", "laptops", "audio", "televisions"):
        auto_words = {"scooter", "scooters", "bike", "bikes", "motorcycle", "motorcycles", "car", "vehicle"}
        if any(re.search(rf"\b{w}\b", text) for w in auto_words) and not any(w in query_tokens for w in auto_words):
            return 0.0

    if not query_tokens:
        return 0.5

    matched = 0
    for token in query_tokens:
        tok_clean = token.lower()
        if tok_clean in text or (len(tok_clean) > 3 and tok_clean.rstrip("s") in text):
            matched += 1

    denom = min(len(query_tokens), 4)
    score = (matched / denom) if denom > 0 else 0.5

    # Category bonus if category matches
    if category and category != "general" and category.lower() in text:
        score = min(1.0, score + 0.15)

    return round(min(1.0, score), 3)


async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Search Agent (Research Normalization Layer):
    1. Executes multi-page search (targeting pages 1-4) across primary shopping portals.
    2. Normalizes URLs and metadata.
    3. Validates that records are bona-fide product/marketplace entries.
    4. Deduplicates records by normalized URL and title.
    5. Applies deterministic relevance filtering against query, category, and clone/accessory guards.
    6. Produces structured, normalized search_results for downstream agents.
    """
    query = state.get("query", "")
    category = state.get("category", "general")
    steering_mode = state.get("steering_mode", "balanced")

    # Determine search depth based on steering mode (supporting pages 1-4)
    if steering_mode == "speed":
        max_search_pages = 2
    elif steering_mode == "balanced":
        max_search_pages = 4
    else:  # accuracy
        max_search_pages = 4

    print(f"\n--- RESEARCH NORMALIZATION LAYER (Search Agent): Query='{query}' (Category: {category}, Mode: {steering_mode}, Depth: {max_search_pages} pages) ---")

    # Primary commerce query searched across true pagination pages 1 to max_search_pages
    # With targeted commerce channel qualifiers for verified shopping platforms
    if category in ("electronics", "smartphones", "laptops"):
        store_coverage_qualifiers = [
            "price buy online amazon flipkart",  # Page 1: Core ecommerce portals
            "croma reliance digital",  # Page 2: Top consumer electronics chains
            "tatacliq vijaysales",  # Page 3: Official storefronts
            "buy online india"  # Page 4: Broad commerce coverage fallback
        ]
    else:
        store_coverage_qualifiers = [
            "price buy online amazon flipkart",  # Page 1: Core ecommerce portals
            "buy online shopping india",  # Page 2: National retail coverage
            "best price buy online store",  # Page 3: General retail portals
            "online store buy india"  # Page 4: Broad commerce coverage fallback
        ]

    sentiment_queries = [
        f"{query} review rating user feedback india",
        f"{query} performance pros cons buyer opinions"
    ]

    raw_shopping_results: List[Dict[str, Any]] = []
    raw_sentiment_results: List[Dict[str, Any]] = []
    page_logs: List[str] = []
    page_raw_counts: Dict[int, int] = {}

    clean_q_words = [w for w in re.findall(r"\b\w+\b", query) if w.lower() not in {"under", "best", "for", "with", "and", "the", "in", "a", "of", "to", "price", "buy", "online"}]
    core_terms = " ".join(clean_q_words[:4]) if len(clean_q_words) > 4 else query

    # Prepare concurrent fetch tasks across pages 1 to max_search_pages
    shopping_tasks = []
    for current_page in range(1, max_search_pages + 1):
        qualifier = store_coverage_qualifiers[(current_page - 1) % len(store_coverage_qualifiers)]
        q_to_use = core_terms if current_page >= 3 and core_terms != query else query
        q_lower = q_to_use.lower()
        if any(cw in q_lower for cw in ["buy", "price", "flipkart", "amazon"]):
            shop_q = q_to_use
        else:
            shop_q = f"{q_to_use} {qualifier}".strip() if qualifier else q_to_use
        shopping_tasks.append(
            web_search_tool(shop_q, max_results=25, augment_query=False, page=current_page)
        )

    # Sentiment tasks (fetch 2 diverse sentiment pages)
    sentiment_tasks = [
        web_search_tool(sentiment_queries[0], max_results=12, augment_query=False, page=1),
        web_search_tool(sentiment_queries[1], max_results=12, augment_query=False, page=2)
    ]

    try:
        shop_results = await asyncio.gather(*shopping_tasks, return_exceptions=True)
        for p_idx, res in enumerate(shop_results, start=1):
            if isinstance(res, Exception):
                page_logs.append(f"Search page {p_idx} query warning: {res}")
                page_raw_counts[p_idx] = 0
            elif isinstance(res, list):
                raw_shopping_results.extend(res)
                page_raw_counts[p_idx] = len(res)
                page_logs.append(f"Search page {p_idx}: {len(res)} raw results retrieved.")
    except Exception as e:
        page_logs.append(f"Multi-page shopping search exception: {e}")

    try:
        sent_results = await asyncio.gather(*sentiment_tasks, return_exceptions=True)
        for s_idx, res in enumerate(sent_results, start=1):
            if isinstance(res, Exception):
                page_logs.append(f"Sentiment query {s_idx} warning: {res}")
            elif isinstance(res, list):
                raw_sentiment_results.extend(res)
    except Exception as e:
        page_logs.append(f"Sentiment search exception: {e}")

    # Normalization, Validation, Deduplication & Relevance Filtering
    query_tokens = set(re.findall(r"\b\w{3,}\b", query.lower()))
    query_tokens -= {"best", "under", "below", "with", "around", "price", "india", "online", "buy"}

    seen_urls: Set[str] = set()
    seen_titles: Set[str] = set()
    normalized_results: List[Dict[str, Any]] = []

    excluded_domains = set(NON_SHOPPING_DOMAINS) | {
        "youtube.com", "youtu.be", "twitter.com", "x.com",
        "instagram.com", "facebook.com", "tiktok.com", "pinterest.com"
    }

    # Cross-category guard: If electronics/wearables, drop automotive collisions
    is_electronics = category in ("wearables", "smartphones", "laptops", "audio", "televisions") or any(
        w in query.lower() for w in ["watch", "smartwatch", "phone", "mobile", "laptop", "earbud", "headphone"]
    )
    auto_words = {"scooter", "scooters", "bike", "bikes", "motorcycle", "car", "vehicle"}

    # Diagnostic counters
    count_non_product = 0
    count_counterfeit = 0
    count_accessory = 0
    count_duplicates = 0

    clone_keywords = {"clone", "cloned", "replica", "first copy", "1st copy", "mastercopy", "fake", "dupe", "knockoff"}
    accessory_terms = [
        "case for", "cover for", "skin for", "strap for", "pouch for",
        "ear pads for", "ear cushion for", "replacement for", "earbuds case",
        "protective case", "silicone case", "hard case", "leather case",
        "press stud", "tws skin", "ear hooks", "replacement cable", "charging case only",
        "protective cover", "anti-lost strap"
    ]

    # 1. Normalize shopping results
    for record in raw_shopping_results:
        raw_url = record.get("url", "").strip()
        title = record.get("title", "").strip()
        content = record.get("content", "").strip()

        # Validation: Require non-empty URL and title
        if not raw_url or not title:
            count_non_product += 1
            continue

        norm_url = normalize_url(raw_url)

        # Validation: Exclude social media, news, blogs, and non-shopping domains from product catalog
        if any(dom in norm_url for dom in excluded_domains):
            count_non_product += 1
            continue

        # Validation: Cross-category automotive collision drop
        if is_electronics and any(re.search(rf"\b{aw}\b", (title + " " + norm_url).lower()) for aw in auto_words):
            count_non_product += 1
            continue

        # Deduplication: Exact URL or exact title duplicate
        norm_title = re.sub(r"\s+", " ", title.lower().strip())
        if norm_url in seen_urls or norm_title in seen_titles:
            count_duplicates += 1
            continue

        # Check counterfeit/clone rejection
        text_lower = (title + " " + content).lower()
        if any(re.search(rf"\b{re.escape(ck)}\b", text_lower) for ck in clone_keywords):
            if not any(ck in query_tokens for ck in ["clone", "replica", "copy", "fake"]):
                count_counterfeit += 1
                continue

        # Check accessory rejection
        if is_electronics and any(acc in title.lower() for acc in accessory_terms):
            if not any(acc in query_tokens for acc in ["case", "cover", "skin", "strap", "cushion", "cables", "cable", "protector"]):
                count_accessory += 1
                continue

        # Relevance scoring
        score = compute_relevance_score(title, content, query_tokens, category)
        if score == 0.0 and query_tokens:
            count_non_product += 1
            continue

        seen_urls.add(norm_url)
        seen_titles.add(norm_title)

        normalized_results.append({
            "title": title,
            "url": norm_url,
            "content": content,
            "engine": record.get("engine", "searxng"),
            "score": score,
            "thumbnail": record.get("thumbnail") or record.get("img_src") or record.get("image") or "",
            "images": record.get("images", []),
        })

    # Sort normalized product results by relevance score descending
    normalized_results.sort(key=lambda x: x.get("score", 0.0), reverse=True)

    # 2. Normalize sentiment/review snippets (strictly for Review Analyzer)
    normalized_review_snippets: List[Dict[str, Any]] = []
    seen_review_urls: Set[str] = set()

    social_media_noise = {
        "youtube.com", "youtu.be", "twitter.com", "x.com",
        "instagram.com", "facebook.com", "tiktok.com", "pinterest.com"
    }

    for record in raw_sentiment_results:
        raw_url = record.get("url", "").strip()
        title = record.get("title", "").strip()
        content = record.get("content", "").strip()

        if not raw_url or not (title or content):
            continue

        norm_url = normalize_url(raw_url)
        if any(smn in norm_url for smn in social_media_noise):
            continue

        if is_electronics and any(re.search(rf"\b{aw}\b", (title + " " + norm_url).lower()) for aw in auto_words):
            continue

        if norm_url in seen_review_urls:
            continue
        seen_review_urls.add(norm_url)

        normalized_review_snippets.append({
            "title": title,
            "url": norm_url,
            "content": content,
            "engine": record.get("engine", "searxng"),
        })

    # Diagnostic Breakdown Output
    print(f"\n[SearchAgent] === SEARCH PIPELINE DIAGNOSTIC COUNTS ===")
    for p in range(1, max_search_pages + 1):
        print(f"[SearchAgent] SearXNG page {p}: {page_raw_counts.get(p, 0)} raw results")
    print(f"[SearchAgent] Merged raw results: {len(raw_shopping_results)}")
    print(f"[SearchAgent] Irrelevant/non-product results removed: {count_non_product}")
    print(f"[SearchAgent] Counterfeit/clone results removed: {count_counterfeit}")
    print(f"[SearchAgent] Accessory results removed: {count_accessory}")
    print(f"[SearchAgent] Duplicate results removed: {count_duplicates}")
    print(f"[SearchAgent] Valid product candidates: {len(normalized_results)}")

    summary_log = (
        f"Search Normalization Layer: {len(raw_shopping_results)} raw -> "
        f"{len(normalized_results)} valid product candidates ({count_counterfeit} counterfeit, {count_accessory} accessory, "
        f"{count_duplicates} duplicates removed, {count_non_product} non-product dropped); "
        f"{len(raw_sentiment_results)} sentiment records -> {len(normalized_review_snippets)} review snippets."
    )
    print(f"[SearchAgent] {summary_log}")

    return {
        "search_results": normalized_results,
        "raw_review_snippets": normalized_review_snippets,
        "logs": [summary_log] + page_logs,
    }
