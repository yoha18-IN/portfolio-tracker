'use client'

import { useState, useEffect } from 'react'
import type { Currency, ExchangeRate } from '@/lib/currency'
import {
  getExchangeRate,
  getPreferredCurrency,
  setPreferredCurrency,
} from '@/lib/currency'

interface CurrencyToggleProps {
  currency: Currency
  exchangeRate: number
  lastUpdated: Date | null
  onCurrencyChange: (currency: Currency, exchangeRate: number) => void
}

export default function CurrencyToggle({
  currency,
  exchangeRate,
  lastUpdated,
  onCurrencyChange,
}: CurrencyToggleProps) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const newCurrency: Currency = currency === 'USD' ? 'ILS' : 'USD'
    setPreferredCurrency(newCurrency)

    // If switching to ILS and we don't have a recent rate, fetch it
    if (newCurrency === 'ILS') {
      setLoading(true)
      try {
        const rate = await getExchangeRate()
        onCurrencyChange(newCurrency, rate.rate)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
        onCurrencyChange(newCurrency, exchangeRate)
      } finally {
        setLoading(false)
      }
    } else {
      onCurrencyChange(newCurrency, exchangeRate)
    }
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return lastUpdated.toLocaleDateString()
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
            currency === 'ILS'
              ? 'bg-indigo-600'
              : 'bg-gray-300'
          }`}
          title={`Switch to ${currency === 'USD' ? 'ILS' : 'USD'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
              currency === 'ILS' ? 'translate-x-9' : 'translate-x-1'
            }`}
          />
          <span
            className={`absolute left-2 text-xs font-medium transition-opacity ${
              currency === 'USD' ? 'text-gray-700' : 'text-white opacity-0'
            }`}
          >
            $
          </span>
          <span
            className={`absolute right-2 text-xs font-medium transition-opacity ${
              currency === 'ILS' ? 'text-white' : 'text-gray-700 opacity-0'
            }`}
          >
            ₪
          </span>
        </button>
        <div className="text-sm">
          <span className="font-medium text-gray-700">
            {currency === 'USD' ? 'USD' : 'ILS'}
          </span>
        </div>
      </div>
      {currency === 'ILS' && (
        <div className="text-xs text-gray-500">
          1 USD = {exchangeRate.toFixed(2)} ILS
          {lastUpdated && <span className="ml-1">({formatLastUpdated()})</span>}
        </div>
      )}
    </div>
  )
}
