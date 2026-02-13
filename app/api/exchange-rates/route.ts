import { NextResponse } from 'next/server'

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'demo'
const FALLBACK_USD_TO_ILS = 3.65

// Cache for exchange rate (in-memory, resets on server restart)
let cachedRate: { rate: number; timestamp: number; source: string } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function GET() {
  try {
    // Check if we have a valid cached rate
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        rate: cachedRate.rate,
        lastUpdated: new Date(cachedRate.timestamp).toISOString(),
        source: 'cached',
      })
    }

    // Try Bank of Israel API first (most accurate for USD/ILS)
    try {
      const boiUrl = 'https://www.boi.org.il/currency.xml'
      const response = await fetch(boiUrl, {
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const xmlText = await response.text()
        
        // Parse XML to find USD rate
        const usdMatch = xmlText.match(/<CURRENCY>\s*<NAME>Dollar<\/NAME>\s*<UNIT>1<\/UNIT>\s*<CURRENCYCODE>USD<\/CURRENCYCODE>\s*<COUNTRY>USA<\/COUNTRY>\s*<RATE>([\d.]+)<\/RATE>/i)
        
        if (usdMatch && usdMatch[1]) {
          const rate = parseFloat(usdMatch[1])
          
          if (rate && rate > 0) {
            // Cache the rate
            cachedRate = {
              rate,
              timestamp: Date.now(),
              source: 'Bank of Israel',
            }

            return NextResponse.json({
              rate,
              lastUpdated: new Date().toISOString(),
              source: 'Bank of Israel',
            })
          }
        }
      }
    } catch (error) {
      console.error('Bank of Israel API failed:', error)
    }

    // Try exchangeratesapi.io (free tier available)
    try {
      const url = 'https://api.exchangeratesapi.io/latest?base=USD&symbols=ILS'
      const response = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.rates && data.rates.ILS) {
          const rate = data.rates.ILS
          
          // Cache the rate
          cachedRate = {
            rate,
            timestamp: Date.now(),
            source: 'ExchangeRatesAPI',
          }

          return NextResponse.json({
            rate,
            lastUpdated: new Date().toISOString(),
            source: 'ExchangeRatesAPI',
          })
        }
      }
    } catch (error) {
      console.error('ExchangeRatesAPI failed:', error)
    }

    // Try exchangerate-api.com (if API key is configured)
    if (EXCHANGE_RATE_API_KEY && EXCHANGE_RATE_API_KEY !== 'demo') {
      try {
        const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/pair/USD/ILS`
        const response = await fetch(url, {
          cache: 'no-store',
          next: { revalidate: 0 },
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.result === 'success' && data.conversion_rate) {
            const rate = data.conversion_rate
            
            // Cache the rate
            cachedRate = {
              rate,
              timestamp: Date.now(),
              source: 'ExchangeRate-API',
            }

            return NextResponse.json({
              rate,
              lastUpdated: new Date().toISOString(),
              source: 'ExchangeRate-API',
            })
          }
        }
      } catch (error) {
        console.error('ExchangeRate-API failed:', error)
      }
    }

    // Fallback to a reasonable default rate
    console.warn('All APIs failed, using fallback exchange rate')
    
    cachedRate = {
      rate: FALLBACK_USD_TO_ILS,
      timestamp: Date.now(),
      source: 'fallback',
    }

    return NextResponse.json({
      rate: FALLBACK_USD_TO_ILS,
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
    })
  } catch (error) {
    console.error('Exchange rate API error:', error)
    
    return NextResponse.json(
      {
        rate: FALLBACK_USD_TO_ILS,
        lastUpdated: new Date().toISOString(),
        source: 'error',
        error: 'Failed to fetch exchange rate',
      },
      { status: 200 } // Return 200 with fallback rate instead of error
    )
  }
}
