import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { getCurrentUser } from '@/lib/auth'

const updateHoldingSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase().optional(),
  shares: z.number().positive().optional(),
  avgBuyPrice: z.number().positive().optional(),
})

// PATCH /api/holdings/[id] - Update a holding
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

    // Get holding and verify ownership via portfolio
    const data = await db.query({
      holdings: {
        $: {
          where: {
            id,
          },
        },
      },
    }) as { holdings: { id: string; portfolioId: string }[] }

    const holding = data.holdings[0]

    if (!holding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 })
    }

    // Verify portfolio ownership
    const portfolioData = await db.query({
      portfolios: {
        $: {
          where: {
            id: holding.portfolioId,
          },
        },
      },
    }) as unknown as { portfolios: Array<{ userId?: string }> }

    const portfolio = portfolioData.portfolios[0]

    if (!portfolio || portfolio.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const result = updateHoldingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const updates = {
      ...result.data,
      updatedAt: Date.now(),
    }

    await db.transact([
      db.tx.holdings[id].update(updates),
    ])

    return NextResponse.json({
      holding: {
        ...holding,
        ...updates,
      },
    })
  } catch (error) {
    console.error('Update holding error:', error)
    return NextResponse.json(
      { error: 'Failed to update holding' },
      { status: 500 }
    )
  }
}

// DELETE /api/holdings/[id] - Delete a holding
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

    // Get holding and verify ownership via portfolio
    const data = await db.query({
      holdings: {
        $: {
          where: {
            id,
          },
        },
      },
    }) as { holdings: { id: string; portfolioId: string }[] }

    const holding = data.holdings[0]

    if (!holding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 })
    }

    // Verify portfolio ownership
    const portfolioData = await db.query({
      portfolios: {
        $: {
          where: {
            id: holding.portfolioId,
          },
        },
      },
    }) as unknown as { portfolios: Array<{ userId?: string }> }

    const portfolio = portfolioData.portfolios[0]

    if (!portfolio || portfolio.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.transact([
      db.tx.holdings[id].delete(),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete holding error:', error)
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 }
    )
  }
}
