import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/instantdb-server'
import { getStockPrices, calculatePortfolioMetrics } from '@/lib/prices'

export async function GET(request: NextRequest) {
  try {
    // Fetch all public portfolios with their holdings
    const data = (await db.query({
      portfolios: {
        $: {
          where: {
            isPublic: true,
          },
        },
      },
      holdings: {},
      users: {},
    })) as unknown as {
      portfolios: { id: string; name: string; userId: string; createdAt: number }[]
      holdings: { symbol: string; shares: number; avgBuyPrice: number; portfolioId: string }[]
      users: { id: string; displayName?: string }[]
    }

    // Get all unique symbols
    const allSymbols = [...new Set(data.holdings.map((h) => h.symbol))]
    
    // Fetch prices for all symbols
    const prices = await getStockPrices(allSymbols)

    // Calculate portfolio values and returns
    const portfolioStats = data.portfolios.map((portfolio) => {
      const portfolioHoldings = data.holdings.filter(
        (h) => h.portfolioId === portfolio.id
      )
      
      const metrics = calculatePortfolioMetrics(portfolioHoldings, prices)

      const owner = data.users.find((u) => u.id === portfolio.userId)

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        ownerDisplayName: owner?.displayName || 'Unknown',
        ownerId: portfolio.userId,
        totalCost: metrics.totalCost,
        currentValue: metrics.totalValue,
        totalReturn: metrics.totalReturn,
        returnPercent: metrics.returnPercent,
        holdingsCount: portfolioHoldings.length,
        createdAt: portfolio.createdAt,
        hasPrices: metrics.hasPrices,
      }
    })

    // Sort by return percentage (descending)
    portfolioStats.sort((a, b) => b.returnPercent - a.returnPercent)

    return NextResponse.json({ leaderboard: portfolioStats })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
