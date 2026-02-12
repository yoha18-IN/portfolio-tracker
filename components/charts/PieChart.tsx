'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency, type Currency } from '@/lib/currency'

interface Holding {
  symbol: string
  shares: number
  value: number
}

interface AssetAllocationPieChartProps {
  holdings: Holding[]
  currency: Currency
  exchangeRate: number
}

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#84cc16', // lime
]

export default function AssetAllocationPieChart({
  holdings,
  currency,
  exchangeRate,
}: AssetAllocationPieChartProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No holdings data available</p>
          <p className="text-sm mt-2">
            Add holdings to see your asset allocation
          </p>
        </div>
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)

  const chartData = holdings
    .map((holding) => ({
      name: holding.symbol,
      value: currency === 'ILS' ? holding.value * exchangeRate : holding.value,
      rawValue: holding.value,
      percentage: totalValue > 0 ? (holding.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value) // Sort by value descending

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(data.value, currency, 1)}
          </p>
          <p className="text-sm font-medium text-indigo-600">
            {data.percentage.toFixed(1)}% of portfolio
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null // Don't show label for very small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value, entry: any) => {
            const data = chartData.find((d) => d.name === value)
            return `${value} (${data?.percentage.toFixed(1)}%)`
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
