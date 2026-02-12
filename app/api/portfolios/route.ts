import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { getCurrentUser } from '@/lib/auth'

const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
})

// GET /api/portfolios - Get all portfolios for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await db.query({
      portfolios: {
        $: {
          where: {
            userId: user.id,
          },
        },
      },
    }) as { portfolios: unknown[] }

    return NextResponse.json({ portfolios: data.portfolios })
  } catch (error) {
    console.error('Get portfolios error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    )
  }
}

// POST /api/portfolios - Create a new portfolio
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createPortfolioSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { name, description, isPublic } = result.data
    const portfolioId = crypto.randomUUID()
    const now = Date.now()

    await db.transact([
      db.tx.portfolios[portfolioId].update({
        id: portfolioId,
        userId: user.id,
        name,
        description: description || '',
        isPublic,
        createdAt: now,
      }),
    ])

    return NextResponse.json(
      {
        portfolio: {
          id: portfolioId,
          userId: user.id,
          name,
          description,
          isPublic,
          createdAt: now,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    )
  }
}
