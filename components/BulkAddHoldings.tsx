'use client'

import { useState } from 'react'

interface HoldingRow {
  id: string
  symbol: string
  shares: string
  avgBuyPrice: string
}

interface BulkAddHoldingsProps {
  portfolioId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function BulkAddHoldings({
  portfolioId,
  onSuccess,
  onCancel,
}: BulkAddHoldingsProps) {
  const [rows, setRows] = useState<HoldingRow[]>([
    { id: '1', symbol: '', shares: '', avgBuyPrice: '' },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        symbol: '',
        shares: '',
        avgBuyPrice: '',
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (
    id: string,
    field: keyof Omit<HoldingRow, 'id'>,
    value: string
  ) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all rows
    const validRows = rows.filter(
      (row) => row.symbol && row.shares && row.avgBuyPrice
    )

    if (validRows.length === 0) {
      setError('Please add at least one complete holding')
      return
    }

    // Check for invalid data
    for (const row of validRows) {
      if (parseFloat(row.shares) <= 0) {
        setError(`Invalid shares for ${row.symbol}`)
        return
      }
      if (parseFloat(row.avgBuyPrice) <= 0) {
        setError(`Invalid price for ${row.symbol}`)
        return
      }
    }

    setLoading(true)

    try {
      // Create holdings one by one (could be optimized with a bulk API endpoint)
      const results = await Promise.all(
        validRows.map((row) =>
          fetch('/api/holdings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              portfolioId,
              symbol: row.symbol.toUpperCase(),
              shares: parseFloat(row.shares),
              avgBuyPrice: parseFloat(row.avgBuyPrice),
            }),
          })
        )
      )

      // Check if all succeeded
      const failedCount = results.filter((r) => !r.ok).length

      if (failedCount > 0) {
        setError(`Failed to add ${failedCount} holding(s)`)
        setLoading(false)
        return
      }

      // Success!
      onSuccess()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Add Multiple Holdings
        </h2>
        <button
          type="button"
          onClick={addRow}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Add Row
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Symbol *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Shares *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Price *
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.symbol}
                      onChange={(e) =>
                        updateRow(row.id, 'symbol', e.target.value.toUpperCase())
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="AAPL"
                      maxLength={10}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.shares}
                      onChange={(e) =>
                        updateRow(row.id, 'shares', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.avgBuyPrice}
                      onChange={(e) =>
                        updateRow(row.id, 'avgBuyPrice', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="150.00"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            {loading
              ? 'Adding...'
              : `Add ${rows.filter((r) => r.symbol).length} Holding(s)`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
