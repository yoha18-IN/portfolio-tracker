import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/instantdb-server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns this portfolio
    const portfolioData = await db.query({
      portfolios: {
        $: {
          where: {
            id: portfolioId,
            userId: user.id,
          },
        },
      },
    })

    const portfolio = (portfolioData as any).portfolios?.[0]
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Fetch snapshots for this portfolio
    const snapshotsData = await db.query({
      portfolioSnapshots: {
        $: {
          where: {
            portfolioId: portfolioId,
          },
        },
      },
    })

    const snapshots = (snapshotsData as any).portfolioSnapshots || []

    // Sort by timestamp
    const sortedSnapshots = snapshots.sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    )

    // Parse holdings snapshots
    const formattedSnapshots = sortedSnapshots.map((snapshot: any) => ({
      id: snapshot.id,
      portfolioId: snapshot.portfolioId,
      timestamp: snapshot.timestamp,
      totalValue: snapshot.totalValue,
      totalCost: snapshot.totalCost,
      holdings: JSON.parse(snapshot.holdingsSnapshot || '[]'),
    }))

    return NextResponse.json({ snapshots: formattedSnapshots })
  } catch (error) {
    console.error('Get portfolio history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { portfolioId, totalValue, totalCost, holdings } = body

    if (!portfolioId || totalValue === undefined || totalCost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns this portfolio
    const portfolioData = await db.query({
      portfolios: {
        $: {
          where: {
            id: portfolioId,
            userId: user.id,
          },
        },
      },
    })

    const portfolio = (portfolioData as any).portfolios?.[0]
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Create snapshot
    const timestamp = Date.now()
    const snapshot = {
      id: crypto.randomUUID(),
      portfolioId,
      timestamp,
      totalValue,
      totalCost,
      holdingsSnapshot: JSON.stringify(holdings || []),
    }

    await db.transact([
      db.tx.portfolioSnapshots[snapshot.id].update(snapshot),
    ])

    return NextResponse.json({ snapshot })
  } catch (error) {
    console.error('Create portfolio snapshot error:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio snapshot' },
      { status: 500 }
    )
  }
}
