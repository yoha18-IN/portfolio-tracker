const GLOBAL_QUOTE_URL = 'https://www.alphavantage.co/query'

/**
 * Fetch current quote for a symbol from Alpha Vantage GLOBAL_QUOTE
 * @param {string} symbol - Stock ticker (e.g. AAPL)
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<{ price: number } | { error: string }>}
 */
export async function fetchQuote(symbol, apiKey) {
  if (!symbol?.trim() || !apiKey?.trim()) {
    return { error: 'Missing symbol or API key' }
  }

  const params = new URLSearchParams({
    function: 'GLOBAL_QUOTE',
    symbol: symbol.trim().toUpperCase(),
    apikey: apiKey.trim(),
  })

  try {
    const res = await fetch(`${GLOBAL_QUOTE_URL}?${params}`)
    if (!res.ok) {
      return { error: `Request failed: ${res.status}` }
    }

    const data = await res.json()

    // Rate limit message from Alpha Vantage
    const note = data['Note']
    if (note && typeof note === 'string' && note.includes('rate limit')) {
      return { error: 'Rate limit exceeded. Please try again in a minute.' }
    }

    const quote = data['Global Quote']
    if (!quote || typeof quote !== 'object') {
      return { error: 'Invalid symbol or no data' }
    }

    const priceStr = quote['05. price']
    if (priceStr == null || priceStr === '') {
      return { error: 'No price in response' }
    }

    const price = parseFloat(priceStr)
    if (Number.isNaN(price)) {
      return { error: 'Invalid price in response' }
    }

    return { price }
  } catch (e) {
    return { error: e.message || 'Network error' }
  }
}

/**
 * Fetch quotes for multiple symbols while respecting Alpha Vantage free tier
 * (5 requests / minute) but doing **parallel batches** of up to 5 symbols.
 *
 * This is much faster than fully serial + delayed calls:
 * - Old behaviour: N symbols = N * delayMs total time
 * - New behaviour: N symbols = ceil(N / batchSize) * delayMs total time
 *
 * Example with default delayMs=12.5s, batchSize=5:
 * - 5 symbols  -> ~12.5s   (was ~62.5s)
 * - 10 symbols -> ~25s     (was ~125s)
 *
 * @param {string[]} symbols
 * @param {string} apiKey
 * @param {number} delayMs - Delay between *batches* (default ~12.5s for 5/min limit)
 * @param {number} batchSize - How many symbols to fetch in parallel per batch
 * @returns {Promise<Record<string, number>>} symbol -> price; failed symbols are omitted
 */
export async function fetchQuotesWithDelay(symbols, apiKey, delayMs = 12500, batchSize = 5) {
  const result = /** @type {Record<string, number>} */ ({})

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return result
  }

  // Process symbols in chunks to keep within free-tier rate limits but
  // still fetch multiple quotes in parallel for better UX.
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map((symbol) => fetchQuote(symbol, apiKey))
    )

    batch.forEach((symbol, idx) => {
      const out = batchResults[idx]
      if (out && 'price' in out) {
        result[symbol.trim().toUpperCase()] = out.price
      }
    })

    // If there are more batches left, wait before the next group
    if (i + batchSize < symbols.length) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return result
}
