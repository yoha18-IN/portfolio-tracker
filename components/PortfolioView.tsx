'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BulkAddHoldings from './BulkAddHoldings'
import CurrencyToggle from './CurrencyToggle'
import PerformanceCharts from './PerformanceCharts'
import { 
  formatCurrency, 
  getExchangeRate, 
  getPreferredCurrency,
  type Currency 
} from '@/lib/currency'

interface Holding {
  id: string
  symbol: string
  shares: number
  avgBuyPrice: number
  createdAt: number
  updatedAt: number
}

interface Portfolio {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: number
}

interface PortfolioViewProps {
  portfolio: Portfolio
  holdings: Holding[]
  isOwner: boolean
}

export default function PortfolioView({
  portfolio: initialPortfolio,
  holdings: initialHoldings,
  isOwner,
}: PortfolioViewProps) {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState(initialPortfolio)
  const [holdings, setHoldings] = useState(initialHoldings)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    symbol: '',
    shares: '',
    avgBuyPrice: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [togglingPublic, setTogglingPublic] = useState(false)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | 'none'>>({})
  const [nextUpdateIn, setNextUpdateIn] = useState(30)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [exchangeRateUpdated, setExchangeRateUpdated] = useState<Date | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        portfolioId: portfolio.id,
        symbol: formData.symbol.toUpperCase(),
        shares: parseFloat(formData.shares),
        avgBuyPrice: parseFloat(formData.avgBuyPrice),
      }

      let response
      if (editingId) {
        response = await fetch(`/api/holdings/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: payload.symbol,
            shares: payload.shares,
            avgBuyPrice: payload.avgBuyPrice,
          }),
        })
      } else {
        response = await fetch('/api/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save holding')
        setLoading(false)
        return
      }

      // Update local state
      if (editingId) {
        setHoldings(holdings.map(h => (h.id === editingId ? data.holding : h)))
        setEditingId(null)
      } else {
        setHoldings([...holdings, data.holding])
      }

      setFormData({ symbol: '', shares: '', avgBuyPrice: '' })
      setShowAddForm(false)
      setLoading(false)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleEdit = (holding: Holding) => {
    setEditingId(holding.id)
    setFormData({
      symbol: holding.symbol,
      shares: holding.shares.toString(),
      avgBuyPrice: holding.avgBuyPrice.toString(),
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holding?')) return

    try {
      const response = await fetch(`/api/holdings/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setHoldings(holdings.filter(h => h.id !== id))
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to delete holding:', err)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ symbol: '', shares: '', avgBuyPrice: '' })
    setShowAddForm(false)
    setError('')
  }

  const handleBulkAddSuccess = () => {
    setShowBulkAdd(false)
    router.refresh()
  }

  const handleBulkAddCancel = () => {
    setShowBulkAdd(false)
  }

  const handleAddCash = () => {
    setShowBulkAdd(false)
    setEditingId(null)
    setFormData({
      symbol: 'CASH',
      shares: '',
      avgBuyPrice: '1.00',
    })
    setShowAddForm(true)
  }

  const handleTogglePublic = async () => {
    setTogglingPublic(true)
    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !portfolio.isPublic }),
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolio(data.portfolio)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to toggle public status:', err)
    } finally {
      setTogglingPublic(false)
    }
  }

  // Fetch prices on mount and set up auto-refresh
  useEffect(() => {
    if (holdings.length > 0 && isLive) {
      // Fetch immediately
      fetchPrices()
      setNextUpdateIn(30)
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPrices()
        setNextUpdateIn(30)
      }, 30000) // 30 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(interval)
    }
  }, [holdings.length, isLive])

  // Countdown timer for next update
  useEffect(() => {
    if (isLive && holdings.length > 0) {
      const timer = setInterval(() => {
        setNextUpdateIn(prev => (prev > 0 ? prev - 1 : 30))
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [isLive, holdings.length])

  // Initialize currency preference and fetch exchange rate
  useEffect(() => {
    const initCurrency = async () => {
      const preferred = getPreferredCurrency()
      setCurrency(preferred)

      if (preferred === 'ILS') {
        const rate = await getExchangeRate()
        setExchangeRate(rate.rate)
        setExchangeRateUpdated(rate.lastUpdated)
      }
    }

    initCurrency()
  }, [])

  // Handle currency change
  const handleCurrencyChange = (newCurrency: Currency, newRate: number) => {
    setCurrency(newCurrency)
    setExchangeRate(newRate)
    setExchangeRateUpdated(new Date())
  }

  const fetchPrices = async (resetTimer = false) => {
    const symbols = [...new Set(holdings.map((h) => h.symbol))]
    if (symbols.length === 0) return

    setLoadingPrices(true)
    if (resetTimer) {
      setNextUpdateIn(30)
    }
    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Track price changes for visual feedback
        const changes: Record<string, 'up' | 'down' | 'none'> = {}
        Object.keys(data.prices).forEach(symbol => {
          const oldPrice = prices[symbol]
          const newPrice = data.prices[symbol]
          if (oldPrice && newPrice !== oldPrice) {
            changes[symbol] = newPrice > oldPrice ? 'up' : 'down'
          } else {
            changes[symbol] = 'none'
          }
        })
        setPriceChanges(changes)
        
        // Clear change indicators after 2 seconds
        setTimeout(() => {
          setPriceChanges({})
        }, 2000)
        
        setPrices(data.prices)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err)
    } finally {
      setLoadingPrices(false)
    }
  }

  const totalCost = holdings.reduce(
    (sum, h) => sum + h.shares * h.avgBuyPrice,
    0
  )

  let totalValue = 0
  let hasPrices = false
  for (const holding of holdings) {
    const price = prices[holding.symbol]
    if (price !== undefined) {
      totalValue += holding.shares * price
      hasPrices = true
    } else {
      totalValue += holding.shares * holding.avgBuyPrice
    }
  }

  const totalReturn = totalValue - totalCost
  const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {portfolio.name}
            </h1>
            {portfolio.description && (
              <p className="text-gray-600">{portfolio.description}</p>
            )}
            <div className="mt-2 flex gap-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm ${
                  portfolio.isPublic
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {portfolio.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleTogglePublic}
                disabled={togglingPublic}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                title={
                  portfolio.isPublic
                    ? 'Make private (remove from leaderboard)'
                    : 'Make public (show on leaderboard)'
                }
              >
                {togglingPublic
                  ? 'Updating...'
                  : portfolio.isPublic
                  ? 'Make Private'
                  : 'Make Public'}
              </button>
              <button
                onClick={handleAddCash}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                title="Add cash/uninvested money"
              >
                💵 Add Cash
              </button>
              <button
                onClick={() => {
                  setShowBulkAdd(!showBulkAdd)
                  setShowAddForm(false)
                  setEditingId(null)
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                + Add Multiple
              </button>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setShowBulkAdd(false)
                  setEditingId(null)
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                + Add Single
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium text-gray-600">Performance</h3>
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                {isLive && holdings.length > 0 && (
                  <span className="text-xs text-gray-400">
                    • Next: {nextUpdateIn}s
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CurrencyToggle
                currency={currency}
                exchangeRate={exchangeRate}
                lastUpdated={exchangeRateUpdated}
                onCurrencyChange={handleCurrencyChange}
              />
              <button
                onClick={() => setIsLive(!isLive)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  isLive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isLive ? 'Auto-Update ON' : 'Auto-Update OFF'}
              </button>
              <button
                onClick={() => fetchPrices(true)}
                disabled={loadingPrices}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {loadingPrices ? 'Refreshing...' : '🔄 Refresh Now'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Holdings</p>
              <p className="text-2xl font-bold text-gray-900">{holdings.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Cost Basis</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalCost, currency, exchangeRate)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Current Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue, currency, exchangeRate)}
              </p>
              {!hasPrices && (
                <p className="text-xs text-gray-500 mt-1">(Using cost basis)</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Return</p>
              <p
                className={`text-2xl font-bold ${
                  totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalReturn >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalReturn), currency, exchangeRate).replace(/^\$|^₪/, totalReturn >= 0 ? (currency === 'ILS' ? '₪' : '$') : (currency === 'ILS' ? '-₪' : '-$'))}
              </p>
              <p
                className={`text-sm font-medium ${
                  returnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {returnPercent >= 0 ? '+' : ''}
                {returnPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <PerformanceCharts
        portfolioId={portfolio.id}
        holdings={holdings}
        prices={prices}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {showBulkAdd && isOwner && (
        <BulkAddHoldings
          portfolioId={portfolio.id}
          onSuccess={handleBulkAddSuccess}
          onCancel={handleBulkAddCancel}
        />
      )}

      {showAddForm && isOwner && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Holding' : 'Add New Holding'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="AAPL"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shares *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.shares}
                  onChange={(e) =>
                    setFormData({ ...formData, shares: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avg Buy Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.avgBuyPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, avgBuyPrice: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="150.00"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No holdings yet</p>
            {isOwner && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Add your first holding
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return
                  </th>
                  {isOwner && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings
                  .sort((a, b) => {
                    // Sort CASH to the top
                    if (a.symbol === 'CASH' && b.symbol !== 'CASH') return -1
                    if (a.symbol !== 'CASH' && b.symbol === 'CASH') return 1
                    return 0
                  })
                  .map((holding) => {
                  const currentPrice = prices[holding.symbol]
                  const isCash = holding.symbol === 'CASH'
                  const totalValue = currentPrice
                    ? holding.shares * currentPrice
                    : holding.shares * holding.avgBuyPrice
                  const totalCost = holding.shares * holding.avgBuyPrice
                  const returnValue = totalValue - totalCost
                  const returnPct =
                    totalCost > 0 ? (returnValue / totalCost) * 100 : 0

                  return (
                    <tr key={holding.id} className={isCash ? 'bg-emerald-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isCash && <span className="text-lg">💵</span>}
                          <span>{holding.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {holding.shares}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatCurrency(holding.avgBuyPrice, currency, exchangeRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {currentPrice !== undefined ? (
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium transition-all duration-200 ${
                                !isCash && priceChanges[holding.symbol] === 'up'
                                  ? 'text-green-600 animate-pulse'
                                  : !isCash && priceChanges[holding.symbol] === 'down'
                                  ? 'text-red-600 animate-pulse'
                                  : ''
                              }`}
                            >
                              {formatCurrency(currentPrice, currency, exchangeRate)}
                            </span>
                            {!isCash && priceChanges[holding.symbol] === 'up' && (
                              <span className="text-green-600 text-xs">↑</span>
                            )}
                            {!isCash && priceChanges[holding.symbol] === 'down' && (
                              <span className="text-red-600 text-xs">↓</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(totalValue, currency, exchangeRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCash ? (
                          <div className="text-gray-500 text-sm">
                            N/A
                          </div>
                        ) : (
                          <>
                            <div
                              className={`font-medium ${
                                returnValue >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {returnValue >= 0 ? '+' : ''}{formatCurrency(Math.abs(returnValue), currency, exchangeRate).replace(/^\$|^₪/, returnValue >= 0 ? (currency === 'ILS' ? '₪' : '$') : (currency === 'ILS' ? '-₪' : '-$'))}
                            </div>
                            <div
                              className={`text-sm ${
                                returnPct >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {returnPct >= 0 ? '+' : ''}
                              {returnPct.toFixed(2)}%
                            </div>
                          </>
                        )}
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(holding)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(holding.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
