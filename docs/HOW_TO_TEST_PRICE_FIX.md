# How to Test the Price Fix

## Quick Test Steps

### 1. Start the Backend Server
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test with a Product Search

Search for any product (e.g., "iPhone 15 Pro", "Nike shoes", "Samsung TV") and:

#### Check the Console Logs
Look for these messages in the backend terminal:

**Successful Price Scraping:**
```
[LiveScraper] ✓ Successfully scraped price ₹69,999 from https://amazon.in/...
[PriceAgent] ✓ Live price updated for iPhone 15 Pro from Amazon: ₹65,999 -> ₹69,999
```

**Failed Price Scraping:**
```
[LiveScraper] ✗ Could not extract price from https://...
[PriceAgent] ✗ Could not scrape live price for Product Name from Store
```

**Summary Statistics:**
```
[PriceAgent] === LIVE SCRAPING SUMMARY ===
[PriceAgent] Successfully scraped: 8/12 products
[PriceAgent] Failed scrapes: 4/12 products
```

#### Verify Prices Match
1. Note the price shown on your website for a product
2. Click "View" to open the original marketplace page
3. Compare the prices - they should now match!

### 4. Test Different Marketplaces

Try searching for products from different stores:
- **Amazon**: "iPhone 15 Pro amazon"
- **Flipkart**: "Samsung TV Flipkart"
- **Myntra**: "Nike shoes Myntra"
- **Croma**: "Sony headphones Croma"

### 5. Check for Price Updates

Look for log messages showing price differences:
```
[PriceAgent] ✓ Live price updated for Product Name from Amazon: ₹499 -> ₹699 (Δ 40.1%)
```

This shows the price was corrected from ₹499 (from search snippet) to ₹699 (from actual website).

## Understanding the Logs

### Good Signs ✓
- High success rate (e.g., "Successfully scraped: 8/10")
- Price updates with reasonable differences (< 50%)
- "is_verified": true in product data

### Warning Signs ⚠️
- Low success rate (e.g., "Successfully scraped: 2/10")
- HTTP errors (403, 429, 503)
- Timeout errors repeatedly for same domain

### Common Issues and Solutions

#### Issue: All scrapes failing for a specific marketplace
**Possible Cause**: Marketplace changed their HTML structure
**Solution**: Update CSS selectors in the `scrape_live_price` function

#### Issue: Timeout errors
**Possible Cause**: Marketplace has slow response times
**Solution**: Increase timeout in code (currently 12 seconds)

#### Issue: HTTP 403/429 errors
**Possible Cause**: Rate limiting or bot detection
**Solution**: 
- Add delays between requests
- Use proxy rotation
- Update User-Agent header

#### Issue: Prices still don't match
**Check**:
1. Is the URL correct? (should point to specific product page)
2. Does the website load in a regular browser?
3. Check browser DevTools to identify the correct CSS selector for price

## Debug Mode

To see more detailed logs, add print statements in the scraping function:

```python
# After successful price extraction
if res_data["price"]:
    print(f"[DEBUG] HTML snippet: {soup.select_one('price-selector')}")
    print(f"[DEBUG] Extracted text: {price_text}")
    print(f"[DEBUG] Clean price: {res_data['price']}")
```

## Environment Variables

You can adjust these in your `.env` file:

```env
# Number of products to process per batch
PRICE_AGENT_BATCH_SIZE=50

# Ollama host for AI processing
OLLAMA_HOST=http://localhost:11434

# SearXNG for search results
SEARXNG_BASE_URL=http://localhost:8080

# Tavily API (fallback)
TAVILY_API_KEY=your_key_here
```

## Performance Tips

1. **Batch Processing**: Products are processed in batches (default: 50). Adjust `PRICE_AGENT_BATCH_SIZE` if needed.

2. **Parallel Scraping**: Live prices are scraped in parallel using asyncio. All product URLs are scraped simultaneously.

3. **Retry Logic**: Failed requests are automatically retried up to 2 times with 1-second delays.

4. **Timeout**: Each request has a 12-second timeout. Adjust if needed:
   ```python
   timeout=12.0  # in scrape_live_price function
   ```

## Expected Behavior

### Before Fix
- Search snippet shows: ₹499
- Actual website shows: ₹699
- **Mismatch!** ❌

### After Fix
- Search snippet shows: ₹499 (initial)
- Live scrape finds: ₹699
- Price updated to: ₹699
- Actual website shows: ₹699
- **Match!** ✓

## Monitoring Success Rate

A healthy system should have:
- **> 70% success rate** for major marketplaces (Amazon, Flipkart)
- **> 50% success rate** overall
- **< 5% timeout errors**

If success rates are lower, investigate:
1. Network connectivity
2. Marketplace blocking/rate-limiting
3. CSS selector changes
4. JavaScript-rendered prices (may need browser automation)

## Next Steps After Testing

1. Monitor logs for pattern of failures
2. Update CSS selectors if marketplaces change their HTML
3. Consider implementing browser automation (Playwright/Selenium) for JavaScript-heavy sites
4. Add price change alerts for users
5. Implement price history tracking
