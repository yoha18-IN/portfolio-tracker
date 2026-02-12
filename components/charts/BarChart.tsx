'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, type Currency } from '@/lib/currency'

interface HoldingPerformance {
  symbol: string
  returnValue: number
  returnPercent: number
}

interface GainsLossesBarChartProps {
  holdings: HoldingPerformance[]
  currency: Currency
  exchangeRate: number
}

export default function GainsLossesBarChart({
  holdings,
  currency,
  exchangeRate,
}: GainsLossesBarChartProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No performance data available</p>
          <p className="text-sm mt-2">
            Holdings performance will be shown here
          </p>
        </div>
      </div>
    )
  }

  // Filter out CASH as it has no returns
  const chartData = holdings
    .filter((h) => h.symbol !== 'CASH')
    .map((holding) => ({
      symbol: holding.symbol,
      return: currency === 'ILS' ? holding.returnValue * exchangeRate : holding.returnValue,
      rawReturn: holding.returnValue,
      returnPercent: holding.returnPercent,
    }))
    .sort((a, b) => b.return - a.return) // Sort by return descending

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No stock holdings yet</p>
          <p className="text-sm mt-2">
            Add some stocks to see performance
          </p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isGain = data.return >= 0
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{data.symbol}</p>
          <p
            className={`text-sm font-medium ${
              isGain ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isGain ? '+' : ''}
            {formatCurrency(Math.abs(data.return), currency, 1)}
          </p>
          <p
            className={`text-sm ${
              isGain ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isGain ? '+' : ''}
            {data.returnPercent.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsBarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="symbol"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) =>
            currency === 'ILS' ? `₪${value.toLocaleString()}` : `$${value.toLocaleString()}`
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
          formatter={() => 'Return'}
        />
        <Bar dataKey="return" name="Return" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.return >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
