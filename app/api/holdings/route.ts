import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { getCurrentUser } from '@/lib/auth'

const createHoldingSchema = z.object({
  portfolioId: z.string(),
  symbol: z.string().min(1).max(10).toUpperCase(),
  shares: z.number().positive(),
  avgBuyPrice: z.number().positive(),
})

// POST /api/holdings - Create a new holding
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createHoldingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { portfolioId, symbol, shares, avgBuyPrice } = result.data

    // Verify portfolio ownership
    const portfolioData = await db.query({
      portfolios: {
        $: {
          where: {
            id: portfolioId,
          },
        },
      },
    }) as unknown as { portfolios: Array<{ userId?: string }> }

    const portfolio = portfolioData.portfolios[0]

    if (!portfolio || portfolio.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const holdingId = crypto.randomUUID()
    const now = Date.now()

    await db.transact([
      db.tx.holdings[holdingId].update({
        id: holdingId,
        portfolioId,
        symbol,
        shares,
        avgBuyPrice,
        createdAt: now,
        updatedAt: now,
      }),
    ])

    return NextResponse.json(
      {
        holding: {
          id: holdingId,
          portfolioId,
          symbol,
          shares,
          avgBuyPrice,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create holding error:', error)
    return NextResponse.json(
      { error: 'Failed to create holding' },
      { status: 500 }
    )
  }
}
