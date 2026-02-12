// Stock price service
// Uses multiple free APIs for real-time prices
// Falls back to frequently updated mock prices if APIs fail

interface StockPrice {
  symbol: string
  price: number
  timestamp: number
}

// Get API keys from environment variables
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'demo'
const ALPHA_VANTAGE_KEY = process.env.STOCK_API_KEY

// Updated mock prices - refreshed Feb 2026
const mockPrices: Record<string, number> = {
  AAPL: 232.50,
  GOOGL: 185.30,
  MSFT: 445.20,
  TSLA: 412.25,
  AMZN: 221.90,
  META: 612.60,
  NVDA: 142.40,
  AMD: 125.30,
  NFLX: 928.50,
  SPY: 602.30,
  INTC: 21.54,
  BTC: 98500.00,
  ETH: 3850.00,
}

export async function getStockPrice(symbol: string): Promise<number | null> {
  // Handle CASH as a special case - always return 1.0
  if (symbol.toUpperCase() === 'CASH') {
    return 1.0
  }
  
  // Try Finnhub API (supports free API key from https://finnhub.io/register)
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // Finnhub returns {c: currentPrice, h: high, l: low, o: open, pc: previousClose, t: timestamp}
      if (data.c && data.c > 0) {
        return data.c
      }
    }
  } catch (error) {
    console.error(`Finnhub API failed for ${symbol}:`, error)
  }

  // Try AlphaVantage API as fallback (if API key is available)
  if (ALPHA_VANTAGE_KEY && ALPHA_VANTAGE_KEY !== 'demo') {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_KEY}`
      const response = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (response.ok) {
        const data = await response.json()
        const quote = data['Global Quote']
        if (quote && quote['05. price']) {
          const price = parseFloat(quote['05. price'])
          if (price > 0) {
            return price
          }
        }
      }
    } catch (error) {
      console.error(`AlphaVantage API failed for ${symbol}:`, error)
    }
  }
  
  // Fall back to updated mock prices
  return mockPrices[symbol.toUpperCase()] || null
}

export async function getStockPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}

  // Fetch prices for all symbols
  await Promise.all(
    symbols.map(async (symbol) => {
      const price = await getStockPrice(symbol)
      if (price !== null) {
        prices[symbol.toUpperCase()] = price
      }
    })
  )

  return prices
}

export function calculatePortfolioMetrics(holdings: {
  symbol: string
  shares: number
  avgBuyPrice: number
}[], prices: Record<string, number>) {
  let totalCost = 0
  let totalValue = 0
  let hasPrices = false

  for (const holding of holdings) {
    const cost = holding.shares * holding.avgBuyPrice
    totalCost += cost

    const currentPrice = prices[holding.symbol.toUpperCase()]
    if (currentPrice !== undefined) {
      totalValue += holding.shares * currentPrice
      hasPrices = true
    } else {
      // If no price available, use cost basis
      totalValue += cost
    }
  }

  const totalReturn = totalValue - totalCost
  const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

  return {
    totalCost,
    totalValue,
    totalReturn,
    returnPercent,
    hasPrices,
  }
}
