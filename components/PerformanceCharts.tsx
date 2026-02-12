'use client'

import { useState, useEffect } from 'react'
import { type Currency } from '@/lib/currency'
import PortfolioLineChart from './charts/LineChart'
import AssetAllocationPieChart from './charts/PieChart'
import GainsLossesBarChart from './charts/BarChart'

interface Holding {
  symbol: string
  shares: number
  avgBuyPrice: number
}

interface PerformanceChartsProps {
  portfolioId: string
  holdings: Holding[]
  prices: Record<string, number>
  currency: Currency
  exchangeRate: number
}

export default function PerformanceCharts({
  portfolioId,
  holdings,
  prices,
  currency,
  exchangeRate,
}: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'allocation' | 'performance'>('history')
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCharts, setShowCharts] = useState(true)

  useEffect(() => {
    fetchHistoricalData()
  }, [portfolioId])

  const fetchHistoricalData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/portfolio-history?portfolioId=${portfolioId}`)
      if (response.ok) {
        const data = await response.json()
        setHistoricalData(data.snapshots || [])
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare allocation data
  const allocationData = holdings.map((holding) => {
    const currentPrice = prices[holding.symbol] || holding.avgBuyPrice
    return {
      symbol: holding.symbol,
      shares: holding.shares,
      value: holding.shares * currentPrice,
    }
  })

  // Prepare performance data
  const performanceData = holdings.map((holding) => {
    const currentPrice = prices[holding.symbol] || holding.avgBuyPrice
    const totalValue = holding.shares * currentPrice
    const totalCost = holding.shares * holding.avgBuyPrice
    const returnValue = totalValue - totalCost
    const returnPercent = totalCost > 0 ? (returnValue / totalCost) * 100 : 0

    return {
      symbol: holding.symbol,
      returnValue,
      returnPercent,
    }
  })

  const tabs = [
    { id: 'history', label: 'Historical Performance', icon: '📈' },
    { id: 'allocation', label: 'Asset Allocation', icon: '📊' },
    { id: 'performance', label: 'Gains & Losses', icon: '💰' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </button>
      </div>

      {showCharts && (
        <>
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {loading && activeTab === 'history' ? (
              <div className="flex items-center justify-center h-80">
                <div className="text-gray-500">Loading historical data...</div>
              </div>
            ) : (
              <>
                {activeTab === 'history' && (
                  <PortfolioLineChart
                    data={historicalData}
                    currency={currency}
                    exchangeRate={exchangeRate}
                  />
                )}
                {activeTab === 'allocation' && (
                  <AssetAllocationPieChart
                    holdings={allocationData}
                    currency={currency}
                    exchangeRate={exchangeRate}
                  />
                )}
                {activeTab === 'performance' && (
                  <GainsLossesBarChart
                    holdings={performanceData}
                    currency={currency}
                    exchangeRate={exchangeRate}
                  />
                )}
              </>
            )}
          </div>

          {activeTab === 'history' && historicalData.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📊 <strong>Tip:</strong> Portfolio snapshots are automatically created as you use the
                app. Check back later to see your historical performance!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
