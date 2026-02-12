// Currency conversion utilities for USD/ILS

export type Currency = 'USD' | 'ILS'

export interface ExchangeRate {
  rate: number
  lastUpdated: Date
  source: 'api' | 'cached' | 'fallback'
}

const FALLBACK_USD_TO_ILS = 3.65 // Fallback exchange rate
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

// Format currency value based on currency type
export function formatCurrency(
  value: number,
  currency: Currency = 'USD',
  exchangeRate: number = 1
): string {
  const amount = currency === 'ILS' ? value * exchangeRate : value

  if (currency === 'ILS') {
    return `₪${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Convert value from USD to target currency
export function convertCurrency(
  value: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number = 1
): number {
  if (fromCurrency === toCurrency) {
    return value
  }

  if (fromCurrency === 'USD' && toCurrency === 'ILS') {
    return value * exchangeRate
  }

  if (fromCurrency === 'ILS' && toCurrency === 'USD') {
    return value / exchangeRate
  }

  return value
}

// Get exchange rate from API
export async function fetchExchangeRate(): Promise<ExchangeRate> {
  try {
    const response = await fetch('/api/exchange-rates')
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    
    return {
      rate: data.rate,
      lastUpdated: new Date(data.lastUpdated),
      source: data.source || 'api',
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    
    return {
      rate: FALLBACK_USD_TO_ILS,
      lastUpdated: new Date(),
      source: 'fallback',
    }
  }
}

// Cache exchange rate in localStorage
export function cacheExchangeRate(rate: ExchangeRate): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      'exchangeRate',
      JSON.stringify({
        rate: rate.rate,
        lastUpdated: rate.lastUpdated.toISOString(),
        source: rate.source,
      })
    )
  } catch (error) {
    console.error('Error caching exchange rate:', error)
  }
}

// Get cached exchange rate from localStorage
export function getCachedExchangeRate(): ExchangeRate | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem('exchangeRate')
    if (!cached) return null

    const parsed = JSON.parse(cached)
    const lastUpdated = new Date(parsed.lastUpdated)
    const now = new Date()

    // Check if cache is still valid (within 1 hour)
    if (now.getTime() - lastUpdated.getTime() > CACHE_DURATION) {
      return null
    }

    return {
      rate: parsed.rate,
      lastUpdated,
      source: parsed.source,
    }
  } catch (error) {
    console.error('Error getting cached exchange rate:', error)
    return null
  }
}

// Get exchange rate with caching
export async function getExchangeRate(): Promise<ExchangeRate> {
  // Try to get from cache first
  const cached = getCachedExchangeRate()
  if (cached) {
    return cached
  }

  // Fetch fresh rate
  const rate = await fetchExchangeRate()
  cacheExchangeRate(rate)
  
  return rate
}

// Get user's preferred currency from localStorage
export function getPreferredCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD'

  try {
    const preferred = localStorage.getItem('preferredCurrency')
    return (preferred as Currency) || 'USD'
  } catch (error) {
    console.error('Error getting preferred currency:', error)
    return 'USD'
  }
}

// Set user's preferred currency in localStorage
export function setPreferredCurrency(currency: Currency): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('preferredCurrency', currency)
  } catch (error) {
    console.error('Error setting preferred currency:', error)
  }
}
