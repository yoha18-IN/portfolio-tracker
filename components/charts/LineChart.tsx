'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, type Currency } from '@/lib/currency'

interface HistoricalDataPoint {
  timestamp: number
  totalValue: number
  totalCost: number
}

interface PortfolioLineChartProps {
  data: HistoricalDataPoint[]
  currency: Currency
  exchangeRate: number
}

export default function PortfolioLineChart({
  data,
  currency,
  exchangeRate,
}: PortfolioLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No historical data available</p>
          <p className="text-sm mt-2">
            Data will appear here as your portfolio is tracked over time
          </p>
        </div>
      </div>
    )
  }

  const formattedData = data.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: currency === 'ILS' ? point.totalValue * exchangeRate : point.totalValue,
    cost: currency === 'ILS' ? point.totalCost * exchangeRate : point.totalCost,
    timestamp: point.timestamp,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-2">
            {new Date(payload[0].payload.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm font-medium text-indigo-600">
            Value: {formatCurrency(payload[0].value, currency, 1)}
          </p>
          <p className="text-sm font-medium text-gray-600">
            Cost: {formatCurrency(payload[1].value, currency, 1)}
          </p>
          <p className="text-sm font-medium text-green-600 mt-1">
            Return: {formatCurrency(payload[0].value - payload[1].value, currency, 1)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsLineChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
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
        />
        <Line
          type="monotone"
          dataKey="value"
          name="Current Value"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="cost"
          name="Cost Basis"
          stroke="#9ca3af"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: '#9ca3af', r: 3 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
