import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { getCurrentUser } from '@/lib/auth'

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/portfolios/[id] - Get a specific portfolio with holdings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    const data = await db.query({
      portfolios: {
        $: {
          where: {
            id,
          },
        },
      },
      holdings: {
        $: {
          where: {
            portfolioId: id,
          },
        },
      },
    })

    const portfolio = data.portfolios[0]

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Check authorization - must be owner or public
    if (portfolio.userId !== user?.id && !portfolio.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      portfolio,
      holdings: data.holdings,
    })
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

// PATCH /api/portfolios/[id] - Update a portfolio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existingData = await db.query({
      portfolios: {
        $: {
          where: {
            id,
          },
        },
      },
    }) as { portfolios: { id: string; userId: string; [key: string]: any }[] }

    const existingPortfolio = existingData.portfolios[0]

    if (!existingPortfolio || existingPortfolio.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const result = updatePortfolioSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const updates = result.data

    await db.transact([
      db.tx.portfolios[id].update(updates),
    ])

    return NextResponse.json({
      portfolio: {
        ...existingPortfolio,
        ...updates,
      },
    })
  } catch (error) {
    console.error('Update portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    )
  }
}

// DELETE /api/portfolios/[id] - Delete a portfolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const data = await db.query({
      portfolios: {
        $: {
          where: {
            id,
          },
        },
      },
      holdings: {
        $: {
          where: {
            portfolioId: id,
          },
        },
      },
    }) as { portfolios: { userId: string }[]; holdings: { id: string }[] }

    const portfolio = data.portfolios[0]

    if (!portfolio || portfolio.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete all holdings and the portfolio
    const transactions = [
      ...data.holdings.map(h => db.tx.holdings[h.id].delete()),
      db.tx.portfolios[id].delete(),
    ]

    await db.transact(transactions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 }
    )
  }
}
